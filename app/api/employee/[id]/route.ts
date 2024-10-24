import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkAdminAndAdministrative } from '@/lib/authMiddleware';
import Employee from '@/models/Employee';
import EmergencyContact from '@/models/EmergencyContact';

connect();

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params;
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

    let employeeData;

    // 僅超級帳號可以看到自己的資料
    if (String(user._id) === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
      employeeData = await Employee.findOne({
        _id: id,
      })
        .select('-password')
        .populate('updatedBy', 'name')
        .exec();
    } else {
      employeeData = await Employee.findOne({
        _id: id,
        name: { $ne: 'ADMIN' },
      })
        .select('-password')
        .populate('updatedBy', 'name')
        .exec();
    }

    await Employee.populate(employeeData, {
      path: 'emergencyContact',
      model: 'EmergencyContact',
    });

    return NextResponse.json({ status: 200, data: employeeData });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[EMPLOYEE]', error.message);
    } else {
      console.error('[EMPLOYEE] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}

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

    // 獲取資訊
    const {
      _id,
      name,
      birthday,
      address,
      phone,
      role,
      id,
      emergencyId,
      emergencyName,
      emergencyPhone,
      emergencyRelationship,
      dateEmployed,
    } = await req.json();

    if (
      !name ||
      !birthday ||
      !address ||
      !phone ||
      !role ||
      !emergencyName ||
      !emergencyPhone ||
      !emergencyRelationship ||
      !dateEmployed
    ) {
      return NextResponse.json({ status: 400, message: '請輸入完整資訊' });
    }

    try {
      // 查驗是否為admin或行政，admin或行政才可修改他人資訊
      checkAdminAndAdministrative(user);

      let emergencyContact;
      emergencyContact = await EmergencyContact.findById(
        emergencyId === '' ? null : emergencyId,
      );

      if (!emergencyContact) {
        emergencyContact = new EmergencyContact({
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelationship,
        });
      } else {
        emergencyContact.name = emergencyName;
        emergencyContact.phone = emergencyPhone;
        emergencyContact.relationship = emergencyRelationship;
      }

      await emergencyContact.save();

      // 修改指定員工資訊
      const employee = await Employee.findById(_id);
      if (!employee) {
        return NextResponse.json({ status: 404, message: '查無此員工' });
      }

      employee.name = name;
      employee.id = id;
      employee.birthday = birthday;
      employee.dateEmployed = dateEmployed;
      employee.phone = phone;
      employee.address = address;
      employee.role = role;
      employee.emergencyContact = emergencyContact._id;
      employee.updatedBy = user._id;

      await employee.save();

      return NextResponse.json({ message: `${name} 資料更新成功`, status: 200 });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === '權限不足') {
          // 如果不是管理員或行政，只能修改自己的資料
          if (user.id !== _id) {
            return NextResponse.json({
              status: 403,
              message: '權限不足',
            });
          }

          // 尋找自己的員工資料
          const employee = await Employee.findById(_id);
          if (!employee) {
            return NextResponse.json({ status: 404, message: '無此員工' });
          }

          employee.name = name;
          employee.birthday = birthday;
          employee.phone = phone;
          employee.address = address;
          employee.updatedBy = user._id;

          await employee.save();

          return NextResponse.json({ message: `${name} 資料更新成功`, status: 200 });
        } else {
          return NextResponse.json({ status: 403, message: err.message });
        }
      } else {
        return NextResponse.json({ status: 500, message: '系統錯誤' });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('[EMPLOYEE]', error.message);
    } else {
      console.error('[EMPLOYEE] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
