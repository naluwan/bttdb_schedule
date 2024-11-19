import React, { useCallback, useEffect, useState } from 'react';
import { CircleUserRound, LogIn, LogOut, User } from 'lucide-react';

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
import { useParams } from 'next/navigation';

const AvatarInfo = () => {
  const { cpnyName } = useParams();
  const [open, setOpen] = useState(false);
  const [isValidNetwork, setIsValidNetwork] = useState(false);
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

  // 驗證網路
  useEffect(() => {
    async function checkNetwork() {
      try {
        // 使用第三方 API 取得使用者的 IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ipAddress = data.ip;
        console.log('ipAddress', ipAddress);
        // 將 IP 傳送到 Next.js API 驗證
        const res = await axios(`/api/${cpnyName}/auth/verifyNetwork`, {
          data: { ipAddress },
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const verifyData = res.data;
        console.log('verifyData', verifyData);
        setIsValidNetwork(verifyData.isValid);
      } catch (error) {
        console.error('無法驗證網路:', error);
        toast.error('無法驗證網路，請重新嘗試');
      }
    }

    checkNetwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切換開放排班
  const atSwitchOpenSchedule = useCallback(async () => {
    const res = await axios.patch(
      `/api/${cpnyName}/setting/openSchedule`,
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
  }, [setIsOpenSchedule, token, cpnyName]);

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
          <Link href={`/${cpnyName}/employee/${user?._id}`} className='flex w-full'>
            <User className='mr-2 h-4 w-4' />
            <span>個人資料</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {(user?.role === 'admin' || user?.role === 'super-admin') && (
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
        {user?.role === 'super-admin' && (
          <DropdownMenuItem onClick={() => console.log('isValidNetwork', isValidNetwork)}>
            <LogIn className='h-4 w-4' />
            <span>打卡</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={onLogout}>
          <LogOut className='h-4 w-4' />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarInfo;
