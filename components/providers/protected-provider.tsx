'use client';
import useStore from '@/store';
import React, { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, isInitialized, setIsInitialized } = useStore((state) => {
    return {
      user: state.user,
      isInitialized: state.isInitialized,
      setIsInitialized: state.setIsInitialized,
    };
  });

  useLayoutEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    if (isInitialized && user) {
      router.push('/schedule');
    }
  }, [user, router, isInitialized]);

  return children;
};

export default ProtectedProvider;
