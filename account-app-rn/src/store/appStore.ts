import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {
  Account,
  BillFilters,
  BillInput,
  BillListSection,
  BillRecord,
  BillType,
  BudgetSummary,
  Category,
  CategoryStat,
  OverviewStats,
  TrendPoint,
} from '@/types/bill';
import {LoginPayload, RegisterPayload, UserProfile} from '@/types/user';
import {
  createCategory,
  createInitialAppData,
  copyLastMonthBudget,
  createAccount,
  deleteBill,
  deleteCategory,
  ensureUserDemoData,
  exportAppData,
  archiveAccount,
  getBudgetSummary,
  getCategoryStats,
  getCategoryStatsByRange,
  listAccounts,
  getIncomeExpenseTotalsByRange,
  getOverviewStats,
  getPreviousPeriodTotalByRange,
  getTrendData,
  getTrendDataByRange,
  importAppData,
  listBudgetHistory,
  listBills,
  listBillSections,
  listCategories,
  loginUser,
  AppDataExportPayload,
  PersistedAppData,
  RangeIncomeExpenseTotals,
  replaceCategoryAndDelete,
  registerUser,
  saveBill,
  updateAccount,
  updateCategory,
  updateNickname,
  upsertBudget,
} from '@/services/localAppService';
import {storageKeys} from '@/utils/storage';

interface AppState extends PersistedAppData {
  hydrated: boolean;
  initialize: () => void;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  logout: () => void;
  getCurrentUser: () => UserProfile | undefined;
  updateProfile: (nickname: string) => void;
  getAccounts: (options?: {includeArchived?: boolean}) => Account[];
  getAccountById: (accountId: number) => Account | undefined;
  addAccountRecord: (payload: Pick<Account, 'name' | 'type' | 'openingBalance' | 'includeInTotal'>) => void;
  editAccountRecord: (
    accountId: number,
    payload: Partial<Pick<Account, 'name' | 'type' | 'openingBalance' | 'includeInTotal'>>,
  ) => void;
  setAccountArchived: (accountId: number, isArchived: boolean) => void;
  getCategories: (type?: BillType) => Category[];
  addCategory: (payload: Pick<Category, 'type' | 'name' | 'icon' | 'color'>) => void;
  editCategory: (
    categoryId: number,
    payload: Partial<Pick<Category, 'name' | 'icon' | 'color'>>,
  ) => void;
  removeCategory: (categoryId: number) => void;
  replaceCategoryAndRemove: (fromCategoryId: number, toCategoryId: number) => void;
  getBills: (filters?: BillFilters) => BillRecord[];
  getBillSections: (filters?: BillFilters) => BillListSection[];
  getBillById: (billId: number) => BillRecord | undefined;
  saveBillRecord: (payload: BillInput, billId?: number) => void;
  deleteBillRecord: (billId: number) => void;
  setBudget: (month: string, amount: number) => void;
  getBudgetByMonth: (month: string) => BudgetSummary;
  getBudgetHistory: (limit?: number) => BudgetSummary[];
  copyBudgetFromLastMonth: (month: string) => void;
  getOverview: () => OverviewStats;
  getCategoryBreakdown: (month: string, type: BillType) => CategoryStat[];
  getTrend: (rangeDays: number, type: BillType) => TrendPoint[];
  getTrendByRange: (
    startDate: string,
    endDate: string,
    type: BillType,
    filters?: Omit<BillFilters, 'type' | 'startDate' | 'endDate' | 'month'>,
  ) => TrendPoint[];
  getCategoryBreakdownByRange: (
    startDate: string,
    endDate: string,
    type: BillType,
    filters?: Omit<BillFilters, 'type' | 'startDate' | 'endDate' | 'month'>,
  ) => CategoryStat[];
  getPreviousPeriodTotalByRange: (
    startDate: string,
    endDate: string,
    type: BillType,
    filters?: Omit<BillFilters, 'type' | 'startDate' | 'endDate' | 'month'>,
  ) => number;
  getIncomeExpenseTotalsByRange: (
    startDate: string,
    endDate: string,
    filters?: Omit<BillFilters, 'type' | 'startDate' | 'endDate' | 'month'>,
  ) => RangeIncomeExpenseTotals;
  exportCurrentUserData: () => AppDataExportPayload;
  importCurrentUserData: (payload: AppDataExportPayload) => void;
}

