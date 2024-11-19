'use client';
import Cookies from 'js-cookie';
import { KeyRound, LoaderCircle, OctagonAlert, Pencil } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { EmployeeType } from '@/models/Employee';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useStore from '@/store';
import axios from 'axios';
import toast from 'react-hot-toast';
import ChangePassBtn from './_components/change-pass-btn';
import { UserType } from '@/type';
import DatePicker from '@/components/datePicker/datePicker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import bcrypt from 'bcryptjs';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

type EmployeeDetailType = {
  _id: string;
  id: string;
  emergencyId: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  dateEmployed: Date;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  birthday: Date;
  address: string;
  role: string;
};

type AttendanceEventType = {
  start: Date;
  end: Date;
  title: string;
  employee: EmployeeType;
};

const localizer = momentLocalizer(moment);

const EmployeeDetailPage = () => {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const { cpnyName } = useParams();

  // 獲取token
  const token = Cookies.get('BTTDB_JWT_TOKEN');
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push(`/${cpnyName}/sign-in`);
    }
  }, [router, token, cpnyName]);

  const [isEdit, setIsEdit] = useState(false);
  const [openDateEmployed, setOpenDateEmployed] = useState(false);
  const [openBirthday, setOpenBirthday] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeType | null>(null);
  const [updateEmployee, setUpdateEmployee] = useState<EmployeeDetailType>({
    _id: '',
    name: '',
    nickname: '',
    id: '',
    emergencyId: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    dateEmployed: new Date(),
    email: '',
    phone: '',
    birthday: new Date(),
    address: '',
    role: '',
  });

  const {
    user,
    isLoading,
    setIsLoading,
    isCompleteProfile,
    isChangePassword,
    setIsCompleteProfile,
    setIsChangePassword,
  } = useStore((state) => {
    return {
      user: state.user,
      isLoading: state.isLoading,
      isCompleteProfile: state.isCompleteProfile,
      isChangePassword: state.isChangePassword,
      setIsLoading: state.setIsLoading,
      setIsCompleteProfile: state.setIsCompleteProfile,
      setIsChangePassword: state.setIsChangePassword,
    };
  });

  const [events, setEvents] = useState<AttendanceEventType[]>([]);

  // 定義一個 function 來調用 API 取得員工考勤資料
  const getEmployeeAttendance = async () => {
    if (!token) {
      return router.push(`/${cpnyName}/sign-in`); // 如果 token 不存在，回到登入頁面
    }

    const response = await fetch(`/api/${cpnyName}/attendance/${id}`, {
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

  // 透過useSWR取得員工考勤資料
  const { data: attendanceData } = useSWR(
    [`/api/${cpnyName}/attendance/${id}`, token],
    getEmployeeAttendance,
  );

  // 設定考勤資料
  useEffect(() => {
    if (attendanceData) {
      setEvents(attendanceData.data);
    }
  }, [attendanceData]);

  // 定義一個 function 來調用 API 取得員工資料
  const getEmployeeData = async () => {
    if (!token) {
      return router.push(`/${cpnyName}/sign-in`); // 如果 token 不存在，回到登入頁面
    }

    const response = await fetch(`/api/${cpnyName}/employee/${id}`, {
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

  // 透過useSWR取得員工資料
  const { data, mutate } = useSWR(
    [`/api/${cpnyName}/employee/${id}`, token],
    getEmployeeData,
  );

  // 設定員工資料
  useEffect(() => {
    if (data) {
      setEmployeeData(data.data);
      setUpdateEmployee(() => {
        return {
          ...data.data,
          id: data.data?.id || '',
          dateEmployed: data.data?.dateEmployed || new Date().toISOString(),
          emergencyId: data.data?.emergencyContact?._id || '',
          emergencyName: data.data?.emergencyContact?.name || '',
          emergencyRelationship: data.data?.emergencyContact?.relationship || '',
          emergencyPhone: data.data?.emergencyContact?.phone || '',
        };
      });
    }
  }, [data]);

  // 檢查員工資料是否完整
  useEffect(() => {
    const checkProfile = async () => {
      if (!employeeData) return;
      if (
        !employeeData.birthday ||
        !employeeData.address ||
        !employeeData.emergencyContact
      ) {
        setIsCompleteProfile(false);
      } else {
        setIsCompleteProfile(true);
      }

      const isMatch = await bcrypt.compare('BTTDB1234', employeeData.password);

      if (isMatch) {
        setIsChangePassword(false);
      } else {
        setIsChangePassword(true);
      }
    };

    if (
      employeeData?._id === id &&
      user?.role !== 'admin' &&
      user?.role !== 'super-admin'
    ) {
      checkProfile();
    }
  }, [employeeData, setIsChangePassword, setIsCompleteProfile, id, user]);

  // 更新員工資訊
  const updateEmployeeDetail = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      if (typeof e !== 'string') {
        const { name, value } = e.target;
        setUpdateEmployee((prev) => {
          return {
            ...prev,
            [name]: value,
          };
        });
      } else {
        setUpdateEmployee((prev) => {
          return {
            ...prev,
            role: e,
          };
        });
      }
    },
    [],
  );

  // 取消更新並重置employee資料
  const atCancelUpdate = useCallback(() => {
    setUpdateEmployee(() => {
      return {
        ...data.data,
        id: data.data?.id || '',
        dateEmployed: data.data?.dateEmployed || new Date().toISOString(),
        emergencyId: data.data?.emergencyContact?._id || '',
        emergencyName: data.data?.emergencyContact?.name || '',
        emergencyRelationship: data.data?.emergencyContact?.relationship || '',
        emergencyPhone: data.data?.emergencyContact?.phone || '',
      };
    });
    setIsEdit(false);
  }, [data]);

  // 送出更新員工資料
  const atSubmit = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const res = await axios.patch(`/api/${cpnyName}/employee/${id}`, updateEmployee, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = res.data;

      if (result.status === 201 || result.status === 200) {
        mutate();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      // 取消Loading狀態
      setIsLoading(false);
      setIsEdit(false);
    },
    [updateEmployee, setIsLoading, token, mutate, id, cpnyName],
  );

  // 更新生日
  const updateBirthday = useCallback((e: Date | undefined) => {
    setUpdateEmployee((prev) => {
      return {
        ...prev,
        birthday: e ? e : prev.birthday,
      };
    });
  }, []);

  // 更新到職日期
  const updateDateEmployed = useCallback((e: Date | undefined) => {
    setUpdateEmployee((prev) => {
      return {
        ...prev,
        dateEmployed: e ? e : prev.dateEmployed,
      };
    });
  }, []);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

  // 顯示職位
  const switchRole = useCallback((role: string) => {
    switch (role) {
      case 'super-admin':
        return '系統管理員';
      case 'shareholder':
        return '股東';
      case 'admin':
        return '管理員';
      case 'full-time':
        return '正職';
      default:
        return '兼職';
    }
  }, []);

  return (
    <div className='p-6'>
      {user?.role === 'admin' || user?.role === 'super-admin' ? (
        <Breadcrumb className='pb-6'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className='text-2xl md:text-3xl'
                href={`/${cpnyName}/employee`}
              >
                員工資料
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className='text-2xl md:text-3xl'>
                員工詳細資料
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : (
        <h1 className='pb-6 text-2xl md:text-3xl'>個人資料</h1>
      )}

      {!data ? (
        <div className='flex h-[474px] w-full items-center justify-center md:h-[232px]'>
          <LoaderCircle className='mr-3 h-5 w-5 animate-spin' />
        </div>
      ) : isLoading ? (
        <div className='flex h-[474px] w-full items-center justify-center md:h-[232px]'>
          <LoaderCircle className='mr-3 h-5 w-5 animate-spin' />
          <span>資料更新中...</span>
        </div>
      ) : (
        <>
          <div className='mb-4 space-y-4'>
            {!isCompleteProfile && (
              <Alert className='bg-yellow-300'>
                <OctagonAlert className='h-4 w-4' />
                <AlertTitle>完善個人資料</AlertTitle>
                <AlertDescription>
                  <div className='flex items-center gap-2'>
                    <p>請點擊卡片右上角</p>
                    <Pencil className='h-4 w-4' />
                    <p>開啟編輯模式</p>
                  </div>
                  <p>將生日、地址、緊急聯絡人資料填寫完整</p>
                </AlertDescription>
              </Alert>
            )}

            {!isChangePassword && (
              <Alert className='bg-red-300'>
                <OctagonAlert className='h-4 w-4' />
                <AlertTitle>修改預設密碼</AlertTitle>
                <AlertDescription>
                  <div className='flex items-center gap-2'>
                    <p>請點擊卡片右上角</p>
                    <KeyRound className='h-4 w-4' />
                    <p>修改密碼</p>
                  </div>
                  <p>請將預設密碼修改為自己的密碼</p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Card className='relative mx-auto pt-6 shadow-lg'>
            {/* 編輯鈕 */}
            <Button
              className='absolute right-3 top-3 transition-all duration-300 hover:scale-125 hover:bg-transparent'
              variant='ghost'
              onClick={() => setIsEdit(true)}
            >
              <Pencil className={cn('h-5 w-5 md:h-7 md:w-7', isEdit && 'hidden')} />
            </Button>

            {/* 更改密碼鈕 */}
            <ChangePassBtn
              isEdit={isEdit}
              user={user as UserType}
              employee={employeeData as EmployeeType}
              mutate={mutate}
            />

            <CardContent>
              <div className='grid grid-cols-1 gap-4 text-xl md:text-2xl'>
                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='name'
                  >
                    姓名:
                  </Label>
                  <span
                    className={cn('ml-2 break-words text-gray-900', isEdit && 'hidden')}
                  >
                    {employeeData?.name}
                  </span>
                  <span className={cn('hidden', isEdit && 'block text-xl md:text-2xl')}>
                    <Input
                      name='name'
                      id='name'
                      required
                      onChange={(e) => updateEmployeeDetail(e)}
                      value={updateEmployee?.name}
                      className={cn('hidden', isEdit && 'block text-xl md:text-2xl')}
                    />
                  </span>
                </div>
                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='name'
                  >
                    顯示名稱:
                  </Label>
                  <span
                    className={cn('ml-2 break-words text-gray-900', isEdit && 'hidden')}
                  >
                    {employeeData?.nickname}
                  </span>
                  <span className={cn('hidden', isEdit && 'block text-xl md:text-2xl')}>
                    <Input
                      name='nickname'
                      id='nickname'
                      required
                      onChange={(e) => updateEmployeeDetail(e)}
                      value={updateEmployee?.nickname}
                      className={cn('hidden', isEdit && 'block text-xl md:text-2xl')}
                    />
                  </span>
                </div>
                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='id'
                  >
                    身分證號碼:
                  </Label>
                  <span
                    className={cn('ml-2 break-words text-gray-900', isEdit && 'hidden')}
                  >
                    {employeeData?.id}
                  </span>
                  <span className={cn('hidden', isEdit && 'block text-xl md:text-2xl')}>
                    <Input
                      name='id'
                      id='id'
                      required
                      onChange={(e) => updateEmployeeDetail(e)}
                      value={updateEmployee?.id}
                      className={cn('hidden', isEdit && 'block text-xl md:text-2xl')}
                    />
                  </span>
                </div>
                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='email'
                  >
                    Email:
                  </Label>
                  <span
                    className={cn('ml-2 break-words text-gray-900', isEdit && 'hidden')}
                  >
                    {employeeData?.email}
                  </span>
                  <Input
                    name='email'
                    id='email'
                    type='email'
                    required
                    className={cn('hidden', isEdit && 'block text-xl md:text-2xl')}
                    onChange={(e) => updateEmployeeDetail(e)}
                    value={updateEmployee?.email}
                  />
                </div>
                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='phone'
                  >
                    電話:
                  </Label>
                  <span
                    className={cn('ml-2 break-words text-gray-900', isEdit && 'hidden')}
                  >
                    {employeeData?.phone}
                  </span>
                  <Input
                    name='phone'
                    id='phone'
                    required
                    className={cn('hidden', isEdit && 'block text-xl md:text-2xl')}
                    onChange={(e) => updateEmployeeDetail(e)}
                    value={updateEmployee?.phone}
                  />
                </div>
                <div>
                  <Label className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'>
                    生日:
                  </Label>
                  <span
                    className={cn('ml-2 break-words text-gray-900', isEdit && 'hidden')}
                    id='birthday'
                  >
                    {employeeData?.birthday
                      ? new Date(employeeData?.birthday as Date).toLocaleDateString()
                      : ''}
                  </span>
                  <DatePicker
                    openDatePicker={openBirthday}
                    setOpenDatePicker={setOpenBirthday}
                    defaultDate={updateEmployee.birthday || new Date()}
                    isEdit={isEdit}
                    updateDate={updateBirthday}
                    yearsRange={years}
                    customClass='text-xl md:text-2xl'
                  />
                </div>
                <div
                  className={cn(
                    isEdit &&
                      user?.role !== 'admin' &&
                      user?.role !== 'super-admin' &&
                      'hidden',
                  )}
                >
                  <Label className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'>
                    到職日期:
                  </Label>
                  <span
                    className={cn('ml-2 break-words text-gray-900', isEdit && 'hidden')}
                  >
                    {new Date(employeeData?.dateEmployed as Date).toLocaleDateString()}
                  </span>
                  <DatePicker
                    openDatePicker={openDateEmployed}
                    setOpenDatePicker={setOpenDateEmployed}
                    defaultDate={updateEmployee.dateEmployed}
                    isEdit={isEdit}
                    updateDate={updateDateEmployed}
                    customClass='text-xl md:text-2xl'
                  />
                </div>
                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='address'
                  >
                    地址:
                  </Label>
                  <span
                    className={cn(
                      'ml-2 w-full break-words text-gray-900',
                      isEdit && 'hidden',
                    )}
                  >
                    {employeeData?.address}
                  </span>
                  <Textarea
                    name='address'
                    id='address'
                    required
                    className={cn(
                      'hidden',
                      isEdit && 'block resize-none text-xl md:text-2xl',
                    )}
                    onChange={(e) => updateEmployeeDetail(e)}
                    value={updateEmployee?.address}
                  />
                </div>
                <div>
                  <Label
                    className={cn(
                      'whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl',
                      isEdit &&
                        user?.role !== 'admin' &&
                        user?.role !== 'super-admin' &&
                        'hidden',
                    )}
                  >
                    職位:
                  </Label>
                  <span className={cn('ml-2 text-gray-900', isEdit && 'hidden')}>
                    {switchRole(employeeData?.role as string)}
                  </span>
                  <RadioGroup
                    className={cn(
                      'hidden',
                      isEdit &&
                        (user?.role === 'admin' || user?.role === 'super-admin') &&
                        'flex',
                    )}
                    id='role'
                    onValueChange={(e) => updateEmployeeDetail(e)}
                    value={updateEmployee?.role}
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem
                        value='admin'
                        id='option-one'
                        className='text-xl md:text-2xl'
                      />
                      <Label htmlFor='option-one' className='text-xl md:text-2xl'>
                        管理員
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem
                        value='full-time'
                        id='option-two'
                        className='text-xl md:text-2xl'
                      />
                      <Label htmlFor='option-two' className='text-xl md:text-2xl'>
                        正職
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem
                        value='part-time'
                        id='option-three'
                        className='text-xl md:text-2xl'
                      />
                      <Label htmlFor='option-three' className='text-xl md:text-2xl'>
                        兼職
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='emergencyName'
                  >
                    緊急聯絡人姓名:
                  </Label>
                  <span
                    className={cn(
                      'ml-2 w-full break-words text-gray-900',
                      isEdit && 'hidden',
                    )}
                  >
                    {employeeData?.emergencyContact?.name}
                  </span>
                  <Input
                    name='emergencyName'
                    id='emergencyName'
                    required
                    className={cn(
                      'hidden',
                      isEdit && 'block resize-none text-xl md:text-2xl',
                    )}
                    onChange={(e) => updateEmployeeDetail(e)}
                    value={updateEmployee?.emergencyName}
                  />
                </div>

                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='emergencyRelationship'
                  >
                    緊急聯絡人關係:
                  </Label>
                  <span
                    className={cn(
                      'ml-2 w-full break-words text-gray-900',
                      isEdit && 'hidden',
                    )}
                  >
                    {employeeData?.emergencyContact?.relationship}
                  </span>
                  <Input
                    name='emergencyRelationship'
                    id='emergencyRelationship'
                    required
                    className={cn(
                      'hidden',
                      isEdit && 'block resize-none text-xl md:text-2xl',
                    )}
                    onChange={(e) => updateEmployeeDetail(e)}
                    value={updateEmployee?.emergencyRelationship}
                  />
                </div>

                <div>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='emergencyPhone'
                  >
                    緊急聯絡人電話:
                  </Label>
                  <span
                    className={cn(
                      'ml-2 w-full break-words text-gray-900',
                      isEdit && 'hidden',
                    )}
                  >
                    {employeeData?.emergencyContact?.phone}
                  </span>
                  <Input
                    name='emergencyPhone'
                    id='emergencyPhone'
                    required
                    className={cn(
                      'hidden',
                      isEdit && 'block resize-none text-xl md:text-2xl',
                    )}
                    onChange={(e) => updateEmployeeDetail(e)}
                    value={updateEmployee?.emergencyPhone}
                  />
                </div>

                <div className={cn('block', isEdit && 'hidden')}>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='address'
                  >
                    最後更新時間:
                  </Label>
                  <span
                    className={cn(
                      'ml-2 w-full break-words text-gray-900',
                      isEdit && 'hidden',
                    )}
                  >
                    {new Date(employeeData?.updatedAt as Date).toLocaleString()}
                  </span>
                </div>

                <div className={cn('block', isEdit && 'hidden')}>
                  <Label
                    className='whitespace-nowrap text-xl font-bold text-gray-700 md:text-2xl'
                    htmlFor='address'
                  >
                    最後更新人:
                  </Label>
                  <span
                    className={cn(
                      'ml-2 w-full break-words text-gray-900',
                      isEdit && 'hidden',
                    )}
                  >
                    {employeeData?.updatedBy?.name}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className={cn('hidden', isEdit && 'flex justify-end gap-4')}>
              <Button variant='default' type='submit' onClick={atSubmit}>
                儲存
              </Button>
              <Button variant='ghost' className='text-red-500' onClick={atCancelUpdate}>
                取消
              </Button>
            </CardFooter>
          </Card>

          {user?.role === 'super-admin' && (
            <div>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor='start'
                endAccessor='end'
                style={{ height: 500 }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeDetailPage;
