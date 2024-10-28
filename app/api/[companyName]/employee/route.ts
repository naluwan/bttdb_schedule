import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkAdminAndSuperAdmin } from '@/lib/authMiddleware';
import Employee from '@/models/Employee';
import EmergencyContact from '@/models/EmergencyContact';
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

    let employeeData;

    if (String(user._id) === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
      employeeData = await Employee.find({ company: company._id })
        .select('-password')
        .populate('updatedBy', 'name')
        .exec();
    } else {
      employeeData = await Employee.find({
        company: company._id,
        _id: { $ne: process.env.NEXT_PUBLIC_SUPER_ADMIN_ID },
      })
        .select('-password')
        .populate('updatedBy', 'name')
        .exec();
    }

    await Employee.populate(employeeData, {
      path: 'emergencyContact',
      model: EmergencyContact,
    });

    return NextResponse.json({ status: 200, data: employeeData });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[EMPLOYEE DATA GET]', error.message);
    } else {
      console.error('[EMPLOYEE DATA GET] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}

export async function PUT(
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

    // 查驗是否為admin或行政
    try {
      checkAdminAndSuperAdmin(user);
    } catch (err) {
      if (err instanceof Error && err.message === '權限不足') {
        return NextResponse.json({
          status: 403,
          message: '只有管理員或行政可以操作此功能',
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

    // 獲取資訊
    const { _id, isLock } = await req.json();

    if (String(user._id) === _id) {
      return NextResponse.json({ status: 500, message: '無法鎖定自己的帳號' });
    }

    // 查找指定員工
    const employee = await Employee.findById(_id);
    if (!employee) {
      return NextResponse.json({ status: 404, message: '查無此員工' });
    }

    if (String(employee.company) !== String(company._id) && user.role !== 'super-admin') {
      return NextResponse.json({
        status: 403,
        message: '權限不足，請確認是否為該公司員工',
      });
    }

    if (
      user.role !== 'admin' &&
      user.role !== 'super-admin' &&
      employee.role === 'admin'
    ) {
      return NextResponse.json({ status: 403, message: '權限不足' });
    }

    // 更新鎖定狀態和更新人員
    employee.isLock = !isLock;
    employee.updatedBy = user._id;

    await employee.save();

    return NextResponse.json({
      message: `${employee.name} ${!isLock ? ' 已鎖定' : ' 已解鎖'}`,
      status: 200,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[EMPLOYEE LOCK PUT]', error.message);
    } else {
      console.error('[EMPLOYEE LOCK PUT] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
