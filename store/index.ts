import { create } from 'zustand';
import { State, UserType } from '@/type';
import { cleanToken } from '@/service/api';
import toast from 'react-hot-toast';

const initialState = {
  isAppInitializedComplete: false,
  user: null,
  isLoading: false,
  currentTab: 'detail',
  isOpenSchedule: false,
  isCompleteProfile: true,
  isChangePassword: true,
  isInitialized: false,
  cpnyName: null,
};

const useStore = create<State>((set) => {
  return {
    ...initialState,
    // --------------------------- Action
    setUser(user: UserType) {
      set({ user });
    },
    setIsLoading(isLoading: boolean) {
      set({ isLoading: isLoading });
    },
    setCurrentTab(tab: string) {
      set({ currentTab: tab });
    },
    setIsOpenSchedule(isOpenSchedule: boolean) {
      set({ isOpenSchedule });
    },
    setIsCompleteProfile(isCompleteProfile: boolean) {
      set({ isCompleteProfile });
    },
    setIsChangePassword(isChangePassword: boolean) {
      set({ isChangePassword });
    },
    setIsInitialized(isInitialized: boolean) {
      set({ isInitialized });
    },
    setCpnyName(cpnyName: string) {
      set({ cpnyName });
    },
    onLogout() {
      set({ user: null });
      cleanToken();
      toast.success('登出成功');
    },
  };
});

export default useStore;
