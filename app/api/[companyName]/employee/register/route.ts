import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import bcrypt from 'bcryptjs';
import { authenticateToken, checkAdminAndSuperAdmin } from '@/lib/authMiddleware';
import Company from '@/models/Company';

connect();

export async function POST(
  req: Request,
  { params }: { params: { companyName: string } },
): Promise<NextResponse> {
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

    const { companyName } = params;

    const company = await Company.findOne({ enName: companyName });

    if (!company) {
      return NextResponse.json({
        status: 404,
        message: '查無此公司，請確認網址是否正確',
      });
    }

    // 獲取並處理請求
    const { name, email, phone, role, dateEmployed, id, nickname } = await req.json();

    if (!name || !email || !phone || !role || !dateEmployed || !id || !nickname) {
      return NextResponse.json({ status: 400, message: '所有欄位都是必填的' });
    }

    const existingEmployee = await Employee.findOne({ email });

    if (existingEmployee) {
      return NextResponse.json({ status: 400, message: '信箱已存在' });
    }

    const defaultPassword = 'BTTDB1234';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // 建立新員工
    const newEmployee = new Employee({
      name,
      nickname,
      email,
      password: hashedPassword,
      phone,
      role,
      id,
      dateEmployed,
      company: company._id,
      updatedBy: user._id,
    });

    await newEmployee.save();
    return NextResponse.json({ message: '員工創建成功', status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[EMPLOYEE REGISTER]', error.message);
    } else {
      console.error('[EMPLOYEE REGISTER] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
