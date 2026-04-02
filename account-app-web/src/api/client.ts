import type {
  BillFilters,
  BillInput,
  BillRecord,
  BillType,
  BudgetSummary,
  Category,
  CategoryStat,
  LoginPayload,
  OverviewStats,
  RegisterPayload,
  TrendPoint,
  UserProfile,
} from 'account-app-shared';

export interface SessionInfo {
  currentUserId: number | null;
  token: string | null;
}

export interface AppClient {
  initialize: () => Promise<void>;
  getSession: () => Promise<SessionInfo>;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<UserProfile | undefined>;
  updateProfileNickname: (nickname: string) => Promise<UserProfile | undefined>;
  getCategories: (type?: BillType) => Promise<Category[]>;
  getBills: (filters?: BillFilters) => Promise<BillRecord[]>;
  addBill: (payload: BillInput) => Promise<void>;
  deleteBill: (billId: number) => Promise<void>;
  saveBudget: (month: string, amount: number) => Promise<void>;
  getBudget: (month: string) => Promise<BudgetSummary>;
  getOverview: () => Promise<OverviewStats>;
  getCategoryStats: (month: string, type: BillType) => Promise<CategoryStat[]>;
  getTrend: (rangeDays: number, type: BillType) => Promise<TrendPoint[]>;
  getRecentBills: (limit?: number) => Promise<BillRecord[]>;
}
