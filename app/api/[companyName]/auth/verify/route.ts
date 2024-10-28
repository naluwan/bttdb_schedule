import { NextResponse } from 'next/server';
import { verifyToken, AuthenticatedRequest } from '@/lib/auth';
import connect from '@/lib/mongodb';

connect();

export async function POST(req: AuthenticatedRequest) {
  // 验证 JWT
  const tokenVerification = await verifyToken(req);
  if (tokenVerification) {
    return tokenVerification; // 驗證失敗返回錯誤
  }

  // 驗證成功後的user
  const user = req.user;

  // 返回user
  return NextResponse.json({ status: 200, message: '驗證成功', user });
}