const initialData = createInitialAppData();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,
      hydrated: false,
      initialize: () => {
        const state = get();
        if (state.categories.length === 0) {
          set(createInitialAppData());
        }
      },
      register: async payload => {
        let createdUser: UserProfile | undefined;

        set(state => {
          const next = registerUser(state, payload);
          createdUser = next.users.find(item => item.id === next.currentUserId);
          return next;
        });

        if (!createdUser) {
          throw new Error('注册失败');
        }

        return createdUser;
      },
      login: async payload => {
        let currentUser: UserProfile | undefined;

        set(state => {
          const next = loginUser(state, payload.username, payload.password);
          currentUser = next.users.find(item => item.id === next.currentUserId);
          return next;
        });

        if (!currentUser) {
          throw new Error('登录失败');
        }

        return currentUser;
      },
      logout: () => set({currentUserId: null, token: null}),
      getCurrentUser: () => {
        const state = get();
        return state.users.find(user => user.id === state.currentUserId);
      },
      updateProfile: nickname =>
        set(state => updateNickname(state, state.currentUserId, nickname)),
      getAccounts: options => {
        const state = get();
        return listAccounts(state, state.currentUserId, options);
      },
      getAccountById: accountId => {
        const state = get();
        return state.accounts.find(
          account => account.id === accountId && account.userId === state.currentUserId,
        );
      },
      addAccountRecord: payload =>
        set(state => createAccount(state, state.currentUserId, payload)),
      editAccountRecord: (accountId, payload) =>
        set(state => updateAccount(state, state.currentUserId, accountId, payload)),
      setAccountArchived: (accountId, isArchived) =>
        set(state => archiveAccount(state, state.currentUserId, accountId, isArchived)),
      getCategories: type => {
        const state = get();
        return listCategories(state, state.currentUserId, type);
      },
      addCategory: payload => set(state => createCategory(state, state.currentUserId, payload)),
      editCategory: (categoryId, payload) =>
        set(state => updateCategory(state, state.currentUserId, categoryId, payload)),
      removeCategory: categoryId =>
        set(state => deleteCategory(state, state.currentUserId, categoryId)),
      replaceCategoryAndRemove: (fromCategoryId, toCategoryId) =>
        set(state =>
          replaceCategoryAndDelete(
            state,
            state.currentUserId,
            fromCategoryId,
            toCategoryId,
          ),
        ),
      getBills: filters => {
        const state = get();
        return listBills(state, state.currentUserId, filters);
      },
      getBillSections: filters => {
        const state = get();
        return listBillSections(state, state.currentUserId, filters);
      },
      getBillById: billId => {
        const state = get();
        return state.bills.find(
          bill => bill.id === billId && bill.userId === state.currentUserId && !bill.deleted,
        );
      },
      saveBillRecord: (payload, billId) =>
        set(state => saveBill(state, state.currentUserId, payload, billId)),
      deleteBillRecord: billId => set(state => deleteBill(state, state.currentUserId, billId)),
      setBudget: (month, amount) =>
        set(state => upsertBudget(state, state.currentUserId, month, amount)),
      getBudgetByMonth: month => {
        const state = get();
        return getBudgetSummary(state, state.currentUserId, month);
      },
      getBudgetHistory: limit => {
        const state = get();
        return listBudgetHistory(state, state.currentUserId, limit);
      },
      copyBudgetFromLastMonth: month =>
        set(state => copyLastMonthBudget(state, state.currentUserId, month)),
      getOverview: () => {
        const state = get();
        return getOverviewStats(state, state.currentUserId);
      },
      getCategoryBreakdown: (month, type) => {
        const state = get();
        return getCategoryStats(state, state.currentUserId, month, type);
      },
      getTrend: (rangeDays, type) => {
        const state = get();
        return getTrendData(state, state.currentUserId, rangeDays, type);
      },
      getTrendByRange: (startDate, endDate, type, filters) => {
        const state = get();
        return getTrendDataByRange(
          state,
          state.currentUserId,
          startDate,
          endDate,
          type,
          filters,
        );
      },
      getCategoryBreakdownByRange: (startDate, endDate, type, filters) => {
        const state = get();
        return getCategoryStatsByRange(
          state,
          state.currentUserId,
          startDate,
          endDate,
          type,
          filters,
        );
      },
      getPreviousPeriodTotalByRange: (startDate, endDate, type, filters) => {
        const state = get();
        return getPreviousPeriodTotalByRange(
          state,
          state.currentUserId,
          startDate,
          endDate,
          type,
          filters,
        );
      },
      getIncomeExpenseTotalsByRange: (startDate, endDate, filters) => {
        const state = get();
        return getIncomeExpenseTotalsByRange(
          state,
          state.currentUserId,
          startDate,
          endDate,
          filters,
        );
      },
      exportCurrentUserData: () => {
        const state = get();
        return exportAppData(state, state.currentUserId);
      },
      importCurrentUserData: payload =>
        set(state => importAppData(state, state.currentUserId, payload)),
    }),
    {
      name: storageKeys.app,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        schemaVersion: state.schemaVersion,
        users: state.users,
        currentUserId: state.currentUserId,
        token: state.token,
        categories: state.categories,
        accounts: state.accounts,
        bills: state.bills,
        budgets: state.budgets,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState(current => {
          const normalized = ensureUserDemoData(
            {
              ...current,
              schemaVersion: current.schemaVersion ?? 3,
              accounts: current.accounts ?? [],
            },
            current.currentUserId,
          );
          return {
            ...normalized,
            hydrated: true,
          };
        });
      },
    },
  ),
);
