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

  const { setUser, setIsInitialized } = useStore((state) => ({
    setUser: state.setUser,
    setIsInitialized: state.setIsInitialized,
  }));

  useEffect(() => {
    const token = Cookies.get('BTTDB_JWT_TOKEN');

    if (token) {
      // 每次呼叫時驗證token
      axios
        .post('/api/auth/verify', null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          if (res.data.status === 200) {
            setUser(res.data.user);
            router.push(pathName);
          } else {
            Cookies.remove('BTTDB_JWT_TOKEN');
            toast.error(res.data.message);
            router.push('/sign-in');
          }
        })
        .finally(() => {
          setIsInitialized(true);
        })
        .catch(() => {
          Cookies.remove('BTTDB_JWT_TOKEN');
          router.push('/sign-in');
        });
    }
  }, []);
};

export default useAuth;
