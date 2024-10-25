import { create } from 'zustand';
import { State, UserType } from '@/type';
import { cleanToken } from '@/service/api';

const initialState = {
  isAppInitializedComplete: false,
  user: null,
  isLoading: false,
  currentTab: 'detail',
  isOpenSchedule: false,
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
    onLogout() {
      set({ user: null });
      cleanToken();
    },
  };
});

export default useStore;
