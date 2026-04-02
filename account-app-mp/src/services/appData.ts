import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import {STORAGE_KEY} from '@/shared/constants';
import type {
  BillFilters,
  BillInput,
  BillRecord,
  BillType,
  BudgetSummary,
  Category,
  CategoryStat,
  OverviewStats,
  TrendPoint,
} from '@/shared/types/bill';
import type {LoginPayload, RegisterPayload, UserProfile} from '@/shared/types/user';
import {
  createInitialAppData,
  ensureUserDemoData,
  getBudgetSummary,
  getCategoryStats,
  getOverviewStats,
  getTrendData,
  listBills,
  listCategories,
  loginUser,
  saveBill,
  type PersistedAppData,
  registerUser,
  deleteBill,
  updateNickname,
} from '@/shared/services/localAppService';

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
  const raw = Taro.getStorageSync(APP_STORAGE_KEY) as Partial<PersistedAppData> | string | undefined;
  if (!raw) {
    return createInitialAppData();
  }
  if (typeof raw === 'string') {
    try {
      return normalizeData(JSON.parse(raw) as Partial<PersistedAppData>);
    } catch {
      return createInitialAppData();
    }
  }
  return normalizeData(raw);
}

function writeData(data: PersistedAppData): void {
  Taro.setStorageSync(APP_STORAGE_KEY, data);
}

function mutate(transformer: (data: PersistedAppData) => PersistedAppData): PersistedAppData {
  const current = readData();
  const next = transformer(current);
  writeData(next);
  return next;
}

function ensureHydrated(data: PersistedAppData): PersistedAppData {
  const next = ensureUserDemoData(data, data.currentUserId);
  writeData(next);
  return next;
}

export function initializeLocalState(): PersistedAppData {
  const current = readData();
  return ensureHydrated(current);
}

export function registerLocal(payload: RegisterPayload): UserProfile {
  const next = mutate(current => registerUser(current, payload));
  const currentUser = next.users.find(item => item.id === next.currentUserId);
  if (!currentUser) {
    throw new Error('注册失败');
  }
  return currentUser;
}

export function loginLocal(payload: LoginPayload): UserProfile {
  const next = mutate(current => loginUser(current, payload.username, payload.password));
  const currentUser = next.users.find(item => item.id === next.currentUserId);
  if (!currentUser) {
    throw new Error('登录失败');
  }
  return currentUser;
}

export function logoutLocal(): void {
  mutate(current => ({
    ...current,
    currentUserId: null,
    token: null,
  }));
}

export function getSession(): {currentUserId: number | null; token: string | null} {
  const current = readData();
  return {
    currentUserId: current.currentUserId,
    token: current.token,
  };
}

export function getCurrentUserLocal(): UserProfile | undefined {
  const current = readData();
  return current.users.find(user => user.id === current.currentUserId);
}

export function updateProfileNickname(nickname: string): UserProfile | undefined {
  const next = mutate(current => updateNickname(current, current.currentUserId, nickname));
  return next.users.find(user => user.id === next.currentUserId);
}

export function getCategoriesLocal(type?: BillType): Category[] {
  const current = initializeLocalState();
  return listCategories(current, current.currentUserId, type);
}

export function getBillsLocal(filters?: BillFilters): BillRecord[] {
  const current = initializeLocalState();
  return listBills(current, current.currentUserId, filters);
}

export function addBillLocal(payload: BillInput): void {
  mutate(current => saveBill(current, current.currentUserId, payload));
}

export function deleteBillLocal(billId: number): void {
  mutate(current => deleteBill(current, current.currentUserId, billId));
}

export function getRecentBills(limit = 8): BillRecord[] {
  return getBillsLocal().slice(0, limit);
}

export function getOverviewLocal(): OverviewStats {
  const current = initializeLocalState();
  return getOverviewStats(current, current.currentUserId);
}

export function getBudgetSummaryLocal(month: string): BudgetSummary {
  const current = initializeLocalState();
  return getBudgetSummary(current, current.currentUserId, month);
}

export function getCategoryStatsLocal(month: string, type: BillType): CategoryStat[] {
  const current = initializeLocalState();
  return getCategoryStats(current, current.currentUserId, month, type);
}

export function getTrendLocal(rangeDays: number, type: BillType): TrendPoint[] {
  const current = initializeLocalState();
  return getTrendData(current, current.currentUserId, rangeDays, type);
}

export function buildQuickBillPayload(
  amountText: string,
  remark: string,
  type: BillType,
): BillInput {
  const amount = Number(amountText);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('请输入大于 0 的金额');
  }

  const categories = getCategoriesLocal(type);
  const defaultCategory = categories[0];
  if (!defaultCategory) {
    throw new Error('当前没有可用分类');
  }

  return {
    type,
    amount,
    categoryId: defaultCategory.id,
    accountType: 'WECHAT',
    billTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    remark: remark.trim(),
  };
}
