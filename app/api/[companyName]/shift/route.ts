import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkAdmin } from '@/lib/authMiddleware';
import Shift from '@/models/Shift';
import mongoose from 'mongoose';

connect();

export async function GET(req: Request): Promise<NextResponse> {
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

    let shiftData;

    if (user.role === 'admin') {
      shiftData = await Shift.find()
        .populate({
          path: 'employee', // 關聯的字段是 employee
          select: '-password', // 排除 employee 中的 password 欄位
        })
        .exec();
    } else {
      shiftData = await Shift.find({ employee: user._id })
        .populate({
          path: 'employee', // 關聯的字段是 employee
          select: '-password', // 排除 employee 中的 password 欄位
        })
        .exec();
    }

    return NextResponse.json({ status: 200, data: shiftData });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[SHIFT GET]', error.message);
    } else {
      console.error('[SHIFT GET] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
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

    // 獲取並處理請求
    const { startDate, endDate, isAvailable, employee, month } = await req.json();

    if (!startDate || !endDate || typeof isAvailable !== 'boolean' || !employee) {
      return NextResponse.json({ status: 400, message: '資料有誤，請重新嘗試' });
    }

    const isShiftExist = await Shift.findOne({ startDate, employee });

    if (isShiftExist) {
      isShiftExist.isAvailable = isAvailable;
      await isShiftExist.save();
      return NextResponse.json({ message: '班別更新成功', status: 201 });
    }

    const newShift = new Shift({
      startDate,
      endDate,
      isAvailable,
      employee,
      month,
      scheduleType: 'manual',
    });
    await newShift.save();

    return NextResponse.json({ message: '排班成功', status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[SHIFT POST]', error.message);
    } else {
      console.error('[SHIFT POST] Unknown error:', error);
    }
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
