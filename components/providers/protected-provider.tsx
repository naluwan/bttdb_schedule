'use client';
import useStore from '@/store';
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';
const ProtectedProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathName = usePathname();

  const {
    user,
    isInitialized,
    isCompleteProfile,
    isChangePassword,
    cpnyName,
    setCpnyName,
    setIsCompleteProfile,
    setIsChangePassword,
  } = useStore((state) => {
    return {
      user: state.user,
      isInitialized: state.isInitialized,
      isCompleteProfile: state.isCompleteProfile,
      isChangePassword: state.isChangePassword,
      cpnyName: state.cpnyName,
      setCpnyName: state.setCpnyName,
      setIsCompleteProfile: state.setIsCompleteProfile,
      setIsChangePassword: state.setIsChangePassword,
    };
  });

  useEffect(() => {
    const checkProfileAndPassword = async () => {
      if (!user) {
        router.push(`/${cpnyName}/sign-in`);
        return;
      }

      // 比對是否修改預設密碼
      const isMatch = await bcrypt.compare('BTTDB1234', user?.password as string);

      // 比對是否完成個人資料
      const isProfileComplete = user?.birthday && user?.address && user?.emergencyContact;

      // 檢查密碼是否為預設密碼
      const isPasswordChanged = !isMatch;

      if (!isProfileComplete || !isPasswordChanged) {
        if (!isProfileComplete) {
          setIsCompleteProfile(false); // 若資料不完整，設定為 false
        } else {
          setIsCompleteProfile(true); // 若資料完整，設定為 true
        }
        if (!isPasswordChanged) {
          setIsChangePassword(false); // 若密碼未修改，設定為 false
        } else {
          setIsChangePassword(true); // 若密碼已修改，設定為 true
        }
      }
    };
    checkProfileAndPassword();
  }, [user, cpnyName, setIsCompleteProfile, setIsChangePassword, router]);

  useEffect(() => {
    // 嘗試從 localStorage 獲取 cpnyName
    const storedCpnyName = localStorage.getItem('EZY_SCHEDULE_CPNY_NAME');
    if (storedCpnyName) {
      setCpnyName(storedCpnyName);
    }

    if (!user) {
      // router.push(pathName);
      router.push(`/${cpnyName}/sign-in`);
      return;
    }

    if (isInitialized && (!isCompleteProfile || !isChangePassword)) {
      router.push(`/${cpnyName}/employee/${user?._id}`);
    } else {
      if (!pathName.includes('null')) {
        router.push(pathName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    isInitialized,
    isCompleteProfile,
    isChangePassword,
    cpnyName,
    setCpnyName,
    router,
  ]);

  return children;
};

export default ProtectedProvider;
