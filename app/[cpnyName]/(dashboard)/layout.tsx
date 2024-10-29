'use client';
import useAuth from '@/hooks/useAuth';
import Navbar from './_components/navbar';
import Sidebar from './_components/sidebar';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import useStore from '@/store';
import useSWR from 'swr';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  useAuth();
  const { cpnyName } = useParams();
  const { setIsOpenSchedule, user } = useStore((state) => {
    return {
      setIsOpenSchedule: state.setIsOpenSchedule,
      user: state.user,
    };
  });
  const router = useRouter();
  // 獲取token
  const token = Cookies.get('BTTDB_JWT_TOKEN');

  useEffect(() => {
    if (!token) {
      router.push(`/${cpnyName}/sign-in`);
    }
  }, [token, router, cpnyName]);

  // 定義一個 function 來調用 API
  const getSettingData = async () => {
    if (!token && !user) {
      router.push(`/${cpnyName}/sign-in`); // 如果 token 不存在，回到登入頁面
      return;
    }

    const response = await fetch(`/api/${cpnyName}/setting`, {
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

  const { data: settingData } = useSWR(
    [`/api/${cpnyName}/setting`, token],
    getSettingData,
  );

  useEffect(() => {
    if (settingData && settingData.status === 200) {
      setIsOpenSchedule(settingData.data?.isOpenSchedule);
    } else if (settingData) {
      router.push(`/${cpnyName}/sign-in`);
    }
  }, [settingData, setIsOpenSchedule, router, cpnyName]);

  return (
    <div className='h-full'>
      <div className='fixed inset-y-0 z-50 h-[80px] w-full md:pl-56'>
        <Navbar />
      </div>
      <div className='fixed inset-y-0 z-50 hidden h-full w-56 flex-col md:flex'>
        <Sidebar />
      </div>
      <main className='h-full pt-[80px] md:pl-56'>{children}</main>
    </div>
  );
};

export default DashboardLayout;
