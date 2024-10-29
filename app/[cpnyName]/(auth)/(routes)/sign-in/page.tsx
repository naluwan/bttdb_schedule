'use client';
import React, { useCallback, useState } from 'react';
import useStore from '@/store';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LoaderCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import bcrypt from 'bcryptjs';

const SignInPage = () => {
  const router = useRouter();
  const { cpnyName } = useParams();
  localStorage.setItem('EZY_SCHEDULE_CPNY_NAME', cpnyName as string);
  const {
    isLoading,
    setUser,
    setIsLoading,
    setIsCompleteProfile,
    setIsChangePassword,
    setIsInitialized,
  } = useStore((state) => {
    return {
      isLoading: state.isLoading,
      setUser: state.setUser,
      setIsLoading: state.setIsLoading,
      setIsCompleteProfile: state.setIsCompleteProfile,
      setIsChangePassword: state.setIsChangePassword,
      setIsInitialized: state.setIsInitialized,
    };
  });
  const [accountInfo, setAccountInfo] = useState({
    email: '',
    password: '',
    companyName: cpnyName,
  });

  const atChangeInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setAccountInfo((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }, []);

  const atSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const { email, password, companyName } = accountInfo;
      const data = { email, password, companyName };

      const res = await axios.post(`/api/${cpnyName}/auth`, data);
      if (res.data.status !== 200) {
        toast.error(res.data.message);
      } else {
        toast.success('登入成功');
        setUser(res.data.user);
        setIsInitialized(true);
        // 設置token
        Cookies.set('BTTDB_JWT_TOKEN', res.data.token);
        localStorage.setItem('EZY_SCHEDULE_CPNY_NAME', cpnyName as string);

        // 比對是否修改預設密碼
        const isMatch = await bcrypt.compare('BTTDB1234', res.data.user?.password);

        // 比對是否完成個人資料
        const isProfileComplete =
          res.data.user?.birthday &&
          res.data.user?.address &&
          res.data.user?.emergencyContact;

        // 檢查密碼是否為預設密碼
        const isPasswordChanged = !isMatch;

        if (!isProfileComplete || !isPasswordChanged) {
          if (!isProfileComplete) {
            setIsCompleteProfile(false); // 若資料不完整，設定為 false
          }
          if (!isPasswordChanged) {
            setIsChangePassword(false); // 若密碼未修改，設定為 false
          }

          // 若其中一項未完成，導向個人資訊頁
          router.push(`/${cpnyName}/employee/${res.data.user._id}`);
        } else {
          // 若資料完整且密碼已修改，導向行程表頁
          router.push(`/${cpnyName}/schedule`);
        }
      }
      setAccountInfo({ email: '', password: '', companyName: cpnyName });
      setIsLoading(false);
    },
    [
      accountInfo,
      router,
      setIsLoading,
      setUser,
      cpnyName,
      setIsChangePassword,
      setIsCompleteProfile,
      setIsInitialized,
    ],
  );

  return (
    <div className='flex h-full w-full flex-col justify-center overflow-hidden bg-white py-6 sm:py-20'>
      <div className='mx-auto w-full max-w-md bg-white px-6 pb-8 pt-10 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10'>
        <div className='w-full'>
          <div className='text-center'>
            <h1 className='text-2xl font-semibold text-gray-900 md:text-3xl'>
              EZY Schedule 排班系統
            </h1>
            <p className='mt-2 text-gray-500'>請輸入Email和密碼</p>
          </div>
          <div className='mt-5'>
            <form onSubmit={atSubmit}>
              <div className='relative z-10 mt-6'>
                <input
                  type='email'
                  name='email'
                  id='email'
                  value={accountInfo.email}
                  placeholder='Email Address'
                  className='signin-register-input peer'
                  onChange={(e) => atChangeInput(e)}
                />
                <label
                  htmlFor='email'
                  className='pointer-events-none absolute left-0 top-0 origin-left -translate-y-1/2 transform text-sm text-gray-800 opacity-75 transition-all duration-100 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0 peer-focus:pl-0 peer-focus:text-sm peer-focus:text-gray-800'
                >
                  帳號
                </label>
              </div>
              <div className='relative z-10 mt-6'>
                <input
                  type='password'
                  name='password'
                  id='password'
                  value={accountInfo.password}
                  placeholder='Password'
                  className='signin-register-input peer'
                  onChange={(e) => atChangeInput(e)}
                />
                <label
                  htmlFor='password'
                  className='pointer-events-none absolute left-0 top-0 origin-left -translate-y-1/2 transform text-sm text-gray-800 opacity-75 transition-all duration-100 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0 peer-focus:pl-0 peer-focus:text-sm peer-focus:text-gray-800'
                >
                  密碼
                </label>
              </div>
              <div className='my-6 flex flex-col items-center'>
                <button
                  type='submit'
                  className='mb-3 flex w-full justify-center rounded-xl bg-black px-3 py-4 font-medium text-white focus:bg-gray-600 focus:outline-none disabled:opacity-25'
                  disabled={
                    accountInfo.email === '' || accountInfo.password === '' || isLoading
                  }
                >
                  {isLoading ? <LoaderCircle className='animate-spin' /> : '登入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
