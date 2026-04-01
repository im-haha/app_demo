import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {
  BillFilters,
  BillInput,
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
  deleteBill,
  deleteCategory,
  getBudgetSummary,
  getCategoryStats,
  getOverviewStats,
  getTrendData,
  listBills,
  listCategories,
  loginUser,
  PersistedAppData,
  registerUser,
  saveBill,
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
  getCategories: (type?: BillType) => Category[];
  addCategory: (payload: Pick<Category, 'type' | 'name' | 'icon' | 'color'>) => void;
  editCategory: (
    categoryId: number,
    payload: Partial<Pick<Category, 'name' | 'icon' | 'color'>>,
  ) => void;
  removeCategory: (categoryId: number) => void;
  getBills: (filters?: BillFilters) => BillRecord[];
  getBillById: (billId: number) => BillRecord | undefined;
  saveBillRecord: (payload: BillInput, billId?: number) => void;
  deleteBillRecord: (billId: number) => void;
  setBudget: (month: string, amount: number) => void;
  getBudgetByMonth: (month: string) => BudgetSummary;
  getOverview: () => OverviewStats;
  getCategoryBreakdown: (month: string, type: BillType) => CategoryStat[];
  getTrend: (rangeDays: number, type: BillType) => TrendPoint[];
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
      getCategories: type => {
        const state = get();
        return listCategories(state, state.currentUserId, type);
      },
      addCategory: payload => set(state => createCategory(state, state.currentUserId, payload)),
      editCategory: (categoryId, payload) =>
        set(state => updateCategory(state, state.currentUserId, categoryId, payload)),
      removeCategory: categoryId =>
        set(state => deleteCategory(state, state.currentUserId, categoryId)),
      getBills: filters => {
        const state = get();
        return listBills(state, state.currentUserId, filters);
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
    }),
    {
      name: storageKeys.app,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        users: state.users,
        currentUserId: state.currentUserId,
        token: state.token,
        categories: state.categories,
        bills: state.bills,
        budgets: state.budgets,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({hydrated: true});
      },
    },
  ),
);
