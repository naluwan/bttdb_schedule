import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
// import { authenticateToken, checkSuperAdmin } from '@/lib/authMiddleware';
import Company from '@/models/Company';

connect();

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // 獲取並驗證JWT Token
    // const authHeader = req.headers.get('Authorization');
    // const token = authHeader && authHeader.split(' ')[1];

    // if (!token) {
    //   return NextResponse.json({ status: 401, message: '請先登入' });
    // }

    // const user = await authenticateToken(token);

    // if (!user) {
    //   return NextResponse.json({ status: 403, message: 'Token已過期' });
    // }

    // // 檢查是否為admin和super-admin
    // try {
    //   checkSuperAdmin(user);
    // } catch (err) {
    //   if (err instanceof Error) {
    //     return NextResponse.json({ status: 403, message: err.message });
    //   }
    //   return NextResponse.json({ status: 403, message: '權限不足' });
    // }

    // 獲取並處理請求
    const { name, nickName, enName, email, phone, address, id, isLocked } =
      await req.json();

    if (!name || !email || !phone || !nickName || !enName || !id || !address) {
      return NextResponse.json({ status: 400, message: '所有欄位都是必填的' });
    }

    const isCompanyExist = await Company.findOne({ name, id });

    if (isCompanyExist) {
      return NextResponse.json({ status: 400, message: '公司已存在' });
    }

    const newCompany = new Company({
      id,
      name,
      nickName,
      enName,
      email,
      phone,
      address,
      isLocked,
    });

    await newCompany.save();

    return NextResponse.json({ message: '公司創建成功', status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[COMPANY REGISTER]', error.message);
    } else {
      console.error('[COMPANY REGISTER] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
