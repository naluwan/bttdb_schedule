import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkAdminAndSuperAdmin } from '@/lib/authMiddleware';
import Shift from '@/models/Shift';
import mongoose from 'mongoose';
import Company from '@/models/Company';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

connect();

export async function GET(
  req: Request,
  { params }: { params: { companyName: string } },
): Promise<NextResponse> {
  const { companyName } = params;

  try {
    // 獲取並驗證JWT Token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json({ status: 401, message: '請先登入' });
    }

    const user = await authenticateToken(token);

    if (!user) {
      return NextResponse.json({ status: 403, message: 'Token已過期' });
    }

    const company = await Company.findOne({ enName: companyName });

    if (!company) {
      return NextResponse.json({
        status: 404,
        message: '查無公司資料，請確認網址是否正確',
      });
    }

    let shiftData;
    const timeZone = 'Asia/Taipei';

    if (user.role === 'admin' || user.role === 'super-admin') {
      shiftData = await Shift.find({ company: company._id })
        .populate({
          path: 'employee',
          select: '-password',
        })
        .exec();
    } else {
      shiftData = await Shift.find({
        company: company._id,
        $or: [
          { employee: user._id }, // 獲取自己的班別
          { isAvailable: false }, // 獲取其他人休假的班別
        ],
      })
        .populate({
          path: 'employee',
          select: '-password',
        })
        .exec();
    }

    // 將 shiftData 中的 startDate 和 endDate 轉換為台北時間
    const localizedShiftData = shiftData.map((shift) => ({
      ...shift.toObject(),
      startDate: toZonedTime(shift.startDate, timeZone),
      endDate: toZonedTime(shift.endDate, timeZone),
    }));

    return NextResponse.json({ status: 200, data: localizedShiftData });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[SHIFT GET]', error.message);
    } else {
      console.error('[SHIFT GET] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { companyName: string } },
): Promise<NextResponse> {
  const { companyName } = params;

  try {
    // 驗證JWT Token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ status: 401, message: '請先登入' });
    }

    const user = await authenticateToken(token);
    if (!user) {
      return NextResponse.json({ status: 403, message: 'Token已過期' });
    }

    // 檢查是否為admin和super-admin
    try {
      checkAdminAndSuperAdmin(user);
    } catch (err) {
      if (err instanceof Error) {
        return NextResponse.json({ status: 403, message: err.message });
      }
      return NextResponse.json({ status: 403, message: '權限不足' });
    }

    const company = await Company.findOne({ enName: companyName });
    if (!company) {
      return NextResponse.json({
        status: 404,
        message: '查無公司資料，請確認網址是否正確',
      });
    }

    const { startDate, endDate, isAvailable, employee, month } = await req.json();

    if (!startDate || !endDate || typeof isAvailable !== 'boolean' || !employee) {
      return NextResponse.json({ status: 400, message: '資料有誤，請重新嘗試' });
    }

    const timeZone = 'Asia/Taipei';

    // 使用 toZonedTime 將 startDate 和 endDate 轉換為指定時區
    const localStartDate = toZonedTime(new Date(startDate), timeZone);
    const localEndDate = toZonedTime(new Date(endDate), timeZone);

    // 使用 formatInTimeZone 進行格式化，保證轉換後的時區
    const formattedStartDate = formatInTimeZone(
      localStartDate,
      timeZone,
      'yyyy-MM-dd HH:mm:ssXXX',
    );
    const formattedEndDate = formatInTimeZone(
      localEndDate,
      timeZone,
      'yyyy-MM-dd HH:mm:ssXXX',
    );

    // 檢查並更新或創建新排班
    const isShiftExist = await Shift.findOne({ startDate: formattedStartDate, employee });
    if (isShiftExist) {
      isShiftExist.isAvailable = isAvailable;
      await isShiftExist.save();
      return NextResponse.json({ message: '班別更新成功', status: 201 });
    }

    const newShift = new Shift({
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      isAvailable,
      employee,
      month,
      company: company._id,
      isComplete: false,
      scheduleType: 'manual',
    });
    await newShift.save();

    return NextResponse.json({ message: '排班成功', status: 201 });
  } catch (error) {
    console.error('[SHIFT POST]', error instanceof Error ? error.message : error);
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}

export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    // 獲取並驗證JWT Token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json({ status: 401, message: '請先登入' });
    }

    const user = await authenticateToken(token);

    if (!user) {
      return NextResponse.json({ status: 403, message: 'Token已過期' });
    }

    // 獲取資訊
    const { _id, start, end, isAvailable, employee } = await req.json();

    if (!_id || !start || !end || !employee || typeof isAvailable !== 'boolean') {
      return NextResponse.json({ status: 400, message: '資料有誤，請重新嘗試' });
    }

    const isShiftExist = await Shift.findOne({ _id });

    if (!isShiftExist) {
      return NextResponse.json({ status: 404, message: '無此班別' });
    }

    isShiftExist.isAvailable = isAvailable;
    await isShiftExist.save();

    return NextResponse.json({ message: '班別更新成功', status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[SHIFT PATCH]', error.message);
    } else {
      console.error('[SHIFT PATCH] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}

export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    // 獲取並驗證JWT Token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json({ status: 401, message: '請先登入' });
    }

    const user = await authenticateToken(token);

    if (!user) {
      return NextResponse.json({ status: 403, message: 'Token已過期' });
    }

    const { shiftId } = await req.json();

    // 檢查 shiftId 是否存在
    if (!shiftId) {
      return NextResponse.json({ status: 400, message: '缺少班別ID' });
    }

    // 檢查 shiftId 格式是否合法（確保為 ObjectId）
    if (!mongoose.Types.ObjectId.isValid(shiftId)) {
      return NextResponse.json({ status: 400, message: '班別ID無效' });
    }

    // 嘗試刪除班別
    const deletedShift = await Shift.findByIdAndDelete(shiftId);

    if (!deletedShift) {
      return NextResponse.json({ status: 404, message: '查無班別，請重新嘗試' });
    }

    return NextResponse.json({ status: 200, message: '班別刪除成功' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[SHIFT DELETE]', error.message);
    } else {
      console.error('[SHIFT DELETE] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
