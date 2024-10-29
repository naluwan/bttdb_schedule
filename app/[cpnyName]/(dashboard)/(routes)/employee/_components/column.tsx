'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  ArrowUpDown,
  ListCollapse,
  LockKeyhole,
  LockKeyholeOpen,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export type Member = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isLock: boolean;
};

export const columns = (mutate?: () => void): ColumnDef<Member>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='p-0'
      >
        姓名
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className='p-0'
      >
        Email
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'phone',
    header: '電話',
  },
  {
    accessorKey: 'role',
    header: '職位',
    cell: ({ getValue }) => {
      const role = getValue() as string;
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
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row, table }) => {
      const employee = row.original;
      const token = Cookies.get('BTTDB_JWT_TOKEN');
      const cpnyName = Cookies.get('EZY_SCHEDULE_CPNY_NAME');
      const setLock = async () => {
        try {
          const data = { _id: employee._id, isLock: employee.isLock };
          const res = await axios.put(`/api/${cpnyName}/employee`, data, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.data.status === 200) {
            toast.success(res.data.message);
            if (mutate) mutate(); // 刷新数据
          } else {
            toast.error(res.data.message);
          }
        } catch (err) {
          toast.error('發生錯誤，請稍後再操作');
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <Link
              href={`/${cpnyName}/employee/${employee._id}?page=${
                table.getState().pagination.pageIndex
              }`}
            >
              <Button variant='ghost' className='flex w-full justify-start'>
                <ListCollapse className='h-4 w-4' />
                <p className='px-4'>詳細資料</p>
              </Button>
            </Link>
            <DropdownMenuSeparator />
            <Button
              variant='ghost'
              className='flex w-full justify-start'
              onClick={setLock}
            >
              {employee.isLock ? (
                <>
                  <LockKeyholeOpen className='h-4 w-4 text-green-500' />
                  <span className='px-4'>
                    解鎖 <strong>{employee.name}</strong>
                  </span>
                </>
              ) : (
                <>
                  <LockKeyhole className='h-4 w-4 text-red-600' />
                  <span className='px-4'>
                    鎖定 <strong>{employee.name}</strong>
                  </span>
                </>
              )}
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
