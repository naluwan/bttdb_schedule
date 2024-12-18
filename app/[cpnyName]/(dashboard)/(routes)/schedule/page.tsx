'use client';
import { CompanyType, EventType, ShiftDetailType } from '@/type';
import Cookies from 'js-cookie';
import moment from 'moment';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import useSWR from 'swr';
import 'moment/locale/zh-tw';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Loader } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
// import randomColor from 'randomcolor';

moment.locale('zh-tw');

// type ColorType = string;

// 生成较暗颜色，确保颜色差异较大
// const generateUniqueDarkColor = (existingColors: ColorType[]): ColorType => {
//   let color: string | null = null;
//   let maxAttempts = 10; // 限制生成尝试次数，避免无限循环

//   do {
//     color = randomColor({
//       luminosity: 'dark', // 使用暗色
//       format: 'hsl', // 使用 HSL 模型，方便控制色相和饱和度
//     });

//     const hue = parseInt(color.match(/\d+/g)?.[0] || '0', 10); // 提取颜色的 hue 值
//     const saturation = parseInt(color.match(/\d+/g)?.[1] || '0', 10); // 提取颜色的饱和度

//     // 确保生成的颜色与已存在的颜色在色相(hue)和饱和度(saturation)上有足够差异
//     const isTooSimilar = existingColors.some((existingColor) => {
//       const existingHue = parseInt(existingColor.match(/\d+/g)?.[0] || '0', 10);
//       const existingSaturation = parseInt(existingColor.match(/\d+/g)?.[1] || '0', 10);
//       return (
//         Math.abs(hue - existingHue) < 30 && Math.abs(saturation - existingSaturation) < 15
//       );
//     });

//     if (!isTooSimilar) break;
//     maxAttempts--;
//   } while (maxAttempts > 0);

//   return color ?? '#000000'; // 如果生成失败，返回默认黑色
// };

