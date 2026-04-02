import dayjs from 'dayjs';
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
import {STORAGE_KEY} from 'account-app-shared';
import type {AppClient} from './client';
import {request} from './http';

interface ServerUser {
  id: number | string;
  username: string;
  nickname: string;
  avatar?: string | null;
  status?: number;
}

interface ServerAuthLogin {
  token: string;
  user: ServerUser;
}

interface ServerCategory {
  id: number | string;
  userId: number | string | null;
  type: BillType;
  name: string;
  icon: string;
  color: string;
  sortNum: number;
  isDefault: boolean;
}

interface ServerBill {
  id: number | string;
  userId: number | string;
  type: BillType;
  amount: number | string;
  categoryId: number | string;
  accountType: BillInput['accountType'];
  billTime: string;
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ServerBudget {
  month: string;
  budgetAmount: number | string;
  spentAmount: number | string;
  remainingAmount: number | string;
  usageRate: number;
}

interface ServerOverview {
  todayIncome: number | string;
  todayExpense: number | string;
  monthIncome: number | string;
  monthExpense: number | string;
  monthBalance: number | string;
}

interface ServerPage<T> {
  list: T[];
  total: number;
}

interface RemoteSession {
  token: string | null;
  currentUser: UserProfile | null;
}

const SESSION_STORAGE_KEY = `${STORAGE_KEY}:web-remote-session`;

function nowString(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toUserProfile(source: ServerUser): UserProfile {
  const now = nowString();

  return {
    id: toNumber(source.id),
    username: source.username,
    nickname: source.nickname,
    avatar: source.avatar ?? undefined,
    status: source.status ?? 1,
    password: '',
    createdAt: now,
    updatedAt: now,
  };
}

function toCategory(source: ServerCategory): Category {
  const now = nowString();

  return {
    id: toNumber(source.id),
    userId: source.userId === null ? null : toNumber(source.userId),
    type: source.type,
    name: source.name,
    icon: source.icon,
    color: source.color,
    sortNum: toNumber(source.sortNum),
    isDefault: Boolean(source.isDefault),
    createdAt: now,
    updatedAt: now,
  };
}

function toBill(source: ServerBill): BillRecord {
  const now = nowString();

  return {
    id: toNumber(source.id),
    userId: toNumber(source.userId),
    type: source.type,
    amount: toNumber(source.amount),
    categoryId: toNumber(source.categoryId),
    accountType: source.accountType,
    billTime: source.billTime,
    remark: source.remark ?? '',
    deleted: false,
    createdAt: source.createdAt ?? now,
    updatedAt: source.updatedAt ?? now,
  };
}

function readSession(): RemoteSession {
  if (typeof window === 'undefined') {
    return {
      token: null,
      currentUser: null,
    };
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return {
      token: null,
      currentUser: null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RemoteSession>;
    return {
      token: parsed.token ?? null,
      currentUser: parsed.currentUser ?? null,
    };
  } catch {
    return {
      token: null,
      currentUser: null,
    };
  }
}

function writeSession(next: RemoteSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
}

function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function requireToken(): string {
  const {token} = readSession();
  if (!token) {
    throw new Error('请先登录');
  }

  return token;
}

export const remoteClient: AppClient = {
  async initialize(): Promise<void> {
    return;
  },

  async getSession() {
    const session = readSession();
    return {
      currentUserId: session.currentUser?.id ?? null,
      token: session.token,
    };
  },

  async login(payload: LoginPayload): Promise<UserProfile> {
    const response = await request<ServerAuthLogin>('/auth/login', {
      method: 'POST',
      body: payload,
    });

    const currentUser = toUserProfile(response.user);
    writeSession({
      token: response.token,
      currentUser,
    });

    return currentUser;
  },

  async register(payload: RegisterPayload): Promise<UserProfile> {
    const response = await request<ServerAuthLogin>('/auth/register', {
      method: 'POST',
      body: payload,
    });

    const currentUser = toUserProfile(response.user);
    writeSession({
      token: response.token,
      currentUser,
    });

    return currentUser;
  },

  async logout(): Promise<void> {
    clearSession();
  },

  async getCurrentUser(): Promise<UserProfile | undefined> {
    const session = readSession();
    if (!session.token) {
      return undefined;
    }

    if (session.currentUser) {
      return session.currentUser;
    }

    const profile = await request<ServerUser>('/user/me', {
      method: 'GET',
      token: session.token,
    });

    const currentUser = toUserProfile(profile);
    writeSession({
      token: session.token,
      currentUser,
    });

    return currentUser;
  },

  async updateProfileNickname(nickname: string): Promise<UserProfile | undefined> {
    const token = requireToken();
    const next = await request<ServerUser>('/user/profile', {
      method: 'PUT',
      token,
      body: {
        nickname,
      },
    });

    const currentUser = toUserProfile(next);
    writeSession({
      token,
      currentUser,
    });

    return currentUser;
  },

  async getCategories(type?: BillType): Promise<Category[]> {
    const token = requireToken();
    const result = await request<ServerCategory[]>('/category/list', {
      method: 'GET',
      token,
      query: {
        type,
      },
    });

    return result.map(toCategory);
  },

  async getBills(filters?: BillFilters): Promise<BillRecord[]> {
    const token = requireToken();
    const result = await request<ServerPage<ServerBill>>('/bill/page', {
      method: 'GET',
      token,
      query: {
        pageNum: 1,
        pageSize: 200,
        type: filters?.type === 'ALL' ? undefined : filters?.type,
        categoryId: filters?.categoryId ?? undefined,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        keyword: filters?.keyword,
      },
    });

    return result.list.map(toBill);
  },

  async addBill(payload: BillInput): Promise<void> {
    const token = requireToken();
    await request<null>('/bill', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  async deleteBill(billId: number): Promise<void> {
    const token = requireToken();
    await request<null>(`/bill/${billId}`, {
      method: 'DELETE',
      token,
    });
  },

  async saveBudget(month: string, amount: number): Promise<void> {
    const token = requireToken();
    await request<null>('/budget', {
      method: 'POST',
      token,
      body: {
        month,
        amount,
      },
    });
  },

  async getBudget(month: string): Promise<BudgetSummary> {
    const token = requireToken();
    const budget = await request<ServerBudget>('/budget', {
      method: 'GET',
      token,
      query: {
        month,
      },
    });

    return {
      month: budget.month,
      budgetAmount: toNumber(budget.budgetAmount),
      spentAmount: toNumber(budget.spentAmount),
      remainingAmount: toNumber(budget.remainingAmount),
      usageRate: toNumber(budget.usageRate),
    };
  },

  async getOverview(): Promise<OverviewStats> {
    const token = requireToken();
    const data = await request<ServerOverview>('/stats/overview', {
      method: 'GET',
      token,
    });

    return {
      todayIncome: toNumber(data.todayIncome),
      todayExpense: toNumber(data.todayExpense),
      monthIncome: toNumber(data.monthIncome),
      monthExpense: toNumber(data.monthExpense),
      monthBalance: toNumber(data.monthBalance),
    };
  },

  async getCategoryStats(month: string, type: BillType): Promise<CategoryStat[]> {
    const token = requireToken();
    const data = await request<Array<CategoryStat & {amount: number | string}>>('/stats/category', {
      method: 'GET',
      token,
      query: {
        month,
        type,
      },
    });

    return data.map(item => ({
      ...item,
      amount: toNumber(item.amount),
    }));
  },

  async getTrend(rangeDays: number, type: BillType): Promise<TrendPoint[]> {
    const token = requireToken();
    const data = await request<Array<TrendPoint & {amount: number | string}>>('/stats/trend', {
      method: 'GET',
      token,
      query: {
        type,
        range: rangeDays,
      },
    });

    return data.map(item => ({
      ...item,
      amount: toNumber(item.amount),
    }));
  },

  async getRecentBills(limit = 8): Promise<BillRecord[]> {
    const list = await this.getBills();
    return list.slice(0, limit);
  },
};
