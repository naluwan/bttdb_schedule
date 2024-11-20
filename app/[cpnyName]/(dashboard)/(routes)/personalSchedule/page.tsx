'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/zh-tw';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { startOfDay, endOfDay } from 'date-fns';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Ellipsis,
  Loader,
  LoaderCircle,
  Megaphone,
  OctagonAlert,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import useStore from '@/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { EditShiftType, EventType, ShiftDetailType } from '@/type';
import { EmployeeType } from '@/models/Employee';
import ProgressBar from '@/components/progressBar';
import { toZonedTime } from 'date-fns-tz';

moment.locale('zh-tw');
const timeZone = 'Asia/Taipei';
interface ShiftType {
  startDate: Date;
  endDate: Date;
  isAvailable: boolean | null;
  employee: string;
  employeeName: string;
  month: number;
}

const PersonalSchedulePage = () => {
  const { isLoading, user, setIsLoading, isOpenSchedule } = useStore((state) => {
    return {
      isLoading: state.isLoading,
      user: state.user,
      setIsLoading: state.setIsLoading,
      isOpenSchedule: state.isOpenSchedule,
    };
  });

  const localizer = useMemo(() => momentLocalizer(moment), []);
  const [eventsData, setEventsData] = useState<EventType[] | []>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // 進度條狀態
  const [uploadProgress, setUploadProgress] = useState(0);
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);
  const [deleteAutoScheduleLoading, setDeleteAutoScheduleLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState({
    start: new Date(),
    end: new Date(),
  });
  const [shift, setShift] = useState<ShiftType>({
    startDate: startOfDay(toZonedTime(new Date(), timeZone)),
    endDate: endOfDay(toZonedTime(new Date(), timeZone)),
    isAvailable: null,
    employee: '',
    employeeName: '',
    month: toZonedTime(new Date(), timeZone).getMonth() + 1,
  });
  const [filterData, setFilterData] = useState('all');
  const [editShift, setEditShift] = useState<EditShiftType | null>(null);
  const [filteredEmployee, setFilteredEmployee] = useState<
    { name: string; employeeId: string }[]
  >([]);
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

  const [isComplete, setIsComplete] = useState(false);
  const [isCompleteLoading, setIsCompleteLoading] = useState(false);

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

  // 設置員工ID
  useEffect(() => {
    if (user) {
      setShift((prev) => {
        return { ...prev, employee: user._id };
      });
    }
  }, [user]);

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

  //呼叫api獲取進度條
  const checkProgress = useCallback(async () => {
    const res = await axios.get(`/api/${cpnyName}/shift/autoSchedule`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.data;
    setUploadProgress(data.progress);
  }, [token, cpnyName]);

  //定時詢問進度
  useEffect(() => {
    if (isLoading) {
      const intervalId = setInterval(checkProgress, 1000);

      // 清除定时器
      return () => clearInterval(intervalId);
    }
  }, [isLoading, checkProgress]);

  // 檢查過去月份
  const checkMonth = (targetDate: Date) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 當前月份 (1-12)
    const currentYear = currentDate.getFullYear(); // 當前年

    const targetMonth = targetDate.getMonth() + 1; // 目標月份 (1-12)
    const targetYear = targetDate.getFullYear(); // 目標年

    // 檢查年份和月份
    if (
      targetYear < currentYear ||
      (targetYear === currentYear && targetMonth < currentMonth)
    ) {
      return false; // 過去的月份，無法編輯
    }

    return true; // 當前或未來月份，允許編輯或新增
  };

  // 點擊日期事件
  const handleSelect = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const isSelected = eventsData.some(
        (event) =>
          new Date(event.start).toLocaleDateString() ===
            new Date(start).toLocaleDateString() && event.employee === shift.employee,
      );

      if (!checkMonth(start)) {
        toast('過去的月份，無法新增', { icon: '🚫' });
        return;
      }

      if (
        (!isSelected && isOpenSchedule) ||
        (user?.role === 'admin' && !isSelected) ||
        (user?.role === 'super-admin' && !isSelected)
      ) {
        setSelectedDate({
          start: toZonedTime(start, timeZone),
          end: toZonedTime(end, timeZone),
        });
        setOpen(true);
        setShift((prev) => {
          return {
            ...prev,
            month: toZonedTime(start, timeZone).getMonth() + 1,
          };
        });
      } else if (isSelected) {
        if (user?.role === 'admin' || user?.role === 'super-admin') {
          toast(
            `${
              filterData === 'all' ? '你' : `『${shift?.employeeName}』 `
            }已排定此日期，請使用編輯排班功能`,
            {
              icon: '⚠️',
            },
          );
        } else {
          toast('你已排定此日期，，請使用編輯排班功能', { icon: '⚠️' });
        }
      } else if (!isOpenSchedule) {
        toast('已關閉排班', { icon: '🚫' });
      }
    },
    [isOpenSchedule, user, shift, eventsData, filterData],
  );

  // 月份導航事件
  const onNavigate = useCallback(
    (newDate: Date) => {
      setDate(toZonedTime(newDate, timeZone));
      setShift((prev) => {
        return {
          ...prev,
          month: toZonedTime(newDate, timeZone).getMonth() + 1,
        };
      });
    },
    [setDate, setShift],
  );

  // 取消排班
  const atCancel = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setSelectedDate({
        start: startOfDay(toZonedTime(new Date(), timeZone)),
        end: endOfDay(toZonedTime(new Date(), timeZone)),
      });
      setShift({
        startDate: startOfDay(toZonedTime(new Date(), timeZone)),
        endDate: endOfDay(toZonedTime(new Date(), timeZone)),
        isAvailable: null,
        employee: user?._id as string,
        employeeName: '',
        month: toZonedTime(new Date(), timeZone).getMonth() + 1,
      });
    }, 100);
  }, [user]);

  // 定義一個 function 來調用 API 獲取排班資料
  const getEmployeeShift = async () => {
    if (!token) {
      return router.push(`/${cpnyName}/sign-in`); // 如果 token 不存在，回到登入頁面
    }

    const response = await fetch(`/api/${cpnyName}/shift`, {
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

  // 獲取排班資料
  const {
    data,
    mutate,
    isLoading: shiftsLoading,
  } = useSWR([`/api/${cpnyName}/shift`, token], getEmployeeShift);

  // 定義一個 function 來調用 API 獲取員工資料
  const getAllEmployeeData = async () => {
    if (!token) {
      return router.push(`/${cpnyName}/sign-in`); // 如果 token 不存在，回到登入頁面
    }

    const response = await fetch(`/api/${cpnyName}/employee`, {
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

  // 獲取員工資料
  const { data: employeeData } = useSWR(
    [`/api/${cpnyName}/employee`, token],
    getAllEmployeeData,
  );

  // 篩選員工排班資料
  useEffect(() => {
    if (filterData === 'all') {
      setEventsData(
        data?.data?.map((shiftDetail: ShiftDetailType) => {
          return {
            start: new Date(shiftDetail.startDate),
            end: new Date(
              new Date(shiftDetail.endDate).setHours(
                new Date(shiftDetail.endDate).getHours() - 8,
              ),
            ),
            title: `${shiftDetail.employee.name} ${
              shiftDetail.isAvailable ? '上班' : '休假'
            }`,
            isAvailable: shiftDetail.isAvailable,
            employee: shiftDetail.employee._id,
            _id: shiftDetail._id,
            employeeName: shiftDetail.employee.name,
            isComplete: shiftDetail.isComplete,
          };
        }),
      );
      setShift((prev) => {
        return {
          ...prev,
          employee: user?._id as string,
          employeeName: user?.name as string,
        };
      });
    } else {
      const filteredShift = data?.data.filter((shiftDetail: ShiftDetailType) => {
        return shiftDetail.employee._id === filterData || !shiftDetail.isAvailable;
      });
      setEventsData(
        filteredShift?.map((filteredShiftDetail: ShiftDetailType) => {
          return {
            start: new Date(filteredShiftDetail.startDate),
            end: new Date(
              new Date(filteredShiftDetail.endDate).setHours(
                new Date(filteredShiftDetail.endDate).getHours() - 8,
              ),
            ),
            title: `${filteredShiftDetail.employee.name} ${
              filteredShiftDetail.isAvailable ? '上班' : '休假'
            }`,
            isAvailable: filteredShiftDetail.isAvailable,
            employee: filteredShiftDetail.employee._id,
            _id: filteredShiftDetail._id,
            employeeName: filteredShiftDetail.employee.name,
            isComplete: filteredShiftDetail.isComplete,
          };
        }),
      );

      const filteredShiftEmployeeName =
        filteredShift &&
        filteredShift.length > 0 &&
        filteredShift.find(
          (shiftDetail: ShiftDetailType) => shiftDetail.employee._id === filterData,
        )?.employee.name;

      setShift((prev) => {
        return {
          ...prev,
          employee: filterData,
          employeeName: filteredShiftEmployeeName,
        };
      });
    }
  }, [filterData, data, user, selectedDate, employeeData]);

  // 檢查當月是否送出排班
  useEffect(() => {
    if (eventsData && eventsData.length > 0) {
      const nowMonthShifts = eventsData.filter(
        (shift) => new Date(shift.start).getMonth() + 1 === date.getMonth() + 1,
      );
      if (nowMonthShifts.length > 0) {
        setIsComplete(nowMonthShifts.every((shift) => shift.isComplete));
      } else {
        setIsComplete(false);
      }
    } else {
      setIsComplete(false);
    }
  }, [eventsData, date]);

  // 送出排班
  const atSubmit = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const res = await axios.post(`/api/${cpnyName}/shift`, shift, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = res.data;

      if (result.status === 201 || result.status === 200) {
        atCancel();
        setEventsData([]);
        mutate();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      // 取消Loading狀態
      setIsLoading(false);
    },
    [shift, token, mutate, atCancel, setIsLoading, setEventsData, cpnyName],
  );

  // 清除事件資料
  useEffect(() => {
    return () => {
      setEventsData([]);
    };
  }, []);

  // 修改排班
  const atEditShift = useCallback(
    (event: EventType) => {
      if (!checkMonth(new Date(event.start))) {
        toast('過去的班別，無法編輯', { icon: '🚫' });
        return;
      }

      if (isOpenSchedule || user?.role === 'admin' || user?.role === 'super-admin') {
        if (
          event.employee !== user?._id &&
          user?.role !== 'admin' &&
          user?.role !== 'super-admin'
        ) {
          toast('無法編輯其他員工的班別', { icon: '🚫' });
        } else {
          setOpenEdit(true);
          const selectedEmployeeEvent = eventsData.find(
            (e) => e.employee === event.employee && e.start === event.start,
          );

          if (selectedEmployeeEvent) {
            selectedEmployeeEvent.start = startOfDay(
              new Date(selectedEmployeeEvent.start),
            );
            selectedEmployeeEvent.end = endOfDay(new Date(selectedEmployeeEvent.start));
          }

          setEditShift(selectedEmployeeEvent as EditShiftType);
        }
      } else {
        toast('已關閉排班', { icon: '🚫' });
      }
    },
    [user, eventsData, isOpenSchedule],
  );

  // 送出編輯排班
  const atUpdateShift = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const res = await axios.patch(`/api/${cpnyName}/shift`, editShift, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = res.data;

      if (result.status === 201 || result.status === 200) {
        setEventsData([]);
        setOpenEdit(false);
        setEditShift(null);
        mutate();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      // 取消Loading狀態
      setIsLoading(false);
    },
    [
      editShift,
      token,
      mutate,
      setIsLoading,
      setEventsData,
      setOpenEdit,
      setEditShift,
      cpnyName,
    ],
  );

  // 刪除排班
  const atDeleteShift = useCallback(
    async (e: React.MouseEvent, shiftId: string) => {
      e.preventDefault();
      setIsLoading(true);
      const data = { shiftId };
      const res = await axios.delete(`/api/${cpnyName}/shift`, {
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = res.data;

      if (result.status === 201 || result.status === 200) {
        toast.success(result.message);
        setOpenEdit(false);
        setEditShift(null);
        mutate();
      } else {
        toast.error(result.message);
      }
      // 取消Loading狀態
      setIsLoading(false);
    },
    //TODO: 這裡的依賴項目有問題，需要重新檢查
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editShift, token, mutate, setOpenEdit, setEditShift, setIsLoading, cpnyName],
  );

  // 過濾員工
  useEffect(() => {
    if (employeeData) {
      employeeData.data?.forEach((employee: EmployeeType) => {
        if (employee.role !== 'shareholder' && employee.role !== 'super-admin') {
          setFilteredEmployee((prev) =>
            prev.concat({ name: employee.name, employeeId: employee._id }),
          );
        }
      });
    }
    return () => {
      setFilteredEmployee([]);
    };
  }, [employeeData]);

  // 自動排班
  const atAutoSchedule = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setAutoScheduleLoading(true);
      const nowMonth = date.getMonth() + 1;

      const data = { filteredEmployee, month: nowMonth };

      const res = await axios.post(`/api/${cpnyName}/shift/autoSchedule`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 201 || res.status === 200) {
        if (res.data.status === 201 || res.data.status === 200) {
          toast.success(res.data.message);
          mutate();
        } else {
          toast.error(res.data.message);
        }
      }

      // 取消Loading狀態
      setAutoScheduleLoading(false);
    },
    [token, cpnyName, date, setAutoScheduleLoading, mutate, filteredEmployee],
  );

  // 移除自動排班
  const atRemoveAutoSchedule = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setDeleteAutoScheduleLoading(true);
      const nowMonth = date.getMonth() + 1;
      const res = await axios.delete(`/api/${cpnyName}/shift/autoSchedule`, {
        data: { month: nowMonth },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 201 || res.status === 200) {
        toast.success(res.data.message);
        mutate();
      } else {
        toast.error(res.data.message);
      }
      // 取消Loading狀態
      setDeleteAutoScheduleLoading(false);
    },
    [token, cpnyName, mutate, setDeleteAutoScheduleLoading, date],
  );

  // 記錄員工休假天數
  const employeeAvailability = useMemo(() => {
    if (!eventsData) return {}; // 確保 eventsData 存在
    return eventsData.reduce((acc: Record<string, number>, eventShift) => {
      if (
        eventShift.isAvailable === false &&
        new Date(eventShift.start).getMonth() === date.getMonth()
      ) {
        const employeeName = eventShift.employeeName || '錯誤';
        acc[employeeName] = (acc[employeeName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [eventsData, date]);

  // 確認排班
  const atCompleteShift = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsCompleteLoading(true);
      const nowMonth = date.getMonth() + 1;
      const data = { month: nowMonth };
      const res = await axios.patch(`/api/${cpnyName}/shift/allShifts`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 201 || res.status === 200) {
        if (res.data.status === 201 || res.data.status === 200) {
          toast.success(res.data.message);
          mutate();
        } else {
          toast.error(res.data.message);
        }
      }
      // 取消Loading狀態
      setIsCompleteLoading(false);
    },
    [date, token, cpnyName, mutate, setIsCompleteLoading],
  );

  return (
    <div className='p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        {/* 日曆部分，顯示當天的上班人員 */}
        <div className='container mx-auto p-4'>
          <h1 className='mb-4 text-center text-2xl font-bold'>排班日曆</h1>
          {isOpenSchedule ? (
            <div className='mb-4 flex items-center justify-center gap-2'>
              <Megaphone className='h-6 w-6' />
              <div className='text-center text-xl font-bold'>
                已開放排班，請在15號之前完成排班
              </div>
            </div>
          ) : (
            <div className='mb-4 flex items-center justify-center gap-2'>
              <OctagonAlert className='h-4 w-4 text-yellow-500 md:h-6 md:w-6' />
              <h2 className='text-center text-sm font-bold text-yellow-500 md:text-xl'>
                未開放排班，可排班時間為每月1號至15號
              </h2>
            </div>
          )}
          {(user?.role === 'admin' || user?.role === 'super-admin') && (
            <div className='mb-4 flex flex-col justify-between md:flex-row'>
              <div className='mb-4 flex-shrink-0'>
                <Select
                  onValueChange={(value: string) => setFilterData(value)}
                  defaultValue='all'
                >
                  {/* 設置 w-full 使其填滿父容器 */}
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='請選擇顯示員工' />
                  </SelectTrigger>
                  <SelectContent className='w-full'>
                    <SelectItem value='all'>全部員工</SelectItem>
                    {filteredEmployee.length > 0 &&
                      filteredEmployee.map((employee) => (
                        <SelectItem key={employee.employeeId} value={employee.employeeId}>
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {(user?.role === 'admin' || user?.role === 'super-admin') && (
                <div className='flex w-full flex-col justify-between gap-4 md:flex-row md:justify-end'>
                  <Button
                    variant='default'
                    onClick={(e) => atAutoSchedule(e)}
                    disabled={autoScheduleLoading}
                  >
                    自動排班
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={(e) => atRemoveAutoSchedule(e)}
                    disabled={deleteAutoScheduleLoading}
                  >
                    移除自動排班
                  </Button>
                  <Button
                    variant={isComplete ? 'destructive' : 'default'}
                    onClick={atCompleteShift}
                    disabled={isCompleteLoading}
                  >
                    {isComplete ? '收回排班' : '送出排班'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {employeeAvailability && (
            <div className='mb-4 flex flex-col flex-wrap gap-4 md:flex-row'>
              {Object.entries(employeeAvailability).map(([employeeName, count]) => (
                <div
                  className='rounded-lg border p-2'
                  key={employeeName}
                >{`${employeeName}: 本月排休 ${count} 天`}</div>
              ))}
            </div>
          )}

          {isCompleteLoading ||
          shiftsLoading ||
          autoScheduleLoading ||
          deleteAutoScheduleLoading ? (
            shiftsLoading ? (
              <div className='flex h-full w-full items-center justify-center'>
                <p className='mr-2 text-xl'>獲取資料中</p>
                <Loader className='h-6 w-6 animate-spin' />
              </div>
            ) : (
              (autoScheduleLoading || deleteAutoScheduleLoading || isCompleteLoading) && (
                <div className='h-full w-full'>
                  <div className='flex h-auto w-full'>
                    <p>
                      {autoScheduleLoading
                        ? '自動排班中'
                        : deleteAutoScheduleLoading
                        ? '移除自動排班中'
                        : isCompleteLoading && isComplete
                        ? '收回排班中'
                        : '送出排班中'}
                    </p>
                    <Ellipsis className='ellipsis h-4 w-4 self-end' />
                  </div>
                  <ProgressBar uploadProgress={uploadProgress} />
                </div>
              )
            )
          ) : (
            <Calendar
              views={['day', 'month']}
              selectable={
                isOpenSchedule || user?.role === 'admin' || user?.role === 'super-admin'
              }
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
              style={{ height: '80vh' }}
              onSelectEvent={atEditShift}
              onSelectSlot={handleSelect}
              onNavigate={onNavigate}
              onView={setView}
              messages={customMessages}
              showAllEvents
              showMultiDayTimes
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
          )}

          {/* 新增排班 */}
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className='hide-scrollbar max-h-[90%] overflow-y-scroll'>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  新增 {new Date(selectedDate.start).toLocaleDateString()}{' '}
                  {user?.role === 'admin' && `『${shift?.employeeName}』 `}班別
                </AlertDialogTitle>
                <AlertDialogDescription></AlertDialogDescription>
              </AlertDialogHeader>
              {isLoading ? (
                <div className='flex h-auto w-full items-center justify-center md:h-auto'>
                  <LoaderCircle className='mr-3 h-5 w-5 animate-spin' />
                  <p>排班中，請稍候...</p>
                </div>
              ) : (
                <div className='grid w-full grid-cols-1 gap-4'>
                  <div className='overflow-hidden rounded-lg'>
                    <div className='relative flex flex-col items-center justify-center gap-y-2 p-4'>
                      <Select
                        onValueChange={(value: string) =>
                          setShift((prev) => {
                            return {
                              ...prev,
                              startDate: startOfDay(
                                toZonedTime(new Date(selectedDate.start), timeZone),
                              ),
                              endDate: toZonedTime(
                                endOfDay(new Date(selectedDate.start)),
                                timeZone,
                              ),
                              isAvailable: value === 'true',
                            };
                          })
                        }
                      >
                        {/* 設置 w-full 使其填滿父容器 */}
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='請選擇班別' />
                        </SelectTrigger>
                        <SelectContent className='w-full'>
                          <SelectItem value='true'>上班</SelectItem>
                          <SelectItem value='false'>休假</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <AlertDialogFooter className='gap-4 p-0'>
                <div className='flex items-center justify-end gap-4 p-0'>
                  <Button
                    type='submit'
                    onClick={atSubmit}
                    disabled={shift.isAvailable === null}
                  >
                    送出
                  </Button>
                  <AlertDialogCancel onClick={atCancel} className='m-0'>
                    取消
                  </AlertDialogCancel>
                </div>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 修改排班 */}
          <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
            <AlertDialogContent className='hide-scrollbar max-h-[90%] overflow-y-scroll'>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  編輯 {new Date(editShift?.start as Date).toLocaleDateString()}{' '}
                  {(user?.role === 'admin' || user?.role === 'super-admin') &&
                    `『${editShift?.employeeName}』 `}
                  班別
                </AlertDialogTitle>
                <AlertDialogDescription></AlertDialogDescription>
              </AlertDialogHeader>
              {isLoading ? (
                <div className='flex h-auto w-full items-center justify-center md:h-auto'>
                  <LoaderCircle className='mr-3 h-5 w-5 animate-spin' />
                  <p>更新排班中，請稍候...</p>
                </div>
              ) : (
                <div className='grid w-full grid-cols-1 gap-4'>
                  <div className='overflow-hidden rounded-lg'>
                    <div className='relative flex flex-col items-center justify-center gap-y-2 p-4'>
                      <Select
                        onValueChange={(value: string) =>
                          setEditShift((prev) => {
                            return {
                              ...prev,
                              isAvailable: value === 'true',
                            };
                          })
                        }
                        defaultValue={editShift?.isAvailable.toString()}
                      >
                        {/* 設置 w-full 使其填滿父容器 */}
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='請選擇班別' />
                        </SelectTrigger>
                        <SelectContent className='w-full'>
                          <SelectItem value='true'>上班</SelectItem>
                          <SelectItem value='false'>休假</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <AlertDialogFooter className='relative'>
                <Button
                  variant='ghost'
                  onClick={(e) => atDeleteShift(e, editShift?._id as string)}
                  className='absolute left-0 transition-all duration-500 hover:scale-125 hover:bg-inherit'
                >
                  <Trash2 className='h-6 w-6 text-red-500' />
                </Button>
                <div className='flex items-center justify-end gap-4 p-0'>
                  <Button type='submit' className='' onClick={atUpdateShift}>
                    更新
                  </Button>
                  <AlertDialogCancel
                    onClick={() => {
                      setOpenEdit(false);
                      setTimeout(() => {
                        setEditShift(null);
                      }, 100);
                    }}
                    className='m-0'
                  >
                    取消
                  </AlertDialogCancel>
                </div>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default PersonalSchedulePage;
