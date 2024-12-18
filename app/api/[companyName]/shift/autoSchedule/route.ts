import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import { authenticateToken, checkAdminAndSuperAdmin } from '@/lib/authMiddleware';
import Shift, { ShiftType } from '@/models/Shift';
import Company from '@/models/Company';
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const timeZone = 'Asia/Taipei';
connect();

// 全域變數用來追蹤進度
let progress = 0;

type EmployeeType = {
  name: string;
  employeeId: string;
  status: '上班' | '休假';
};

export async function POST(
  req: Request,
  { params }: { params: { companyName: string } },
): Promise<NextResponse> {
  const { companyName } = params;
  try {
    // 重置進度
    progress = 0;

    // 獲取並驗證 JWT Token
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

    // 獲取並處理請求
    const { filteredEmployee, month } = await req.json();

    const company = await Company.findOne({ enName: companyName });
    if (!company) {
      return NextResponse.json({
        status: 404,
        message: '查無公司資料，請確認網址是否正確',
      });
    }
    const shifts = await Shift.find({ company: company._id, month });

    // 獲取當前月份與年份
    const nowDate = new Date();
    const currentMonth = nowDate.getMonth() + 1; // 當前月份 (1-12)
    const currentYear = nowDate.getFullYear();

    // 目標月份與年份
    const targetMonth = month;
    let targetYear = currentYear;

    // 如果目標月份小於當前月份，則目標年份加1
    if (targetMonth < currentMonth) {
      targetYear += 1;
    }

    // 檢查該月份是否已經有自動排班紀錄
    const isAutoScheduleExist = shifts.filter(
      (shift) =>
        shift.scheduleType === 'automatic' &&
        shift.startDate.getFullYear() === targetYear,
    );

    if (isAutoScheduleExist.length > 0) {
      return NextResponse.json({ status: 400, message: '該月份已經有自動排班紀錄' });
    }

    // 設定該月份的起始日和最後一天
    const startDate = parseISO(
      `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`,
    );
    const endDate = endOfMonth(startDate);
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    // 1. 初始化排班資料，預設每天所有員工都上班
    const monthlySchedule = daysInMonth.map((day) => ({
      date: day,
      employees: filteredEmployee.map((employee: EmployeeType) => ({
        employeeName: employee.name,
        employeeId: employee.employeeId,
        status: '上班', // 預設為上班
      })),
    }));

    // 更新進度，初始化排班完成（25%）
    progress = 25;

    // 2. 更新每一天的排班狀態，將有休假的員工標記為休假
    shifts.forEach((shift) => {
      if (!shift.isAvailable) {
        monthlySchedule.forEach((day) => {
          if (
            isWithinInterval(day.date, { start: shift.startDate, end: shift.endDate })
          ) {
            const employeeSchedule = day.employees.find(
              (emp: EmployeeType) => emp.employeeId === shift.employee.toString(),
            );
            if (employeeSchedule) {
              employeeSchedule.status = '休假';
            }
          }
        });
      }
    });

    // 更新進度，標記休假完成（50%）
    progress = 50;

    // 3. 確保每一天除了休假員工以外的其他人都上班
    monthlySchedule.forEach((day) => {
      const workingEmployees = day.employees.filter(
        (employee: EmployeeType) => employee.status === '上班',
      );
      const offEmployees = day.employees.filter(
        (employee: EmployeeType) => employee.status === '休假',
      );

      // 如果當天上班人數少於總員工數 - 休假人數，補足上班人數
      if (workingEmployees.length < filteredEmployee.length - offEmployees.length) {
        day.employees.forEach((employee: EmployeeType) => {
          if (employee.status !== '休假') {
            employee.status = '上班';
          }
        });
      }
    });

    // 更新進度，確認上班人數完成（75%）
    progress = 75;

    // 4. 準備需要插入的上班紀錄
    const newShifts: ShiftType[] = [];
    monthlySchedule.forEach((day) => {
      day.employees.forEach((employee: EmployeeType) => {
        if (employee.status === '上班') {
          newShifts.push({
            startDate: startOfDay(toZonedTime(day.date, timeZone)), // 將 start 設為當天的開始時間
            endDate: endOfDay(toZonedTime(day.date, timeZone)), // 將 end 設為當天的結束時間
            isAvailable: true, // 上班
            employee: employee.employeeId,
            scheduleType: 'automatic', // 自動生成
            month,
            isComplete: false,
            company: company._id,
          });
        }
      });
    });

    // 批量插入上班紀錄到 Shift 集合
    const batchSize = 100;
    const totalBatches = Math.ceil(newShifts.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const batchData = newShifts.slice(i * batchSize, (i + 1) * batchSize);
      await Shift.insertMany(batchData);

      // 更新進度，插入上班紀錄部分完成，佔最後的 25%
      progress = 75 + Math.round(((i + 1) / totalBatches) * 25);
    }

    // 完成，進度設置為 100%
    progress = 100;

    return NextResponse.json({ message: '自動排班完成', status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[SHIFT POST]', error.message);
    } else {
      console.error('[SHIFT POST] Unknown error:', error);
    }
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}

// 進度查詢 API
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ progress });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    // 重置進度
    progress = 0;

    // 獲取並驗證 JWT Token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json({ status: 401, message: '請先登入' });
    }

    const user = await authenticateToken(token);
    if (!user) {
      return NextResponse.json({ status: 403, message: 'Token已過期' });
    }

    // 從請求體中獲取月份資訊
    const { month } = await req.json();
    if (!month) {
      return NextResponse.json({ status: 400, message: '請提供月份資訊' });
    }

    // 查找指定月份的所有自動排班紀錄
    const automaticShifts = await Shift.find({ scheduleType: 'automatic', month });
    const totalShifts = automaticShifts.length;

    if (totalShifts === 0) {
      progress = 100; // 沒有要刪除的紀錄，直接完成
      return NextResponse.json({
        message: '沒有自動排班的班別需要刪除',
        deletedCount: 0,
        status: 200,
      });
    }

    // 分批刪除紀錄
    const batchSize = 100;
    const totalBatches = Math.ceil(totalShifts / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      // 刪除當前批次的紀錄
      const batchIds = automaticShifts
        .slice(i * batchSize, (i + 1) * batchSize)
        .map((shift) => shift._id);
      await Shift.deleteMany({ _id: { $in: batchIds } });

      // 更新進度
      progress = Math.round(((i + 1) / totalBatches) * 100);
    }

    return NextResponse.json({
      message: '指定月份的所有自動排班班別已成功刪除',
      deletedCount: totalShifts,
      status: 200,
    });
  } catch (error) {
    console.error('[DELETE_AUTOMATIC_SHIFTS]', error);
    return new NextResponse('內部發生錯誤', { status: 500 });
  }
}
