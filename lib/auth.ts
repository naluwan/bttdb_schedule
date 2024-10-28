import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connect from '@/lib/mongodb';
import Employee from '@/models/Employee';

connect();

export interface AuthenticatedRequest extends NextRequest {
  user?: typeof Employee.prototype; // 根据 Employee 模型定义 user 的类型
}

export async function verifyToken(req: AuthenticatedRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ status: 401, message: '無Token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ status: 401, message: '無效Token' });
    }

    // const user = await Employee.findById(decoded.id).select('-password');
    const user = await Employee.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ status: 401, message: '無此員工' });
    }

    req.user = user;
    return null;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      // 捕获TokenExpiredError并返回适当的响应
      return NextResponse.json({ status: 401, message: 'Token已過期' });
    } else {
      // 捕获其他可能的错误
      console.log('[VERIFY]', err);
      return NextResponse.json({ status: 500, message: '無效Token或其他錯誤' });
    }
  }
}
