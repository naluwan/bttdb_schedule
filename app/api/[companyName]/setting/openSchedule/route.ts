import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkAdminAndSuperAdmin } from '@/lib/authMiddleware';
import Setting from '@/models/Setting';
import Company from '@/models/Company';

connect();

export async function PATCH(
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

    try {
      checkAdminAndSuperAdmin(user);
    } catch (err) {
      if (err instanceof Error && err.message === '權限不足') {
        return NextResponse.json({
          status: 403,
          message: '權限不足',
        });
      }
      return NextResponse.json({ status: 500, message: '系統錯誤' });
    }

    const company = await Company.findOne({ enName: companyName });

    if (!company) {
      return NextResponse.json({
        status: 404,
        message: '查無此公司，請確認網址是否正確',
      });
    }

    const setting = await Setting.findOne({ company: company._id });

    if (!setting) {
      return NextResponse.json({
        status: 404,
        message: '未找到設定檔',
      });
    }

    // 更新isOpenSchedule的值
    setting.isOpenSchedule = !setting.isOpenSchedule;
    await setting.save();

    return NextResponse.json({
      status: 200,
      message: '設定已更新',
      data: setting,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[SETTING OPEN SCHEDULE PATCH]', error.message);
    } else {
      console.error('[SETTING OPEN SCHEDULE PATCH] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
