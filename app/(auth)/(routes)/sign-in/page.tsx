'use client';
import React, { useCallback, useState } from 'react';
import useStore from '@/store';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LoaderCircle } from 'lucide-react';
import Cookies from 'js-cookie';

const SignInPage = () => {
  const router = useRouter();
  const { isLoading, setUser, setIsLoading } = useStore((state) => {
    return {
      isLoading: state.isLoading,
      setUser: state.setUser,
      setIsLoading: state.setIsLoading,
    };
  });
  const [accountInfo, setAccountInfo] = useState({ email: '', password: '' });

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
      const { email, password } = accountInfo;
      const data = { email, password };

      const res = await axios.post('/api/auth', data);
      if (res.data.status !== 200) {
        toast.error(res.data.message);
      } else {
        toast.success('登入成功');
        setUser(res.data.user);
        // 設置token
        Cookies.set('BTTDB_JWT_TOKEN', res.data.token);
        router.push('/schedule');
      }
      setAccountInfo({ email: '', password: '' });
      setIsLoading(false);
    },
    [accountInfo, router, setIsLoading, setUser],
  );

  return (
    <div className='flex h-full w-full flex-col justify-center overflow-hidden bg-white py-6 sm:py-20'>
      <div className='mx-auto w-full max-w-md bg-white px-6 pb-8 pt-10 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10'>
        <div className='w-full'>
          <div className='text-center'>
            <h1 className='text-2xl font-semibold text-gray-900 md:text-3xl'>
              Back To The Day Before
            </h1>
            <h1 className='text-2xl font-semibold text-gray-900 md:text-3xl'>排班系統</h1>
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
