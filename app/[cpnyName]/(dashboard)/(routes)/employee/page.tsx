'use client';
import Cookies from 'js-cookie';
import { columns } from '../employee/_components/column';
import { DataTable } from '@/components/data-table/data-table';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import useStore from '@/store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeType } from '@/models/Employee';
import DatePicker from '@/components/datePicker/datePicker';

interface NewEmployeeType {
  name: string;
  nickname: string;
  id: string;
  email: string;
  phone: string;
  dateEmployed: Date;
  role: string;
}

const EmployeePage = () => {
  const router = useRouter();
  const { cpnyName } = useParams();
  const { user, isLoading, setIsLoading } = useStore((state) => {
    return {
      user: state.user,
      isLoading: state.isLoading,
      setIsLoading: state.setIsLoading,
    };
  });

  const searchParams = useSearchParams();
  const page = searchParams.get('page');
  const [currentPage, setCurrentPage] = useState('0');
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (page) {
      setCurrentPage(page);
    }
  }, [page]);

  const [open, setOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<NewEmployeeType>({
    name: '',
    nickname: '',
    id: '',
    email: '',
    phone: '',
    dateEmployed: new Date(),
    role: '',
  });

  // 獲取token
  const token = Cookies.get('BTTDB_JWT_TOKEN');

  useEffect(() => {
    if (!token) {
      router.push(`/${cpnyName}/sign-in`);
    }
  }, [router, token, cpnyName]);

  // 定義一個 function 來調用 API
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

  const {
    data,
    mutate,
    isLoading: swrLoading,
  } = useSWR([`/api/${cpnyName}/employee`, token], getAllEmployeeData);

  // 更新新增員工資訊
  const updateNewEmployee = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      if (typeof e !== 'string') {
        const { name, value } = e.target;
        setNewEmployee((prev) => {
          return {
            ...prev,
            [name]: value,
          };
        });
      } else {
        setNewEmployee((prev) => {
          return {
            ...prev,
            role: e,
          };
        });
      }
    },
    [],
  );

  // 建立新員工
  const atSubmit = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const res = await axios.post(`/api/${cpnyName}/employee/register`, newEmployee, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = res.data;

      if (result.status === 201) {
        // 關閉dialog
        setOpen(false);
        // 初始化新增員工資訊
        setNewEmployee({
          name: '',
          nickname: '',
          id: '',
          email: '',
          phone: '',
          dateEmployed: new Date(),
          role: '',
        });
        mutate();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      // 取消Loading狀態
      setIsLoading(false);
    },
    [newEmployee, setIsLoading, token, mutate, cpnyName],
  );

  const [filter, setFilter] = useState<string>('all');

  // 使用 useMemo 來避免不必要的重新計算
  const filteredData = useMemo(() => {
    if (filter === 'admin') {
      return data?.data.filter((employee: EmployeeType) => employee.role === 'admin');
    }

    if (filter === 'full-time') {
      return data?.data.filter((employee: EmployeeType) => employee.role === 'full-time');
    }

    if (filter === 'part-time') {
      return data?.data.filter((employee: EmployeeType) => employee.role === 'part-time');
    }

    return data?.data; // filter === 'all'
  }, [filter, data]);

  // 更新到職日期
  const updateDateEmployed = useCallback((e: Date | undefined) => {
    setNewEmployee((prev) => {
      return {
        ...prev,
        dateEmployed: e ? e : prev.dateEmployed,
      };
    });
  }, []);

  return (
    <div className='p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-2xl md:text-3xl'>員工資料</h1>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Select onValueChange={(value: string) => setFilter(value)} defaultValue='all'>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='篩選職位' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>所有</SelectItem>
              <SelectItem value='admin'>管理員</SelectItem>
              <SelectItem value='full-time'>正職</SelectItem>
              <SelectItem value='part-time'>兼職</SelectItem>
            </SelectContent>
          </Select>

          {(user?.role === 'admin' || user?.role === 'super-admin') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' className='w-full sm:w-auto'>
                  新增員工
                </Button>
              </DialogTrigger>
              <DialogContent className='hide-scrollbar max-h-[90%] max-w-[90%] overflow-y-scroll'>
                <DialogHeader>
                  <DialogTitle>員工基本資料</DialogTitle>
                  <DialogDescription>
                    填入員工基本資料 (<span className='text-red-500'>*</span> 為必填)
                  </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                  <div className='flex h-[474px] w-full items-center justify-center md:h-[232px]'>
                    <LoaderCircle className='mr-3 h-5 w-5 animate-spin' />
                    <p>員工建立中，請稍候...</p>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='overflow-hidden rounded-lg border'>
                      <div className='relative flex flex-col justify-between gap-y-2 p-4'>
                        {/* 員工姓名 */}
                        <div className='flex gap-4'>
                          <div className='w-full'>
                            <Label htmlFor='name'>
                              員工姓名 <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              name='name'
                              id='name'
                              required
                              onChange={(e) => updateNewEmployee(e)}
                              placeholder='請輸入員工姓名'
                              defaultValue={newEmployee.name}
                            />
                          </div>

                          <div className='w-full'>
                            <Label htmlFor='name'>
                              顯示名稱 <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              name='nickname'
                              id='nickname'
                              required
                              onChange={(e) => updateNewEmployee(e)}
                              placeholder='請輸入員工暱稱或綽號'
                              defaultValue={newEmployee.nickname}
                            />
                          </div>
                        </div>

                        {/* 身分證號碼 */}
                        <div>
                          <Label htmlFor='name'>
                            身分證號碼 <span className='text-red-500'>*</span>
                          </Label>
                          <Input
                            name='id'
                            id='id'
                            required
                            onChange={(e) => updateNewEmployee(e)}
                            defaultValue={newEmployee.id}
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <Label htmlFor='email'>
                            Email <span className='text-red-500'>*</span>
                          </Label>
                          <Input
                            name='email'
                            id='email'
                            type='email'
                            required
                            onChange={(e) => updateNewEmployee(e)}
                            defaultValue={newEmployee.email}
                          />
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-col gap-y-4 rounded-lg border p-4'>
                      <div className='flex flex-col gap-y-3'>
                        {/* 電話 */}
                        <div>
                          <Label htmlFor='phone'>
                            電話 <span className='text-red-500'>*</span>
                          </Label>
                          <Input
                            name='phone'
                            id='phone'
                            required
                            onChange={(e) => updateNewEmployee(e)}
                            defaultValue={newEmployee.phone}
                          />
                        </div>

                        {/* 到職日期 */}
                        <div>
                          <Label htmlFor='dateEmployed'>
                            到職日期 <span className='text-red-500'>*</span>
                          </Label>
                          <div className='flex gap-2'>
                            <DatePicker
                              openDatePicker={dateOpen}
                              setOpenDatePicker={setDateOpen}
                              defaultDate={newEmployee.dateEmployed}
                              updateDate={updateDateEmployed}
                              isEdit={true}
                            />
                          </div>
                        </div>

                        {/* 權限 */}
                        <div>
                          <Label htmlFor='role'>
                            權限 <span className='text-red-500'>*</span>
                          </Label>
                          <RadioGroup
                            className='flex'
                            id='role'
                            onValueChange={(e) => updateNewEmployee(e)}
                            defaultValue={newEmployee.role}
                          >
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='admin' id='option-one' />
                              <Label htmlFor='option-one'>管理員</Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='full-time' id='option-two' />
                              <Label htmlFor='option-two'>正職</Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='part-time' id='option-three' />
                              <Label htmlFor='option-three'>兼職</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className='gap-4 p-0'>
                  <Button type='submit' onClick={atSubmit}>
                    新增
                  </Button>
                  <DialogClose
                    onClick={() =>
                      setNewEmployee({
                        name: '',
                        nickname: '',
                        id: '',
                        email: '',
                        phone: '',
                        dateEmployed: new Date(),
                        role: '',
                      })
                    }
                  >
                    取消
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {swrLoading ? (
        <div className='flex h-[500px] w-full items-center justify-center'>
          <LoaderCircle className='mr-3 h-5 w-5 animate-spin' />
        </div>
      ) : data ? (
        token && (
          <DataTable columns={columns(mutate)} data={filteredData} page={currentPage} />
        )
      ) : (
        <div className='flex items-center justify-center pt-6'>
          <div className='px-2'>
            <CircleAlert className='h-5 w-5 text-yellow-400 md:h-6 md:w-6' />
          </div>
          <h1 className='md:tex-2xl text-xl'>查無員工資料</h1>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;
