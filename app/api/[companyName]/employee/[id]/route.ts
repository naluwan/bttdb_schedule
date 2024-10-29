import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkAdminAndSuperAdmin } from '@/lib/authMiddleware';
import Employee from '@/models/Employee';
import EmergencyContact from '@/models/EmergencyContact';
import Company from '@/models/Company';

connect();

export async function GET(
  req: Request,
  { params }: { params: { id: string; companyName: string } },
): Promise<NextResponse> {
  const { id, companyName } = params;
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

    // 僅超級帳號可以看到自己的資料
    if (String(user._id) === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
      employeeData = await Employee.findOne({
        _id: id,
        company: company._id,
      })
        .populate('updatedBy', 'name')
        .exec();
    } else {
      employeeData = await Employee.findOne({
        _id: id,
        name: { $ne: '碩亨' },
      })
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
      console.error('[EMPLOYEE ID GET]', error.message);
    } else {
      console.error('[EMPLOYEE ID GET] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}

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
      checkAdminAndSuperAdmin(user);

      const company = await Company.findOne({ enName: companyName });

      if (!company) {
        return NextResponse.json({
          status: 404,
          message: '查無此公司，請確認網址是否正確',
        });
      }

      // 修改指定員工資訊
      const employee = await Employee.findById(_id);
      if (!employee) {
        return NextResponse.json({ status: 404, message: '查無此員工' });
      }

      if (
        String(employee.company) !== String(company._id) &&
        user.role !== 'super-admin' &&
        user.role !== 'admin'
      ) {
        return NextResponse.json({
          status: 403,
          message: '權限不足',
        });
      }

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
          if (String(user._id) !== _id) {
            return NextResponse.json({
              status: 403,
              message: '權限不足',
            });
          }

          const company = await Company.findOne({ enName: companyName });

          if (!company) {
            return NextResponse.json({
              status: 404,
              message: '查無此公司，請確認網址是否正確',
            });
          }

          // 尋找自己的員工資料
          const employee = await Employee.findById(_id);
          if (!employee) {
            return NextResponse.json({ status: 404, message: '無此員工' });
          }

          if (String(employee.company) !== String(company._id)) {
            return NextResponse.json({
              status: 403,
              message: '非該公司員工，請確認網址是否正確',
            });
          }

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

          employee.name = name;
          employee.birthday = birthday;
          employee.phone = phone;
          employee.address = address;
          employee.emergencyContact = emergencyContact._id;
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
      console.error('[EMPLOYEE ID PATCH]', error.message);
    } else {
      console.error('[EMPLOYEE ID PATCH] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
