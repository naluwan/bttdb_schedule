'use client';
import useStore from '@/store';
import React, { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useStore((state) => {
    return {
      user: state.user,
    };
  });

  useLayoutEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  return children;
};

export default ProtectedProvider;
