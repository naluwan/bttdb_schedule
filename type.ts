import { EmployeeType } from '@/models/Employee';

export type UserType = {
  _id: string;
  id: string;
  password: string;
  emergencyContact: string;
  dateEmployed: Date;
  name: string;
  email: string;
  phone: string;
  birthday: Date;
  address: string;
  role: 'admin' | 'full-time' | 'part-time' | 'super-admin';
};

export type State = {
  isAppInitializedComplete: boolean;
  user: null | UserType;
  isLoading: boolean;
  isOpenSchedule: boolean;
  currentTab: string;
  isCompleteProfile: boolean;
  isChangePassword: boolean;
  isInitialized: boolean;
  cpnyName: string | null;
  setUser: (user: UserType) => void;
  setIsLoading: (isLoading: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setIsOpenSchedule: (isOpenSchedule: boolean) => void;
  setIsCompleteProfile: (isCompleteProfile: boolean) => void;
  setIsChangePassword: (isChangePassword: boolean) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  setCpnyName: (cpnyName: string) => void;
  onLogout: () => void;
};

export type ShiftDetailType = {
  _id: string;
  startDate: Date;
  endDate: Date;
  isAvailable: boolean;
  employee: EmployeeType;
};

export type EventType = {
  _id?: string;
  start: Date;
  end: Date;
  title: string;
  isAvailable: boolean;
  employee: string;
};

export type EditShiftType = {
  _id?: string;
  start?: Date;
  end?: Date;
  isAvailable: boolean;
  employee?: string;
  employeeName?: string;
};
