export type UserType = {
  _id: string;
  name: string;
  role: 'admin' | 'employee';
};

export type State = {
  isAppInitializedComplete: boolean;
  user: null | UserType;
  isLoading: boolean;
  currentTab: string;
  isImport: boolean;
  setUser: (user: UserType) => void;
  setIsLoading: (isLoading: boolean) => void;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
};
