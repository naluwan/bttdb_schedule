import { EmployeeType } from '@/models/Employee';

export type UserType = {
  _id: string;
  name: string;
  role: 'admin' | 'employee';
};

export type State = {
  isAppInitializedComplete: boolean;
  user: null | UserType;
  isLoading: boolean;
  isOpenSchedule: boolean;
  currentTab: string;
  setUser: (user: UserType) => void;
  setIsLoading: (isLoading: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setIsOpenSchedule: (isOpenSchedule: boolean) => void;
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
};
