import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/mongodb';

connect();

export async function POST(req: NextRequest): Promise<void | NextResponse> {
  try {
    const { ipAddress } = await req.json();
    if (!ipAddress.startsWith(process.env.IP_RANGE)) {
      return NextResponse.json({
        message: '請連接店舖WIFI在進行打卡',
        status: 400,
        isValid: false,
      });
    }

    return NextResponse.json({
      message: '網路驗證成功',
      status: 201,
      isValid: true,
    });
  } catch (err) {
    console.log('[VERIFY NETWORK]', err);
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
