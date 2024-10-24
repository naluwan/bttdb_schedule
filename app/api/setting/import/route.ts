import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkSuperAdmin } from '@/lib/authMiddleware';
import Setting from '@/models/Setting';

connect();

export async function PATCH(req: Request): Promise<NextResponse> {
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
      checkSuperAdmin(user);
    } catch (err) {
      if (err instanceof Error && err.message === '權限不足') {
        return NextResponse.json({
          status: 403,
          message: '權限不足',
        });
      }
      return NextResponse.json({ status: 500, message: '系統錯誤' });
    }

    // 找到setting設定檔
    const setting = await Setting.findOne();

    if (!setting) {
      return NextResponse.json({
        status: 404,
        message: '未找到設定檔',
      });
    }

    // 更新import的值
    setting.import = !setting.import;
    await setting.save();

    return NextResponse.json({
      status: 200,
      message: '設定已更新',
      data: setting,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[SETTING IMPORT]', error.message);
    } else {
      console.error('[SETTING IMPORT] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
