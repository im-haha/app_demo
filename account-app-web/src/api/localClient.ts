import type {
  BillFilters,
  BillInput,
  BillType,
  BudgetSummary,
  LoginPayload,
  OverviewStats,
  RegisterPayload,
  UserProfile,
} from 'account-app-shared';
import {
  STORAGE_KEY,
  createInitialAppData,
  deleteBill,
  ensureUserDemoData,
  getBudgetSummary,
  getCategoryStats,
  getOverviewStats,
  getTrendData,
  listBills,
  listCategories,
  loginUser,
  registerUser,
  saveBill,
  type PersistedAppData,
  updateNickname,
  upsertBudget,
} from 'account-app-shared';
import type {AppClient} from './client';

const APP_STORAGE_KEY = STORAGE_KEY;

function normalizeData(raw: Partial<PersistedAppData> | null | undefined): PersistedAppData {
  const initial = createInitialAppData();

  if (!raw) {
    return initial;
  }

  return {
    users: Array.isArray(raw.users) ? raw.users : initial.users,
    currentUserId: raw.currentUserId ?? initial.currentUserId,
    token: raw.token ?? initial.token,
    categories: Array.isArray(raw.categories) ? raw.categories : initial.categories,
    bills: Array.isArray(raw.bills) ? raw.bills : initial.bills,
    budgets: Array.isArray(raw.budgets) ? raw.budgets : initial.budgets,
  };
}

function readData(): PersistedAppData {
  if (typeof window === 'undefined') {
    return createInitialAppData();
  }

  const raw = window.localStorage.getItem(APP_STORAGE_KEY);
  if (!raw) {
    return createInitialAppData();
  }

  try {
    return normalizeData(JSON.parse(raw) as Partial<PersistedAppData>);
  } catch {
    return createInitialAppData();
  }
}

function writeData(data: PersistedAppData): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
}

function mutate(transformer: (data: PersistedAppData) => PersistedAppData): PersistedAppData {
  const current = readData();
  const next = transformer(current);
  writeData(next);
  return next;
}

function initializeLocalState(): PersistedAppData {
  const current = readData();
  const next = ensureUserDemoData(current, current.currentUserId);
  writeData(next);
  return next;
}

function findCurrentUser(data: PersistedAppData): UserProfile | undefined {
  return data.users.find(user => user.id === data.currentUserId);
}

export const localClient: AppClient = {
  async initialize(): Promise<void> {
    initializeLocalState();
  },

  async getSession() {
    const current = readData();
    return {
      currentUserId: current.currentUserId,
      token: current.token,
    };
  },

  async login(payload: LoginPayload): Promise<UserProfile> {
    const next = mutate(current => loginUser(current, payload.username, payload.password));
    const currentUser = findCurrentUser(next);
    if (!currentUser) {
      throw new Error('登录失败');
    }
    return currentUser;
  },

  async register(payload: RegisterPayload): Promise<UserProfile> {
    const next = mutate(current => registerUser(current, payload));
    const currentUser = findCurrentUser(next);
    if (!currentUser) {
      throw new Error('注册失败');
    }
    return currentUser;
  },

  async logout(): Promise<void> {
    mutate(current => ({
      ...current,
      currentUserId: null,
      token: null,
    }));
  },

  async getCurrentUser(): Promise<UserProfile | undefined> {
    const current = initializeLocalState();
    return findCurrentUser(current);
  },

  async updateProfileNickname(nickname: string): Promise<UserProfile | undefined> {
    const next = mutate(current => updateNickname(current, current.currentUserId, nickname));
    return findCurrentUser(next);
  },

  async getCategories(type?: BillType) {
    const current = initializeLocalState();
    return listCategories(current, current.currentUserId, type);
  },

  async getBills(filters?: BillFilters) {
    const current = initializeLocalState();
    return listBills(current, current.currentUserId, filters);
  },

  async addBill(payload: BillInput): Promise<void> {
    mutate(current => saveBill(current, current.currentUserId, payload));
  },

  async deleteBill(billId: number): Promise<void> {
    mutate(current => deleteBill(current, current.currentUserId, billId));
  },

  async saveBudget(month: string, amount: number): Promise<void> {
    mutate(current => upsertBudget(current, current.currentUserId, month, amount));
  },

  async getBudget(month: string): Promise<BudgetSummary> {
    const current = initializeLocalState();
    return getBudgetSummary(current, current.currentUserId, month);
  },

  async getOverview(): Promise<OverviewStats> {
    const current = initializeLocalState();
    return getOverviewStats(current, current.currentUserId);
  },

  async getCategoryStats(month, type) {
    const current = initializeLocalState();
    return getCategoryStats(current, current.currentUserId, month, type);
  },

  async getTrend(rangeDays, type) {
    const current = initializeLocalState();
    return getTrendData(current, current.currentUserId, rangeDays, type);
  },

  async getRecentBills(limit = 8) {
    const bills = await this.getBills();
    return bills.slice(0, limit);
  },
};
