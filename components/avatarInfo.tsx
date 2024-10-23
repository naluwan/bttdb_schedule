import React, { useState } from 'react';
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

const AvatarInfo = () => {
  const [open, setOpen] = useState(false);
  const { onLogout, user } = useStore((state) => {
    return {
      onLogout: state.onLogout,
      user: state.user,
    };
  });

  const atClickItem = () => {
    setOpen(false);
  };

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
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className='mr-2 h-4 w-4' />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarInfo;
