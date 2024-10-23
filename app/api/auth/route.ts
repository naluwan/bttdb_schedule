import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import passport from '@/lib/passport';
import { EmployeeType } from '@/models/Employee';

connect();

export async function POST(req: NextRequest): Promise<void | NextResponse> {
  try {
    const body = await req.json();

    return new Promise((resolve) => {
      passport.authenticate(
        'local',
        { session: false },
        (
          err: Error | null,
          employee: { user: EmployeeType; token: string } | false,
          info?: { message: string },
        ) => {
          if (err || !employee) {
            resolve(
              NextResponse.json({
                status: 401,
                message: info?.message || '帳號或密碼錯誤',
              }),
            );
            return;
          }

          const response = NextResponse.json({
            token: employee.token,
            user: employee.user,
            status: 200,
          });

          resolve(response);
        },
      )(
        {
          ...req,
          body, // 将请求体传递给 Passport
        },
        {} as unknown, // 由于 Next.js 不使用标准的 Express Response，因此这里使用空对象
      );
    });
  } catch (err) {
    console.log('[LOGIN]', err);
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
