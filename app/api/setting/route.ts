import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken } from '@/lib/authMiddleware';
import Setting from '@/models/Setting';

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

    const setting = await Setting.findOne();

    return NextResponse.json({ status: 200, data: setting });
  } catch (err) {
    if (err instanceof Error) {
      console.error('[SETTING]', err.message);
    } else {
      console.error('[SETTING] Unknown error:', err);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
