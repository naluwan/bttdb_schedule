'use client';
import useAuth from '@/hooks/useAuth';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  useAuth();
  return <div className='flex h-full items-center justify-center'>{children}</div>;
};

export default AuthLayout;
