import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkAdminAndSuperAdmin } from '@/lib/authMiddleware';
import Shift from '@/models/Shift';
import Company from '@/models/Company';
import { toZonedTime } from 'date-fns-tz';
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

    const timeZone = 'Asia/Taipei';

    const shiftData = await Shift.find({ company: company._id, isComplete: true })
      .populate({
        path: 'employee',
        select: '-password',
      })
      .exec();

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

export async function PATCH(
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

    // 檢查是否為admin和super-admin
    try {
      checkAdminAndSuperAdmin(user);
    } catch (err) {
      if (err instanceof Error) {
        return NextResponse.json({ status: 403, message: err.message });
      }
      return NextResponse.json({ status: 403, message: '權限不足' });
    }

    // 獲取公司資料
    const company = await Company.findOne({ enName: companyName });

    if (!company) {
      return NextResponse.json({
        status: 404,
        message: '查無公司資料，請確認網址是否正確',
      });
    }

    // 獲取請求中的 month 資料
    const { month } = await req.json();
    if (!month) {
      return NextResponse.json({
        status: 400,
        message: '請提供月份',
      });
    }

    // 找到符合條件的班別
    const shiftData = await Shift.find({ company: company._id, month });
    if (shiftData.length === 0) {
      return NextResponse.json({
        status: 404,
        message: '查無排班資料',
      });
    }

    // 更新排班資料，切換 isComplete 狀態
    const updatedShifts = [];
    for (const shift of shiftData) {
      shift.isComplete = !shift.isComplete;
      updatedShifts.push(shift.save());
    }

    // 等待所有更新完成
    await Promise.all(updatedShifts);

    return NextResponse.json({
      status: 200,
      message: `已更新 ${updatedShifts.length} 筆排班資料的完成狀態`,
    });
  } catch (error) {
    console.error(
      '[SHIFT COMPLETE PATCH]',
      error instanceof Error ? error.message : error,
    );
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
