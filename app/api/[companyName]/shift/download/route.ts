import { NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import Company from '@/models/Company';
import { eachDayOfInterval, endOfMonth, parseISO } from 'date-fns';
import ExcelJS from 'exceljs';
import Shift from '@/models/Shift';

// 連接資料庫
connect();

// 清理並過濾非標準字元
const sanitizeString = (str: string) => str.replace(/[^\u0000-\uFFFF]/g, '');

// 限制字串長度，避免過長
const truncateString = (str: string, maxLen = 255) =>
  str.length > maxLen ? str.substring(0, maxLen) + '...' : str;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { month, companyName } = await req.json();
    console.log('Received request:', { month, companyName });

    const company = await Company.findOne({ enName: companyName });
    if (!company) {
      return NextResponse.json({
        status: 404,
        message: '查無公司資料，請確認網址是否正確',
      });
    }

    // 取得班表資料
    const shifts = await Shift.find({ company: company._id, month, isAvailable: true })
      .populate('employee', 'name')
      .lean();

    const currentYear = new Date().getFullYear();
    const startDate = parseISO(`${currentYear}-${String(month).padStart(2, '0')}-01`);
    const endDate = endOfMonth(startDate);
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    // 初始化班表資料
    const scheduleMap: Record<string, string[]> = {};
    daysInMonth.forEach((day) => {
      const dateKey = day.toISOString().split('T')[0];
      scheduleMap[dateKey] = [];
    });

    // 填充班表資料，並處理字串
    shifts.forEach((shift) => {
      const dateKey = shift.startDate.toISOString().split('T')[0];
      scheduleMap[dateKey].push(truncateString(sanitizeString(shift.employee.name)));
    });

    // 建立 Excel 工作簿與工作表
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${month}月班表`);

    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

    // 新增標題行（星期日 ~ 星期六）
    worksheet.addRow(weekdays);

    let rowIndex = 2; // 第一週從第 2 行開始
    let dayCounter = startDate.getDay(); // 當月第一天是星期幾

    // 填寫班表數據
    for (let day = 1; day <= daysInMonth.length; day++) {
      const cellTitle = `${month}/${day}`;
      const dateKey = `${currentYear}-${String(month).padStart(2, '0')}-${String(
        day,
      ).padStart(2, '0')}`;
      const employees = scheduleMap[dateKey] || [];

      // 處理員工名稱，並確保不超過儲存格限制
      const sanitizedEmployees = employees.map((e) => truncateString(sanitizeString(e)));
      const cellValue = `${cellTitle}\n${sanitizedEmployees.join('\n')}`;

      // 計算當前列的位置，確保星期天始終在 A 列 (colIndex = 1)
      const colIndex = (dayCounter % 7) + 1;

      // 將資料填入 Excel 儲存格
      const cell = worksheet.getCell(rowIndex, colIndex);
      cell.value = cellValue;
      cell.font = { size: 16 }; // 設置字體大小為 16
      cell.alignment = {
        vertical: 'top',
        horizontal: 'left',
        wrapText: true, // 啟用換行顯示完整內容
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // 計算行高（根據換行符數量）
      const lineCount = cellValue.split('\n').length;
      worksheet.getRow(rowIndex).height = 20 + lineCount * 15; // 每行增加 15px

      // 每週換行
      if (dayCounter % 7 === 6) {
        rowIndex++; // 換到下一週
      }

      dayCounter++;
    }

    // 設定列寬，使內容更易讀
    worksheet.columns.forEach((col) => {
      col.width = 30; // 增加列寬以顯示完整內容
    });

    // 設定標題行的字型樣式與對齊方式
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    console.log('Excel workbook successfully generated');

    // 生成 Excel 檔案 Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          month + '月班表.xlsx',
        )}"`,
      },
    });
  } catch (error) {
    console.error('[SHIFT EXCEL POST] 發生錯誤:', error);
    return NextResponse.json({ status: 500, message: '內部發生錯誤' });
  }
}