const SchedulePage = () => {
  const localizer = useMemo(() => momentLocalizer(moment), []);
  const [eventsData, setEventsData] = useState<EventType[] | []>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [company, setCompany] = useState<CompanyType | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { toPDF, targetRef } = usePDF({
    filename: `${company?.nickName}-${date.getFullYear()}-${
      date.getMonth() + 1
    }月班表.pdf`,
    page: {
      orientation: 'landscape',
    },
  });

  // 導航按鈕文字state
  const [customMessages, setCustomMessages] = useState({
    date: '日期',
    time: '時間',
    event: '事件',
    allDay: '全天',
    week: '週',
    work_week: '工作週',
    day: '日',
    month: '月',
    previous: view === 'month' ? '上個月' : view === 'day' ? '前一日' : '上一個',
    next: view === 'month' ? '下個月' : view === 'day' ? '後一日' : '下一個',
    today: '今天',
    agenda: '議程',
    showMore: (count: number) => `還有 ${count} 個事件`,
  });

  const { cpnyName } = useParams();

  // 獲取token
  const token = Cookies.get('BTTDB_JWT_TOKEN');
  const router = useRouter();

  // 設置監聽器來查看是否為mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // 如果螢幕小于等于768px，就是mobile
    };

    // 初始化
    checkMobile();

    // 設置事件監聽器，在窗口大小改變時重新檢測
    window.addEventListener('resize', checkMobile);

    // 在離開component時移除事件監聽器
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 修改導航按鈕文字
  useEffect(() => {
    setCustomMessages((prev) => {
      return {
        ...prev,
        previous: view === 'month' ? '上個月' : view === 'day' ? '前一日' : '上一個',
        next: view === 'month' ? '下個月' : view === 'day' ? '後一日' : '下一個',
      };
    });
  }, [view]);

  // 月份導航事件
  const onNavigate = useCallback(
    (newDate: Date) => {
      setDate(newDate);
    },
    [setDate],
  );

  // 定義一個 function 來調用 API 獲取排班資料
  const getEmployeeShift = async () => {
    const response = await fetch(`/api/${cpnyName}/shift/allShifts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token 驗證失敗，回到登入頁面
        router.push(`/${cpnyName}/sign-in`);
        return;
      }

      throw new Error('An error occurred while fetching the data.');
    }

    return response.json();
  };

  const { data, isLoading: shiftsLoading } = useSWR(
    [`/api/${cpnyName}/shift/allShifts`, token],
    getEmployeeShift,
  );

  // 定義一個 function 來調用 API 獲取公司資料
  const getCompanyData = async () => {
    const response = await fetch(`/api/${cpnyName}/company`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token 驗證失敗，回到登入頁面
        router.push(`/${cpnyName}/sign-in`);
        return;
      }

      throw new Error('An error occurred while fetching the data.');
    }

    return response.json();
  };

  const { data: companyData, isLoading: companyLoading } = useSWR(
    [`/api/${cpnyName}/company`, token],
    getCompanyData,
  );

  // 設定公司資料
  useEffect(() => {
    if (companyData) {
      setCompany(companyData.data);
    }
  }, [companyData]);

  // 篩選員工排班資料
  useEffect(() => {
    setEventsData(
      data?.data
        ?.filter(
          (shiftDetail: ShiftDetailType) =>
            (shiftDetail.employee.role === 'part-time' && shiftDetail.isAvailable) ||
            shiftDetail.employee.role === 'full-time' ||
            shiftDetail.employee.role === 'admin',
        )
        .map((shiftDetail: ShiftDetailType) => {
          return {
            start: new Date(shiftDetail.startDate),
            end: new Date(
              new Date(shiftDetail.endDate).setHours(
                new Date(shiftDetail.endDate).getHours() - 8,
              ),
            ),
            title: `${
              shiftDetail.employee.nickname
                ? shiftDetail.employee.nickname
                : shiftDetail.employee.name
            } ${shiftDetail.isAvailable ? '上班' : '休假'}`,
            isAvailable: shiftDetail.isAvailable,
            employee: shiftDetail.employee._id,
            _id: shiftDetail._id,
            employeeName: shiftDetail.employee.name,
          };
        }),
    );
  }, [data]);

  // 員工顏色map
  // const employeeColors = useMemo(() => {
  //   const colors = new Map();
  //   if (eventsData) {
  //     console.log(eventsData);
  //     eventsData.forEach((event) => {
  //       if (!colors.has(event.employee)) {
  //         colors.set(event.employee, generateUniqueDarkColor([...colors.values()]));
  //       }
  //     });
  //   }

  //   return colors;
  // }, [eventsData]);

  return (
    <div className='p-6'>
      {!companyLoading && (
        <h1 className='mb-4 text-center text-2xl font-bold'>{company?.nickName} 班表</h1>
      )}
      {companyLoading || shiftsLoading ? (
        <div className='flex h-full w-full items-center justify-center'>
          <p className='mr-2 text-xl'>獲取資料中</p>
          <Loader className='h-6 w-6 animate-spin' />
        </div>
      ) : (
        <>
          <div className='flex w-full justify-center py-2 md:justify-end'>
            <button
              className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
              onClick={() => toPDF()}
            >
              下載 PDF
            </button>
          </div>

          <div ref={targetRef}>
            <Calendar
              views={['day', 'month']}
              localizer={localizer}
              formats={{
                dateFormat: 'MM/DD',
                dayFormat: (date, culture) =>
                  localizer.format(date, 'MM月DD日 ddd', culture),
                weekdayFormat: (date, culture) => localizer.format(date, 'ddd', culture),
                monthHeaderFormat: (date, culture) =>
                  localizer.format(date, 'YYYY年 MM月', culture),
                dayRangeHeaderFormat: ({ start, end }, culture) =>
                  `${localizer.format(start, 'MM月DD日', culture)} - ${localizer.format(
                    end,
                    'MM月DD日',
                    culture,
                  )}`,
                dayHeaderFormat: (date, culture) =>
                  localizer.format(date, 'MM月DD日 dddd', culture),
              }}
              defaultDate={new Date()}
              defaultView={view}
              view={view}
              date={date}
              events={eventsData}
              style={{ height: 'auto', minHeight: '80vh' }}
              onNavigate={onNavigate}
              onView={setView}
              messages={customMessages}
              showAllEvents
              eventPropGetter={(event) => {
                const style: React.CSSProperties = {};

                if (!event.isAvailable) {
                  style.backgroundColor = '#CC0000';
                }
                //  else {
                //   // 從顏色map中找到對應員工id並設定顏色，預設為藍色
                //   const employeeColor = employeeColors.get(event.employee) || '#0044BB';
                //   style.backgroundColor = employeeColor;
                // }

                // 判断是否是 day view和mobile
                const isDayView = view === 'day';

                if (isDayView && isMobile) {
                  return {
                    style,
                    className: 'day-event',
                  };
                }

                return { style };
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SchedulePage;
