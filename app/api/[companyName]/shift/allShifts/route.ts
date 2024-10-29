import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken } from '@/lib/authMiddleware';
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

    const shiftData = await Shift.find({ company: company._id })
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
