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

moment.locale('zh-tw');

const SchedulePage = () => {
  const localizer = useMemo(() => momentLocalizer(moment), []);
  const [eventsData, setEventsData] = useState<EventType[] | []>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [company, setCompany] = useState<CompanyType | null>(null);

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

  // 檢查token
  useEffect(() => {
    if (!token) {
      router.push(`/${cpnyName}/sign-in`);
    }
  }, [router, token, cpnyName]);

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
    if (!token) {
      return router.push(`/${cpnyName}/sign-in`); // 如果 token 不存在，回到登入頁面
    }

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
    if (!token) {
      return router.push(`/${cpnyName}/sign-in`); // 如果 token 不存在，回到登入頁面
    }

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
      data?.data?.map((shiftDetail: ShiftDetailType) => {
        return {
          start: new Date(shiftDetail.startDate),
          end: new Date(shiftDetail.endDate),
          title: `${shiftDetail.employee.name} ${
            shiftDetail.isAvailable ? '上班' : '休假'
          }`,
          isAvailable: shiftDetail.isAvailable,
          employee: shiftDetail.employee._id,
          _id: shiftDetail._id,
          employeeName: shiftDetail.employee.name,
        };
      }),
    );
  }, [data]);

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
        <Calendar
          views={['day', 'month']}
          localizer={localizer}
          formats={{
            dateFormat: 'MM/DD',
            dayFormat: (date, culture) => localizer.format(date, 'MM月DD日 ddd', culture),
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
          style={{ height: '80vh' }}
          onNavigate={onNavigate}
          onView={setView}
          messages={customMessages}
          showAllEvents
          showMultiDayTimes
          eventPropGetter={(event) => {
            const backgroundColor = event.title.includes('休假') ? '#CC0000' : '#0044BB';
            return { style: { backgroundColor } };
          }}
        />
      )}
    </div>
  );
};

export default SchedulePage;
