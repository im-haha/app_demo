export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bills: undefined;
  Stats: undefined;
  Mine: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  BillAdd: undefined;
  BillEdit: {billId: number};
  BillDetail: {billId: number};
  Budget: undefined;
  CategoryManage: undefined;
  Profile: undefined;
};
