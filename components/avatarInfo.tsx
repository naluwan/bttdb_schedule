import React, { useCallback, useState } from 'react';
import { CircleUserRound, LogOut, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import useStore from '@/store';
import Link from 'next/link';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import Cookies from 'js-cookie';
import axios from 'axios';
import toast from 'react-hot-toast';

const AvatarInfo = () => {
  const [open, setOpen] = useState(false);
  const { onLogout, user, isOpenSchedule, setIsOpenSchedule } = useStore((state) => {
    return {
      onLogout: state.onLogout,
      user: state.user,
      isOpenSchedule: state.isOpenSchedule,
      setIsOpenSchedule: state.setIsOpenSchedule,
    };
  });

  const atClickItem = () => {
    setOpen(false);
  };

  const token = Cookies.get('BTTDB_JWT_TOKEN');

  const atSwitchOpenSchedule = useCallback(async () => {
    const res = await axios.patch(
      '/api/setting/openSchedule',
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const result = res.data;
    if (result.status === 200) {
      toast.success(result.message);
      setIsOpenSchedule(result.data.isOpenSchedule);
    } else {
      toast.error(result.message);
    }
  }, [setIsOpenSchedule, token]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='h-8 w-8 rounded-full p-0 transition-all duration-500 hover:scale-110'
        >
          <CircleUserRound className='h-8 w-8' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>帳號資訊</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={atClickItem}>
          <Link href={`/employee/${user?._id}`} className='flex w-full'>
            <User className='mr-2 h-4 w-4' />
            <span>個人資料</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {user?.role === 'admin' && (
          <>
            <DropdownMenuItem onClick={atClickItem}>
              <div className='flex items-center space-x-2'>
                <Switch
                  id='airplane-mode'
                  checked={isOpenSchedule}
                  onCheckedChange={atSwitchOpenSchedule}
                />
                <Label htmlFor='airplane-mode'>員工排班</Label>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className='mr-2 h-4 w-4' />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarInfo;
