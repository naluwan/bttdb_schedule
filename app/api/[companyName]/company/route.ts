import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken } from '@/lib/authMiddleware';
import Company from '@/models/Company';

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
        message: '查無此公司，請確認網址是否正確',
      });
    }

    return NextResponse.json({ status: 200, data: company });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[COMPANY DATA GET]', error.message);
    } else {
      console.error('[COMPANY DATA GET] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
