import { useEffect } from 'react';
import useStore from '@/store';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';

const useAuth = () => {
  const router = useRouter();
  const pathName = usePathname();

  const { setUser, cpnyName, setIsInitialized, setCpnyName } = useStore((state) => ({
    setUser: state.setUser,
    cpnyName: state.cpnyName,
    setIsInitialized: state.setIsInitialized,
    isInitialized: state.isInitialized,
    setCpnyName: state.setCpnyName,
  }));
  const token = Cookies.get('BTTDB_JWT_TOKEN');

  useEffect(() => {
    // 嘗試從 Cookies 獲取 cpnyName
    const storedCpnyName = Cookies.get('EZY_SCHEDULE_CPNY_NAME');
    if (storedCpnyName) {
      setCpnyName(storedCpnyName);
    }

    if (token) {
      // 每次呼叫時驗證token
      axios
        .post(`/api/${cpnyName || storedCpnyName}/auth/verify`, null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          if (res.data.status === 200) {
            setUser(res.data.user);
            router.push(pathName);
            // if (
            //   pathName === `/${cpnyName || storedCpnyName}/sign-in` ||
            //   pathName === `/${cpnyName || storedCpnyName}/sign-up`
            // ) {
            //   console.log('push schedule', `/${cpnyName || storedCpnyName}/schedule`);
            //   router.push(`/${cpnyName || storedCpnyName}/schedule`);
            // } else {
            //   router.push(pathName);
            // }
          } else {
            Cookies.remove('BTTDB_JWT_TOKEN');
            toast.error(res.data.message);
            router.push(`/${cpnyName}/sign-in`);
          }
        })
        .finally(() => {
          setIsInitialized(true);
        })
        .catch(() => {
          Cookies.remove('BTTDB_JWT_TOKEN');
          router.push(`/${cpnyName}/sign-in`);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useAuth;
