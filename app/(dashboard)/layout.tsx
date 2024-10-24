'use client';
import useAuth from '@/hooks/useAuth';
import Navbar from './_components/navbar';
import Sidebar from './_components/sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  useAuth();
  const router = useRouter();
  // 獲取token
  const token = Cookies.get('BTTDB_JWT_TOKEN');

  useEffect(() => {
    if (!token) {
      router.push('/sign-in');
    }
  }, [token, router]);

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
