import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {reportHandledError} from '@/lib/reportError';
import {
  Account,
  AccountLedgerEntry,
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
  listAccountLedger,
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
  normalizePersistedAppData,
  AppDataExportPayload,
  PersistedAppData,
  RangeIncomeExpenseTotals,
  replaceCategoryAndDelete,
  saveBill,
  updateAccount,
  updateCategory,
  upsertBudget,
} from '@/services/localAppService';
import {useAuthStore} from '@/store/authStore';
import {storageKeys} from '@/utils/storage';

type AppBusinessData = Pick<
  PersistedAppData,
  'schemaVersion' | 'categories' | 'accounts' | 'bills' | 'budgets'
>;

function pickBusinessData(data: PersistedAppData): AppBusinessData {
  return {
    schemaVersion: data.schemaVersion,
    categories: data.categories,
    accounts: data.accounts,
    bills: data.bills,
    budgets: data.budgets,
  };
}

function buildServiceData(
  data: AppBusinessData,
  currentUserId: number | null,
): PersistedAppData {
  return {
    ...data,
    users: [],
    authCredentials: [],
    currentUserId,
  };
}

function reportAppStoreError(
  error: unknown,
  action: string,
  extra?: Record<string, unknown>,
): void {
  reportHandledError(error, {
    feature: 'appStore',
    action,
    extra,
  });
}

