'use client';
import useAuth from '@/hooks/useAuth';
import Navbar from './_components/navbar';
import Sidebar from './_components/sidebar';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useEffect } from 'react';
import useStore from '@/store';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  useAuth();
  const { user } = useStore((state) => {
    return {
      user: state.user,
    };
  });
  const router = useRouter();
  // 獲取token
  const token = Cookies.get('BTTDB_JWT_TOKEN');
  // 定義一個 function 來調用 API
  const getSettingData = async () => {
    if (!token && !user) {
      router.push('/sign-in'); // 如果 token 不存在，回到登入頁面
      return;
    }

    const response = await fetch('/api/setting', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token 驗證失敗，回到登入頁面
        router.push('/sign-in');
        return;
      }

      throw new Error('An error occurred while fetching the data.');
    }

    return response.json();
  };

  const { data: settingData } = useSWR(['/api/setting', token], getSettingData);

  useEffect(() => {
    if (settingData && settingData.status === 200) {
      return;
    } else if (settingData) {
      router.push('/sign-in');
    } else {
      router.push('/sign-in');
    }
  }, [settingData, router]);

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
