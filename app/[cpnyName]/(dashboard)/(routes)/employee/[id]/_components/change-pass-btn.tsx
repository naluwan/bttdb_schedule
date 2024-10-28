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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { EmployeeType } from '@/models/Employee';
import { UserType } from '@/type';
import useStore from '@/store';
import axios from 'axios';
import Cookies from 'js-cookie';
import { KeyRound, LoaderCircle } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';

type ChangePassBtnType = {
  isEdit: boolean;
  user: UserType;
  employee: EmployeeType;
};

const ChangePassBtn = ({ isEdit, user, employee }: ChangePassBtnType) => {
  const { cpnyName } = useParams();
  const [open, setOpen] = useState(false);
  const [passInfo, setPassInfo] = useState({
    userId: '',
    oldPass: '',
    newPass: '',
    checkNewPass: '',
  });
  const { isLoading, setIsLoading } = useStore((state) => {
    return {
      isLoading: state.isLoading,
      setIsLoading: state.setIsLoading,
    };
  });

  // 獲取token
  const token = Cookies.get('BTTDB_JWT_TOKEN');

  useEffect(() => {
    setPassInfo((prev) => {
      return {
        ...prev,
        userId: employee?._id as string,
      };
    });
  }, [employee]);

  const updatePassInfo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPassInfo((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }, []);

  const atSubmit = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const res = await axios.post(`/api/${cpnyName}/auth/changePassword`, passInfo, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = res.data;

      if (result.status === 201 || result.status === 200) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      // 取消Loading狀態
      setIsLoading(false);
    },
    [passInfo, setIsLoading, token],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          className='absolute right-16 top-3 transition-all duration-300 hover:scale-125 hover:bg-transparent'
        >
          <KeyRound className={cn('h-5 w-5 md:h-7 md:w-7', isEdit && 'hidden')} />
        </Button>
      </DialogTrigger>
      <DialogContent className='hide-scrollbar max-h-[90%] overflow-y-scroll md:max-w-[50%]'>
        <DialogHeader>
          <DialogTitle>修改密碼</DialogTitle>
          <DialogDescription>
            {user?.role === 'admin' && user._id !== employee?._id
              ? '請輸入新密碼與確認新密碼'
              : '請填入舊密碼、新密碼與確認新密碼'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex h-1/2 w-full items-center justify-center md:h-[232px]'>
            <LoaderCircle className='mr-3 h-5 w-5 animate-spin' />
            <p>密碼更新中，請稍候...</p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'block',
                user?.role === 'admin' && user._id !== employee?._id && 'hidden',
              )}
            >
              <Label htmlFor='oldPass'>
                舊密碼 <span className='text-red-500'>*</span>
              </Label>
              <Input
                name='oldPass'
                id='oldPass'
                type='password'
                required
                value={passInfo.oldPass}
                onChange={(e) => updatePassInfo(e)}
              />
            </div>

            <div>
              <Label htmlFor='newPass'>
                新密碼 <span className='text-red-500'>*</span>
              </Label>
              <Input
                name='newPass'
                id='newPass'
                type='password'
                required
                value={passInfo.newPass}
                onChange={(e) => updatePassInfo(e)}
              />
            </div>

            <div>
              <Label htmlFor='checkNewPass'>
                再次輸入新密碼 <span className='text-red-500'>*</span>
              </Label>
              <Input
                name='checkNewPass'
                id='checkNewPass'
                type='password'
                required
                value={passInfo.checkNewPass}
                onChange={(e) => updatePassInfo(e)}
              />
            </div>
          </>
        )}

        <DialogFooter className='gap-4 p-0'>
          <Button type='submit' onClick={atSubmit}>
            更新密碼
          </Button>
          <DialogClose
            onClick={() =>
              setPassInfo({
                userId: employee?._id as string,
                oldPass: '',
                newPass: '',
                checkNewPass: '',
              })
            }
            className='text-red-500'
          >
            取消
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePassBtn;