interface AppState extends AppBusinessData {
  currentUserId: number | null;
  hydrated: boolean;
  initialize: () => void;
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
  getAccountLedger: (accountId: number) => AccountLedgerEntry[];
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
      ...pickBusinessData(initialData),
      hydrated: false,
      currentUserId: useAuthStore.getState().currentUserId,
      initialize: () => {
        try {
          const state = get();
          if (state.categories.length === 0) {
            const fresh = pickBusinessData(createInitialAppData());
            set({
              ...fresh,
              currentUserId: useAuthStore.getState().currentUserId,
            });
          }
        } catch (error) {
          reportAppStoreError(error, 'initialize');
          throw error;
        }
      },
      getAccounts: options => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return listAccounts(serviceData, state.currentUserId, options);
      },
      getAccountById: accountId => {
        const state = get();
        return state.accounts.find(
          account => account.id === accountId && account.userId === state.currentUserId,
        );
      },
      addAccountRecord: payload =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(createAccount(serviceData, state.currentUserId, payload));
        }),
      editAccountRecord: (accountId, payload) =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(
            updateAccount(serviceData, state.currentUserId, accountId, payload),
          );
        }),
      setAccountArchived: (accountId, isArchived) =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(
            archiveAccount(serviceData, state.currentUserId, accountId, isArchived),
          );
        }),
      getCategories: type => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return listCategories(serviceData, state.currentUserId, type);
      },
      addCategory: payload =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(createCategory(serviceData, state.currentUserId, payload));
        }),
      editCategory: (categoryId, payload) =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(
            updateCategory(serviceData, state.currentUserId, categoryId, payload),
          );
        }),
      removeCategory: categoryId =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(deleteCategory(serviceData, state.currentUserId, categoryId));
        }),
      replaceCategoryAndRemove: (fromCategoryId, toCategoryId) =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(
            replaceCategoryAndDelete(
              serviceData,
              state.currentUserId,
              fromCategoryId,
              toCategoryId,
            ),
          );
        }),
      getBills: filters => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return listBills(serviceData, state.currentUserId, filters);
      },
      getBillSections: filters => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return listBillSections(serviceData, state.currentUserId, filters);
      },
      getAccountLedger: accountId => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return listAccountLedger(serviceData, state.currentUserId, accountId);
      },
      getBillById: billId => {
        const state = get();
        return state.bills.find(
          bill => bill.id === billId && bill.userId === state.currentUserId && !bill.deleted,
        );
      },
      saveBillRecord: (payload, billId) =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(saveBill(serviceData, state.currentUserId, payload, billId));
        }),
      deleteBillRecord: billId =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(deleteBill(serviceData, state.currentUserId, billId));
        }),
      setBudget: (month, amount) =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(upsertBudget(serviceData, state.currentUserId, month, amount));
        }),
      getBudgetByMonth: month => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return getBudgetSummary(serviceData, state.currentUserId, month);
      },
      getBudgetHistory: limit => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return listBudgetHistory(serviceData, state.currentUserId, limit);
      },
      copyBudgetFromLastMonth: month =>
        set(state => {
          const serviceData = buildServiceData(state, state.currentUserId);
          return pickBusinessData(copyLastMonthBudget(serviceData, state.currentUserId, month));
        }),
      getOverview: () => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return getOverviewStats(serviceData, state.currentUserId);
      },
      getCategoryBreakdown: (month, type) => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return getCategoryStats(serviceData, state.currentUserId, month, type);
      },
      getTrend: (rangeDays, type) => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return getTrendData(serviceData, state.currentUserId, rangeDays, type);
      },
      getTrendByRange: (startDate, endDate, type, filters) => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return getTrendDataByRange(
          serviceData,
          state.currentUserId,
          startDate,
          endDate,
          type,
          filters,
        );
      },
      getCategoryBreakdownByRange: (startDate, endDate, type, filters) => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return getCategoryStatsByRange(
          serviceData,
          state.currentUserId,
          startDate,
          endDate,
          type,
          filters,
        );
      },
      getPreviousPeriodTotalByRange: (startDate, endDate, type, filters) => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return getPreviousPeriodTotalByRange(
          serviceData,
          state.currentUserId,
          startDate,
          endDate,
          type,
          filters,
        );
      },
      getIncomeExpenseTotalsByRange: (startDate, endDate, filters) => {
        const state = get();
        const serviceData = buildServiceData(state, state.currentUserId);
        return getIncomeExpenseTotalsByRange(
          serviceData,
          state.currentUserId,
          startDate,
          endDate,
          filters,
        );
      },
      exportCurrentUserData: () => {
        try {
          const state = get();
          const serviceData = buildServiceData(state, state.currentUserId);
          return exportAppData(serviceData, state.currentUserId);
        } catch (error) {
          reportAppStoreError(error, 'exportCurrentUserData');
          throw error;
        }
      },
      importCurrentUserData: payload =>
        set(state => {
          try {
            const serviceData = buildServiceData(state, state.currentUserId);
            return pickBusinessData(importAppData(serviceData, state.currentUserId, payload));
          } catch (error) {
            reportAppStoreError(error, 'importCurrentUserData', {
              hasPayload: Boolean(payload),
            });
            throw error;
          }
        }),
    }),
    {
      name: storageKeys.app,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        schemaVersion: state.schemaVersion,
        categories: state.categories,
        accounts: state.accounts,
        bills: state.bills,
        budgets: state.budgets,
      }),
      onRehydrateStorage: () => () => {
        try {
          useAppStore.setState(current => {
            const legacyCurrent = current as unknown as Partial<PersistedAppData>;
            const persistedSnapshot = normalizePersistedAppData({
              schemaVersion: legacyCurrent.schemaVersion,
              users: legacyCurrent.users,
              currentUserId: legacyCurrent.currentUserId,
              authCredentials: legacyCurrent.authCredentials,
              categories: legacyCurrent.categories,
              accounts: legacyCurrent.accounts,
              bills: legacyCurrent.bills,
              budgets: legacyCurrent.budgets,
            });
            useAuthStore.getState().hydrateFromLegacy({
              users: persistedSnapshot.users,
              currentUserId: persistedSnapshot.currentUserId,
              authCredentials: persistedSnapshot.authCredentials,
            });
            const activeUserId = useAuthStore.getState().currentUserId;
            const businessSnapshot = pickBusinessData(persistedSnapshot);
            const normalized = ensureUserDemoData(
              buildServiceData(businessSnapshot, activeUserId),
              activeUserId,
            );
            return {
              ...pickBusinessData(normalized),
              currentUserId: activeUserId,
              hydrated: true,
            };
          });
        } catch (error) {
          reportAppStoreError(error, 'rehydrate');
          throw error;
        }
      },
    },
  ),
);

let lastSyncedCurrentUserId = useAuthStore.getState().currentUserId;

useAuthStore.subscribe(state => {
  try {
    const {currentUserId} = state;
    if (currentUserId === lastSyncedCurrentUserId) {
      return;
    }
    lastSyncedCurrentUserId = currentUserId;

    useAppStore.setState(previous => {
      const syncedState =
        previous.currentUserId === currentUserId
          ? previous
          : {...previous, currentUserId};
      if (!currentUserId) {
        return syncedState;
      }

      const ensured = ensureUserDemoData(buildServiceData(syncedState, currentUserId), currentUserId);
      return {
        ...syncedState,
        ...pickBusinessData(ensured),
        currentUserId,
      };
    });
  } catch (error) {
    reportAppStoreError(error, 'authStateSync');
    throw error;
  }
});
