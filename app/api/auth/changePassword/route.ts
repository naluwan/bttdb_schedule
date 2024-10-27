import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import bcrypt from 'bcryptjs';
import { authenticateToken, checkAdminAndAdministrative } from '@/lib/authMiddleware';

connect();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 獲取並驗證Token
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
    const { userId, oldPass, newPass, checkNewPass } = await req.json();

    if (newPass !== checkNewPass) {
      return NextResponse.json({ status: 400, message: '新密碼與確認新密碼不符合' });
    }

    try {
      // 查驗是否為admin，admin才可修改他人密碼
      checkAdminAndAdministrative(user);

      // 修改指定員工密码
      const employee = await Employee.findById(userId);
      if (!employee) {
        return NextResponse.json({ status: 404, message: '查無此員工' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPass, salt);

      employee.password = hashedPassword;
      employee.updatedBy = user._id;

      await employee.save();

      return NextResponse.json({ message: '密碼修改成功', status: 200 });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === '權限不足') {
          // 如果不是管理員，只能修改自己的密碼
          if (String(user._id) !== userId) {
            return NextResponse.json({
              status: 403,
              message: '權限不足',
            });
          }

          // 檢查舊密碼是否正確
          const employee = await Employee.findById(userId);
          if (!employee) {
            return NextResponse.json({ status: 404, message: '無此員工' });
          }

          const isMatch = await bcrypt.compare(oldPass, employee.password);
          if (!isMatch) {
            return NextResponse.json({ status: 400, message: '舊密碼錯誤' });
          }

          // 更新密码
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPass, salt);

          employee.password = hashedPassword;
          employee.updatedBy = user._id;

          await employee.save();

          return NextResponse.json({ message: '密碼修改成功', status: 200 });
        } else {
          return NextResponse.json({ status: 403, message: err.message });
        }
      } else {
        return NextResponse.json({ status: 500, message: '系統錯誤' });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('[CHANGE PASSWORD]', error.message);
    } else {
      console.error('[CHANGE PASSWORD] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
