import dayjs from 'dayjs';
import {
  Account,
  AccountLedgerDirection,
  AccountLedgerEntry,
  AccountType,
  BillFilters,
  BillInput,
  BillListSection,
  BillRecord,
  BillType,
  BudgetSetting,
  BudgetSummary,
  Category,
  CategoryStat,
  OverviewStats,
  TrendPoint,
} from '@/types/bill';
import {RegisterPayload, UserProfile} from '@/types/user';
import {defaultCategories} from '@/data/defaultCategories';
import {buildStatsTrendPointsByRange} from '@/utils/statsDisplayData';
import {normalizeDateRange} from '@/utils/timeRange';

export interface LocalAuthCredential {
  userId: number;
  passwordHash: string;
  updatedAt: string;
}

export interface PersistedAppData {
  schemaVersion: number;
  users: UserProfile[];
  currentUserId: number | null;
  authCredentials: LocalAuthCredential[];
  categories: Category[];
  accounts: Account[];
  bills: BillRecord[];
  budgets: BudgetSetting[];
}

export function createInitialAppData(): PersistedAppData {
  return {
    schemaVersion: 4,
    users: [],
    currentUserId: null,
    authCredentials: [],
    categories: defaultCategories,
    accounts: [],
    bills: [],
    budgets: [],
  };
}

function nextId(items: Array<{id: number}>): number {
  return items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
}

function nowString(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function normalizeUsername(username: string): string {
  return username.trim();
}

export function hashLocalPassword(username: string, password: string): string {
  const source = `account-app-local-auth-v1|${normalizeUsername(username).toLowerCase()}|${password}`;
  let hashA = 0x811c9dc5;
  let hashB = 0x811c9dc5;

  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193) >>> 0;
    hashB ^= source.charCodeAt(source.length - 1 - index);
    hashB = Math.imul(hashB, 0x01000193) >>> 0;
  }

  return `${hashA.toString(16).padStart(8, '0')}${hashB.toString(16).padStart(8, '0')}`;
}

interface LegacyUserProfile extends UserProfile {
  password?: string;
}

interface LegacyPersistedAppData extends Partial<PersistedAppData> {
  users?: LegacyUserProfile[];
  token?: string | null;
}

export function normalizePersistedAppData(input: LegacyPersistedAppData): PersistedAppData {
  const categories = Array.isArray(input.categories) ? input.categories : defaultCategories;
  const accounts = Array.isArray(input.accounts) ? input.accounts : [];
  const bills = Array.isArray(input.bills) ? input.bills : [];
  const budgets = Array.isArray(input.budgets) ? input.budgets : [];

  const users: UserProfile[] = Array.isArray(input.users)
    ? input.users.map(({password: _password, ...user}) => user)
    : [];

  const explicitCredentials = Array.isArray(input.authCredentials)
    ? input.authCredentials.filter(
        item =>
          Number.isFinite(item.userId) &&
          typeof item.passwordHash === 'string' &&
          item.passwordHash.length > 0,
      )
    : [];
  const knownCredentialUsers = new Set(explicitCredentials.map(item => item.userId));
  const migratedLegacyCredentials: LocalAuthCredential[] = Array.isArray(input.users)
    ? input.users
        .filter(
          item =>
            typeof item.password === 'string' &&
            item.password.length > 0 &&
            !knownCredentialUsers.has(item.id),
        )
        .map(item => ({
          userId: item.id,
          passwordHash: hashLocalPassword(item.username, item.password as string),
          updatedAt: item.updatedAt ?? nowString(),
        }))
    : [];
  const authCredentials = [...explicitCredentials, ...migratedLegacyCredentials];
  const currentUserId =
    typeof input.currentUserId === 'number' && users.some(user => user.id === input.currentUserId)
      ? input.currentUserId
      : null;

  return {
    schemaVersion: Number.isFinite(input.schemaVersion) ? Number(input.schemaVersion) : 4,
    users,
    currentUserId,
    authCredentials,
    categories,
    accounts,
    bills,
    budgets,
  };
}

function ensureCurrentUserId(currentUserId: number | null): number {
  if (!currentUserId) {
    throw new Error('请先登录');
  }

  return currentUserId;
}

function findCategoryId(
  data: PersistedAppData,
  userId: number,
  type: BillType,
  name: string,
): number {
  const userCategory = data.categories.find(
    category => category.userId === userId && category.type === type && category.name === name,
  );
  if (userCategory) {
    return userCategory.id;
  }

  const defaultCategory = data.categories.find(
    category => category.userId === null && category.type === type && category.name === name,
  );
  if (defaultCategory) {
    return defaultCategory.id;
  }

  const fallback = data.categories.find(category => category.type === type);
  return fallback?.id ?? 1;
}

const DEFAULT_ACCOUNT_TEMPLATES: Array<{name: string; type: AccountType}> = [
  {name: '日常微信', type: 'WECHAT'},
  {name: '日常支付宝', type: 'ALIPAY'},
  {name: '常用银行卡', type: 'BANK_CARD'},
  {name: '现金钱包', type: 'CASH'},
];

function buildDefaultAccounts(data: PersistedAppData, userId: number): Account[] {
  const now = nowString();
  let accountId = nextId(data.accounts);

  return DEFAULT_ACCOUNT_TEMPLATES.map((template, index) => {
    const account: Account = {
      id: accountId,
      userId,
      name: template.name,
      type: template.type,
      openingBalance: 0,
      currentBalance: 0,
      includeInTotal: true,
      isArchived: false,
      sortNum: index + 1,
      createdAt: now,
      updatedAt: now,
    };
    accountId += 1;
    return account;
  });
}

function resolveAccountByType(accounts: Account[], type: AccountType): Account | undefined {
  const activeMatch = accounts.find(account => account.type === type && !account.isArchived);
  if (activeMatch) {
    return activeMatch;
  }
  return accounts.find(account => !account.isArchived) ?? accounts[0];
}

function ensureUserAccounts(
  data: PersistedAppData,
  userId: number,
): PersistedAppData {
  const hasUserAccount = data.accounts.some(account => account.userId === userId);
  if (hasUserAccount) {
    return data;
  }

  return {
    ...data,
    accounts: [...data.accounts, ...buildDefaultAccounts(data, userId)],
  };
}

function fillMissingBillAccountIds(
  data: PersistedAppData,
  userId: number,
): PersistedAppData {
  const userAccounts = data.accounts.filter(account => account.userId === userId);
  if (userAccounts.length === 0) {
    return data;
  }

  let changed = false;
  const nextBills = data.bills.map(bill => {
    if (bill.userId !== userId || bill.deleted) {
      return bill;
    }

    const matchedById =
      bill.accountId !== null && bill.accountId !== undefined
        ? userAccounts.find(account => account.id === bill.accountId)
        : undefined;
    if (matchedById) {
      if (bill.accountType !== matchedById.type) {
        changed = true;
        return {
          ...bill,
          accountType: matchedById.type,
        };
      }
      return bill;
    }

    const fallbackAccount =
      resolveAccountByType(userAccounts, bill.accountType) ?? userAccounts[0];
    if (!fallbackAccount) {
      return bill;
    }

    changed = true;
    return {
      ...bill,
      accountId: fallbackAccount.id,
      accountType: fallbackAccount.type,
    };
  });

  if (!changed) {
    return data;
  }

  return {
    ...data,
    bills: nextBills,
  };
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function recalculateUserAccountBalances(
  data: PersistedAppData,
  userId: number,
): PersistedAppData {
  const userAccounts = data.accounts.filter(account => account.userId === userId);
  if (userAccounts.length === 0) {
    return data;
  }

  const balanceMap = new Map<number, number>();
  userAccounts.forEach(account => {
    balanceMap.set(account.id, account.openingBalance);
  });

  data.bills.forEach(bill => {
    if (bill.userId !== userId || bill.deleted || !bill.accountId) {
      return;
    }

    if (bill.isTransfer && bill.transferTargetAccountId) {
      if (balanceMap.has(bill.accountId)) {
        balanceMap.set(
          bill.accountId,
          (balanceMap.get(bill.accountId) ?? 0) - bill.amount,
        );
      }
      if (balanceMap.has(bill.transferTargetAccountId)) {
        balanceMap.set(
          bill.transferTargetAccountId,
          (balanceMap.get(bill.transferTargetAccountId) ?? 0) + bill.amount,
        );
      }
      return;
    }

    const delta = bill.type === 'INCOME' ? bill.amount : -bill.amount;
    if (balanceMap.has(bill.accountId)) {
      balanceMap.set(bill.accountId, (balanceMap.get(bill.accountId) ?? 0) + delta);
    }
  });

  return {
    ...data,
    accounts: data.accounts.map(account => {
      if (account.userId !== userId) {
        return account;
      }
      return {
        ...account,
        currentBalance: roundCurrency(balanceMap.get(account.id) ?? account.openingBalance),
      };
    }),
  };
}

function ensureUserAccountDomainData(
  data: PersistedAppData,
  userId: number,
): PersistedAppData {
  const withAccounts = ensureUserAccounts(data, userId);
  const withBillAccounts = fillMissingBillAccountIds(withAccounts, userId);
  return recalculateUserAccountBalances(withBillAccounts, userId);
}

function buildDemoBills(data: PersistedAppData, userId: number): BillRecord[] {
  const expenseAmounts = [86, 52, 108, 64, 78, 56, 92];
  const incomeAmounts = [0, 180, 0, 0, 320, 0, 0];
  const expenseRemarks = [
    '午餐和咖啡',
    '地铁通勤',
    '家用补货',
    '晚餐聚会',
    '周中采购',
    '交通补票',
    '周末聚餐',
  ];
  const expenseCategoryNames = ['餐饮', '交通', '购物', '娱乐', '住房', '通讯', '餐饮'];
  const incomeCategoryNames = ['兼职', '奖金', '转账'];
  const accountTypes: AccountType[] = ['WECHAT', 'ALIPAY', 'BANK_CARD', 'CASH'];
  const userAccounts = data.accounts.filter(account => account.userId === userId);
  const now = nowString();
  let billId = nextId(data.bills);
  const demoBills: BillRecord[] = [];

  for (let index = 0; index < 7; index += 1) {
    const day = dayjs().subtract(6 - index, 'day');
    const expenseAmount = expenseAmounts[index];
    const expenseAccountType = accountTypes[index % accountTypes.length];
    const expenseAccount = resolveAccountByType(userAccounts, expenseAccountType);
    demoBills.push({
      id: billId,
      userId,
      type: 'EXPENSE',
      amount: expenseAmount,
      categoryId: findCategoryId(
        data,
        userId,
        'EXPENSE',
        expenseCategoryNames[index % expenseCategoryNames.length],
      ),
      accountType: expenseAccount?.type ?? expenseAccountType,
      accountId: expenseAccount?.id ?? null,
      billTime: day.hour(12).minute(18).second(0).format('YYYY-MM-DD HH:mm:ss'),
      remark: expenseRemarks[index],
      deleted: false,
      createdAt: now,
      updatedAt: now,
    });
    billId += 1;

    if (incomeAmounts[index] > 0) {
      const incomeAccountType = accountTypes[(index + 1) % accountTypes.length];
      const incomeAccount = resolveAccountByType(userAccounts, incomeAccountType);
      demoBills.push({
        id: billId,
        userId,
        type: 'INCOME',
        amount: incomeAmounts[index],
        categoryId: findCategoryId(
          data,
          userId,
          'INCOME',
          incomeCategoryNames[index % incomeCategoryNames.length],
        ),
        accountType: incomeAccount?.type ?? incomeAccountType,
        accountId: incomeAccount?.id ?? null,
        billTime: day.hour(20).minute(15).second(0).format('YYYY-MM-DD HH:mm:ss'),
        remark: index === 1 ? '夜间接单' : '临时奖金',
        deleted: false,
        createdAt: now,
        updatedAt: now,
      });
      billId += 1;
    }
  }

  const salaryDate =
    dayjs().date() > 3
      ? dayjs().startOf('month').add(2, 'day').hour(10).minute(30).second(0)
      : dayjs().subtract(2, 'day').hour(10).minute(30).second(0);
  const salaryAccount = resolveAccountByType(userAccounts, 'BANK_CARD');
  demoBills.push({
    id: billId,
    userId,
    type: 'INCOME',
    amount: 6800,
    categoryId: findCategoryId(data, userId, 'INCOME', '工资'),
    accountType: salaryAccount?.type ?? 'BANK_CARD',
    accountId: salaryAccount?.id ?? null,
    billTime: salaryDate.format('YYYY-MM-DD HH:mm:ss'),
    remark: '本月工资',
    deleted: false,
    createdAt: now,
    updatedAt: now,
  });

  return demoBills;
}

export function ensureUserDemoData(
  data: PersistedAppData,
  currentUserId: number | null,
  options?: {enableDemoData?: boolean},
): PersistedAppData {
  if (!currentUserId) {
    return data;
  }

  const dataWithAccounts = ensureUserAccountDomainData(data, currentUserId);
  if (!options?.enableDemoData) {
    return dataWithAccounts;
  }

  const hasAnyBill = dataWithAccounts.bills.some(
    bill => bill.userId === currentUserId && !bill.deleted,
  );
  if (hasAnyBill) {
    return dataWithAccounts;
  }

  const now = nowString();
  const month = dayjs().format('YYYY-MM');
  const demoBills = buildDemoBills(dataWithAccounts, currentUserId);
  const hasBudget = dataWithAccounts.budgets.some(
    budget => budget.userId === currentUserId && budget.month === month,
  );
  const nextBudgets = hasBudget
    ? dataWithAccounts.budgets
    : [
        ...dataWithAccounts.budgets,
        {
          id: nextId(dataWithAccounts.budgets),
          userId: currentUserId,
          month,
          amount: 4200,
          createdAt: now,
          updatedAt: now,
        },
      ];

  return ensureUserAccountDomainData(
    {
      ...dataWithAccounts,
      bills: [...demoBills, ...dataWithAccounts.bills],
      budgets: nextBudgets,
    },
    currentUserId,
  );
}

export function registerUser(data: PersistedAppData, payload: RegisterPayload): PersistedAppData {
  const username = normalizeUsername(payload.username);
  const duplicated = data.users.find(user => user.username === username);
  if (duplicated) {
    throw new Error('用户名已存在');
  }

  const now = nowString();
  const user: UserProfile = {
    id: nextId(data.users),
    username,
    nickname: payload.nickname.trim(),
    status: 1,
    createdAt: now,
    updatedAt: now,
  };
  const credential: LocalAuthCredential = {
    userId: user.id,
    passwordHash: hashLocalPassword(username, payload.password),
    updatedAt: now,
  };

  return ensureUserDemoData(
    {
      ...data,
      users: [...data.users, user],
      authCredentials: [...data.authCredentials.filter(item => item.userId !== user.id), credential],
      currentUserId: user.id,
    },
    user.id,
  );
}

export function loginUser(data: PersistedAppData, username: string, password: string): PersistedAppData {
  const normalizedUsername = normalizeUsername(username);
  const user = data.users.find(item => item.username === normalizedUsername);
  const credential = user
    ? data.authCredentials.find(item => item.userId === user.id)
    : undefined;
  const passwordHash = hashLocalPassword(normalizedUsername, password);

  if (!user || !credential || credential.passwordHash !== passwordHash) {
    throw new Error('用户名或密码错误');
  }

  return ensureUserDemoData(
    {
      ...data,
      currentUserId: user.id,
    },
    user.id,
  );
}

export function updateNickname(
  data: PersistedAppData,
  currentUserId: number | null,
  nickname: string,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const now = nowString();

  return {
    ...data,
    users: data.users.map(user =>
      user.id === userId ? {...user, nickname: nickname.trim(), updatedAt: now} : user,
    ),
  };
}

export function listCategories(
  data: PersistedAppData,
  currentUserId: number | null,
  type?: BillType,
): Category[] {
  const userId = currentUserId;

  return data.categories
    .filter(category => (!type ? true : category.type === type))
    .filter(category => category.userId === null || category.userId === userId)
    .sort((left, right) => left.sortNum - right.sortNum);
}

function isCategoryNameDuplicated(
  data: PersistedAppData,
  userId: number,
  type: BillType,
  name: string,
  excludeId?: number,
): boolean {
  const normalizedName = name.trim().toLowerCase();
  return data.categories.some(category => {
    if (category.userId !== userId || category.type !== type) {
      return false;
    }
    if (excludeId && category.id === excludeId) {
      return false;
    }
    return category.name.trim().toLowerCase() === normalizedName;
  });
}

export function createCategory(
  data: PersistedAppData,
  currentUserId: number | null,
  payload: Pick<Category, 'type' | 'name' | 'icon' | 'color'>,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const categoryName = payload.name.trim();
  if (!categoryName) {
    throw new Error('分类名称不能为空');
  }
  if (isCategoryNameDuplicated(data, userId, payload.type, categoryName)) {
    throw new Error('同类型分类名称不能重复');
  }
  const now = nowString();
  const sameTypeCount = data.categories.filter(
    item => item.userId === userId && item.type === payload.type,
  ).length;

  const category: Category = {
    id: nextId(data.categories),
    userId,
    type: payload.type,
    name: categoryName,
    icon: payload.icon,
    color: payload.color,
    sortNum: sameTypeCount + 1,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...data,
    categories: [...data.categories, category],
  };
}

export function updateCategory(
  data: PersistedAppData,
  currentUserId: number | null,
  categoryId: number,
  payload: Partial<Pick<Category, 'name' | 'icon' | 'color'>>,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const targetCategory = data.categories.find(
    category => category.id === categoryId && category.userId === userId,
  );
  if (!targetCategory) {
    throw new Error('分类不存在');
  }
  const nextName = payload.name?.trim();
  if (nextName !== undefined && !nextName) {
    throw new Error('分类名称不能为空');
  }
  if (
    nextName &&
    isCategoryNameDuplicated(data, userId, targetCategory.type, nextName, categoryId)
  ) {
    throw new Error('同类型分类名称不能重复');
  }
  const now = nowString();

  return {
    ...data,
    categories: data.categories.map(category => {
      if (category.id !== categoryId || category.userId !== userId) {
        return category;
      }

      return {
        ...category,
        ...payload,
        name: nextName ?? category.name,
        updatedAt: now,
      };
    }),
  };
}

export function deleteCategory(
  data: PersistedAppData,
  currentUserId: number | null,
  categoryId: number,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const used = data.bills.some(bill => bill.categoryId === categoryId && !bill.deleted);

  if (used) {
    throw new Error('已有账单使用该分类，请先迁移后再删除');
  }

  return {
    ...data,
    categories: data.categories.filter(
      category => !(category.id === categoryId && category.userId === userId),
    ),
  };
}

export function replaceCategoryAndDelete(
  data: PersistedAppData,
  currentUserId: number | null,
  fromCategoryId: number,
  toCategoryId: number,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  if (fromCategoryId === toCategoryId) {
    throw new Error('迁移目标分类不能和原分类相同');
  }

  const fromCategory = data.categories.find(
    category => category.id === fromCategoryId && category.userId === userId,
  );
  if (!fromCategory) {
    throw new Error('待删除分类不存在');
  }
  const toCategory = data.categories.find(category => category.id === toCategoryId);
  if (!toCategory) {
    throw new Error('迁移目标分类不存在');
  }
  if (toCategory.type !== fromCategory.type) {
    throw new Error('迁移目标分类类型不一致');
  }
  const now = nowString();

  return {
    ...data,
    bills: data.bills.map(bill =>
      bill.userId === userId && !bill.deleted && bill.categoryId === fromCategoryId
        ? {...bill, categoryId: toCategoryId, updatedAt: now}
        : bill,
    ),
    categories: data.categories.filter(
      category => !(category.id === fromCategoryId && category.userId === userId),
    ),
  };
}

function isAccountNameDuplicated(
  data: PersistedAppData,
  userId: number,
  name: string,
  excludeId?: number,
): boolean {
  const normalizedName = name.trim().toLowerCase();
  return data.accounts.some(account => {
    if (account.userId !== userId) {
      return false;
    }
    if (excludeId && account.id === excludeId) {
      return false;
    }
    return account.name.trim().toLowerCase() === normalizedName;
  });
}

export function listAccounts(
  data: PersistedAppData,
  currentUserId: number | null,
  options?: {includeArchived?: boolean},
): Account[] {
  const userId = ensureCurrentUserId(currentUserId);
  const includeArchived = Boolean(options?.includeArchived);
  const normalized = ensureUserAccountDomainData(data, userId);

  return normalized.accounts
    .filter(account => account.userId === userId)
    .filter(account => (includeArchived ? true : !account.isArchived))
    .sort((left, right) => left.sortNum - right.sortNum);
}

export function createAccount(
  data: PersistedAppData,
  currentUserId: number | null,
  payload: Pick<Account, 'name' | 'type' | 'openingBalance' | 'includeInTotal'>,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const normalizedName = payload.name.trim();
  if (!normalizedName) {
    throw new Error('账户名称不能为空');
  }
  if (isAccountNameDuplicated(data, userId, normalizedName)) {
    throw new Error('账户名称不能重复');
  }
  if (!Number.isFinite(payload.openingBalance)) {
    throw new Error('期初余额不合法');
  }

  const userAccounts = data.accounts.filter(account => account.userId === userId);
  const now = nowString();
  const account: Account = {
    id: nextId(data.accounts),
    userId,
    name: normalizedName,
    type: payload.type,
    openingBalance: roundCurrency(payload.openingBalance),
    currentBalance: roundCurrency(payload.openingBalance),
    includeInTotal: payload.includeInTotal,
    isArchived: false,
    sortNum: userAccounts.length + 1,
    createdAt: now,
    updatedAt: now,
  };

  return recalculateUserAccountBalances(
    {
      ...data,
      accounts: [...data.accounts, account],
    },
    userId,
  );
}

export function updateAccount(
  data: PersistedAppData,
  currentUserId: number | null,
  accountId: number,
  payload: Partial<Pick<Account, 'name' | 'type' | 'openingBalance' | 'includeInTotal'>>,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const target = data.accounts.find(account => account.id === accountId && account.userId === userId);
  if (!target) {
    throw new Error('账户不存在');
  }

  const nextName = payload.name?.trim();
  if (nextName !== undefined && !nextName) {
    throw new Error('账户名称不能为空');
  }
  if (nextName && isAccountNameDuplicated(data, userId, nextName, accountId)) {
    throw new Error('账户名称不能重复');
  }
  if (
    payload.openingBalance !== undefined &&
    !Number.isFinite(payload.openingBalance)
  ) {
    throw new Error('期初余额不合法');
  }

  const now = nowString();
  const nextData: PersistedAppData = {
    ...data,
    accounts: data.accounts.map(account => {
      if (account.id !== accountId || account.userId !== userId) {
        return account;
      }
      return {
        ...account,
        ...payload,
        name: nextName ?? account.name,
        openingBalance:
          payload.openingBalance !== undefined
            ? roundCurrency(payload.openingBalance)
            : account.openingBalance,
        updatedAt: now,
      };
    }),
  };

  return recalculateUserAccountBalances(nextData, userId);
}

export function archiveAccount(
  data: PersistedAppData,
  currentUserId: number | null,
  accountId: number,
  isArchived: boolean,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const target = data.accounts.find(account => account.id === accountId && account.userId === userId);
  if (!target) {
    throw new Error('账户不存在');
  }

  const activeCount = data.accounts.filter(
    account => account.userId === userId && !account.isArchived,
  ).length;
  if (isArchived && activeCount <= 1 && !target.isArchived) {
    throw new Error('至少保留一个启用账户');
  }

  const now = nowString();
  const nextData: PersistedAppData = {
    ...data,
    accounts: data.accounts.map(account =>
      account.id === accountId && account.userId === userId
        ? {...account, isArchived, updatedAt: now}
        : account,
    ),
  };

  return recalculateUserAccountBalances(nextData, userId);
}

export function listBills(
  data: PersistedAppData,
  currentUserId: number | null,
  filters?: BillFilters,
): BillRecord[] {
  const userId = ensureCurrentUserId(currentUserId);
  const keyword = filters?.keyword?.trim().toLowerCase();
  const merchantKeyword = filters?.merchantKeyword?.trim().toLowerCase();
  const tagKeyword = filters?.tagKeyword?.trim().toLowerCase();
  const sourceFilter = filters?.source;
  const accountPerspectiveAccountId =
    filters?.accountPerspectiveAccountId ?? null;
  const categoryNameMap = new Map<number, string>(
    data.categories.map(category => [category.id, category.name]),
  );
  const accountNameMap = new Map<number, string>(
    data.accounts.map(account => [account.id, account.name]),
  );

  return data.bills
    .filter(bill => bill.userId === userId && !bill.deleted)
    .filter(bill => {
      if (!filters) {
        return true;
      }

      const effectiveType = resolveBillTypeForView(
        bill,
        accountPerspectiveAccountId,
      );
      if (filters.type && filters.type !== 'ALL' && effectiveType !== filters.type) {
        return false;
      }

      if (filters.categoryId !== undefined && filters.categoryId !== null && bill.categoryId !== filters.categoryId) {
        return false;
      }

      if (accountPerspectiveAccountId !== null) {
        if (!isBillRelatedToAccount(bill, accountPerspectiveAccountId)) {
          return false;
        }
      } else if (
        filters.accountId !== undefined &&
        filters.accountId !== null &&
        bill.accountId !== filters.accountId
      ) {
        return false;
      }

      if (filters.startDate && dayjs(bill.billTime).isBefore(dayjs(filters.startDate).startOf('day'))) {
        return false;
      }

      if (filters.endDate && dayjs(bill.billTime).isAfter(dayjs(filters.endDate).endOf('day'))) {
        return false;
      }

      if (filters.accountType && filters.accountType !== 'ALL' && bill.accountType !== filters.accountType) {
        return false;
      }

      if (filters.includeTransfers === false && bill.isTransfer) {
        return false;
      }

      if (typeof filters.minAmount === 'number' && bill.amount < filters.minAmount) {
        return false;
      }

      if (typeof filters.maxAmount === 'number' && bill.amount > filters.maxAmount) {
        return false;
      }

      if (filters.month && dayjs(bill.billTime).format('YYYY-MM') !== filters.month) {
        return false;
      }

      if (merchantKeyword && !(bill.merchant ?? '').toLowerCase().includes(merchantKeyword)) {
        return false;
      }

      if (
        tagKeyword &&
        !(bill.tagNames ?? []).some(tag => tag.toLowerCase().includes(tagKeyword))
      ) {
        return false;
      }

      if (sourceFilter && sourceFilter !== 'ALL' && bill.source !== sourceFilter) {
        return false;
      }

      if (keyword) {
        const billTime = dayjs(bill.billTime).format('YYYY-MM-DD HH:mm');
        const searchableText = [
          bill.remark,
          bill.merchant,
          categoryNameMap.get(bill.categoryId),
          bill.accountType,
          bill.accountId ? accountNameMap.get(bill.accountId) : '',
          bill.transferTargetAccountId
            ? accountNameMap.get(bill.transferTargetAccountId)
            : '',
          bill.isTransfer ? '转账|转入|转出' : '',
          bill.source,
          bill.amount.toFixed(2),
          billTime,
          bill.tagNames?.join('|'),
        ]
          .filter(Boolean)
          .join('|')
          .toLowerCase();
        if (!searchableText.includes(keyword)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => dayjs(right.billTime).valueOf() - dayjs(left.billTime).valueOf());
}

function resolveLedgerDirection(
  bill: BillRecord,
  accountId: number,
): AccountLedgerDirection {
  if (bill.isTransfer) {
    return bill.transferTargetAccountId === accountId
      ? 'TRANSFER_IN'
      : 'TRANSFER_OUT';
  }
  return bill.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
}

function isBillRelatedToAccount(bill: BillRecord, accountId: number): boolean {
  return bill.accountId === accountId || bill.transferTargetAccountId === accountId;
}

function resolveBillTypeForView(
  bill: BillRecord,
  accountPerspectiveAccountId?: number | null,
): BillType {
  if (!accountPerspectiveAccountId || !bill.isTransfer) {
    return bill.type;
  }
  if (!isBillRelatedToAccount(bill, accountPerspectiveAccountId)) {
    return bill.type;
  }
  return bill.transferTargetAccountId === accountPerspectiveAccountId
    ? 'INCOME'
    : 'EXPENSE';
}

export function listAccountLedger(
  data: PersistedAppData,
  currentUserId: number | null,
  accountId: number,
): AccountLedgerEntry[] {
  const userId = ensureCurrentUserId(currentUserId);
  const targetAccount = data.accounts.find(
    account => account.id === accountId && account.userId === userId,
  );
  if (!targetAccount) {
    throw new Error('账户不存在');
  }

  return data.bills
    .filter(bill => bill.userId === userId && !bill.deleted)
    .filter(
      bill =>
        bill.accountId === accountId || bill.transferTargetAccountId === accountId,
    )
    .map(bill => {
      const direction = resolveLedgerDirection(bill, accountId);
      const signedAmount =
        direction === 'INCOME' || direction === 'TRANSFER_IN'
          ? bill.amount
          : -bill.amount;
      return {
        bill,
        direction,
        signedAmount,
      };
    })
    .sort(
      (left, right) =>
        dayjs(right.bill.billTime).valueOf() - dayjs(left.bill.billTime).valueOf(),
    );
}

export function listBillSections(
  data: PersistedAppData,
  currentUserId: number | null,
  filters?: BillFilters,
): BillListSection[] {
  const bills = listBills(data, currentUserId, filters);
  const accountPerspectiveAccountId = filters?.accountPerspectiveAccountId;
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const sectionMap = new Map<string, BillListSection>();

  bills.forEach(bill => {
    const effectiveType = resolveBillTypeForView(
      bill,
      accountPerspectiveAccountId,
    );
    const date = dayjs(bill.billTime).format('YYYY-MM-DD');
    const title = date === today ? '今天' : date === yesterday ? '昨天' : date;
    const section = sectionMap.get(date);
    if (section) {
      section.data.push(bill);
      if (effectiveType === 'INCOME') {
        section.dayIncome += bill.amount;
      } else {
        section.dayExpense += bill.amount;
      }
      return;
    }

    sectionMap.set(date, {
      title,
      date,
      data: [bill],
      dayExpense: effectiveType === 'EXPENSE' ? bill.amount : 0,
      dayIncome: effectiveType === 'INCOME' ? bill.amount : 0,
    });
  });

  return Array.from(sectionMap.values()).sort(
    (left, right) => dayjs(right.date).valueOf() - dayjs(left.date).valueOf(),
  );
}

export function saveBill(
  data: PersistedAppData,
  currentUserId: number | null,
  payload: BillInput,
  billId?: number,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const normalizedData = ensureUserAccountDomainData(data, userId);
  const now = nowString();

  if (payload.amount <= 0) {
    throw new Error('金额必须大于 0');
  }

  const userAccounts = normalizedData.accounts.filter(account => account.userId === userId);
  const matchedAccount =
    (payload.accountId !== null && payload.accountId !== undefined
      ? userAccounts.find(account => account.id === payload.accountId)
      : undefined) ??
    resolveAccountByType(userAccounts, payload.accountType);
  if (!matchedAccount || matchedAccount.isArchived) {
    throw new Error('请选择可用账户');
  }
  const matchedTransferTarget =
    payload.transferTargetAccountId !== null && payload.transferTargetAccountId !== undefined
      ? userAccounts.find(account => account.id === payload.transferTargetAccountId)
      : undefined;
  if (payload.isTransfer) {
    if (!matchedTransferTarget || matchedTransferTarget.isArchived) {
      throw new Error('请选择可用的转入账户');
    }
    if (matchedTransferTarget.id === matchedAccount.id) {
      throw new Error('转出与转入账户不能相同');
    }
  }
  const normalizedPayload: BillInput = {
    ...payload,
    type: payload.isTransfer ? 'EXPENSE' : payload.type,
    accountId: matchedAccount.id,
    accountType: matchedAccount.type,
    isTransfer: Boolean(payload.isTransfer),
    transferTargetAccountId: payload.isTransfer ? matchedTransferTarget?.id ?? null : null,
  };

  if (billId) {
    return recalculateUserAccountBalances(
      {
        ...normalizedData,
        bills: normalizedData.bills.map(bill =>
          bill.id === billId && bill.userId === userId
            ? {...bill, ...normalizedPayload, updatedAt: now}
            : bill,
        ),
      },
      userId,
    );
  }

  const bill: BillRecord = {
    id: nextId(normalizedData.bills),
    userId,
    ...normalizedPayload,
    deleted: false,
    createdAt: now,
    updatedAt: now,
  };

  return recalculateUserAccountBalances(
    {
      ...normalizedData,
      bills: [bill, ...normalizedData.bills],
    },
    userId,
  );
}

export function deleteBill(
  data: PersistedAppData,
  currentUserId: number | null,
  billId: number,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const normalizedData = ensureUserAccountDomainData(data, userId);
  const now = nowString();

  return recalculateUserAccountBalances(
    {
      ...normalizedData,
      bills: normalizedData.bills.map(bill =>
        bill.id === billId && bill.userId === userId ? {...bill, deleted: true, updatedAt: now} : bill,
      ),
    },
    userId,
  );
}

export function getBudgetSummary(
  data: PersistedAppData,
  currentUserId: number | null,
  month: string,
): BudgetSummary {
  const userId = ensureCurrentUserId(currentUserId);
  const budget = data.budgets.find(item => item.userId === userId && item.month === month);
  const spentAmount = listBills(data, userId, {type: 'EXPENSE', includeTransfers: false})
    .filter(bill => dayjs(bill.billTime).format('YYYY-MM') === month)
    .reduce((sum, bill) => sum + bill.amount, 0);

  const budgetAmount = budget?.amount ?? 0;
  const remainingAmount = budgetAmount - spentAmount;
  const usageRate = budgetAmount > 0 ? Math.min(spentAmount / budgetAmount, 1) : 0;

  return {
    month,
    budgetAmount,
    spentAmount,
    remainingAmount,
    usageRate,
  };
}

export function upsertBudget(
  data: PersistedAppData,
  currentUserId: number | null,
  month: string,
  amount: number,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const now = nowString();
  const current = data.budgets.find(item => item.userId === userId && item.month === month);

  if (current) {
    return {
      ...data,
      budgets: data.budgets.map(item =>
        item.id === current.id ? {...item, amount, updatedAt: now} : item,
      ),
    };
  }

  const budget: BudgetSetting = {
    id: nextId(data.budgets),
    userId,
    month,
    amount,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...data,
    budgets: [...data.budgets, budget],
  };
}

export function listBudgetHistory(
  data: PersistedAppData,
  currentUserId: number | null,
  limit = 12,
): BudgetSummary[] {
  const userId = ensureCurrentUserId(currentUserId);
  const monthSet = new Set<string>();
  const currentMonth = dayjs().format('YYYY-MM');
  monthSet.add(currentMonth);
  monthSet.add(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM'));

  data.budgets.forEach(budget => {
    if (budget.userId === userId) {
      monthSet.add(budget.month);
    }
  });

  data.bills.forEach(bill => {
    if (bill.userId === userId && !bill.deleted && bill.type === 'EXPENSE') {
      monthSet.add(dayjs(bill.billTime).format('YYYY-MM'));
    }
  });

  const sortedMonths = Array.from(monthSet).sort((left, right) =>
    dayjs(right).valueOf() - dayjs(left).valueOf(),
  );

  return sortedMonths.slice(0, limit).map(month => getBudgetSummary(data, userId, month));
}

export function copyLastMonthBudget(
  data: PersistedAppData,
  currentUserId: number | null,
  month: string,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const previousMonth = dayjs(month).subtract(1, 'month').format('YYYY-MM');
  const previousBudget = data.budgets.find(
    item => item.userId === userId && item.month === previousMonth,
  );

  if (!previousBudget || previousBudget.amount <= 0) {
    throw new Error('上月没有可沿用的预算');
  }

  return upsertBudget(data, userId, month, previousBudget.amount);
}

export function getOverviewStats(
  data: PersistedAppData,
  currentUserId: number | null,
): OverviewStats {
  const userId = ensureCurrentUserId(currentUserId);
  const bills = listBills(data, userId, {includeTransfers: false});
  const today = dayjs().format('YYYY-MM-DD');
  const currentMonth = dayjs().format('YYYY-MM');

  const todayIncome = bills
    .filter(bill => bill.type === 'INCOME' && dayjs(bill.billTime).format('YYYY-MM-DD') === today)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const todayExpense = bills
    .filter(bill => bill.type === 'EXPENSE' && dayjs(bill.billTime).format('YYYY-MM-DD') === today)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const monthIncome = bills
    .filter(bill => bill.type === 'INCOME' && dayjs(bill.billTime).format('YYYY-MM') === currentMonth)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const monthExpense = bills
    .filter(bill => bill.type === 'EXPENSE' && dayjs(bill.billTime).format('YYYY-MM') === currentMonth)
    .reduce((sum, bill) => sum + bill.amount, 0);

  return {
    todayIncome,
    todayExpense,
    monthIncome,
    monthExpense,
    monthBalance: monthIncome - monthExpense,
  };
}

export function getCategoryStats(
  data: PersistedAppData,
  currentUserId: number | null,
  month: string,
  type: BillType,
): CategoryStat[] {
  const monthStart = dayjs(month).startOf('month').format('YYYY-MM-DD');
  const monthEnd = dayjs(month).endOf('month').format('YYYY-MM-DD');
  return getCategoryStatsByRange(
    data,
    currentUserId,
    monthStart,
    monthEnd,
    type,
    {includeTransfers: false},
  );
}

function buildRangeListFilters(
  startDate: string,
  endDate: string,
  filters?: Omit<BillFilters, 'startDate' | 'endDate' | 'month'>,
): BillFilters {
  return {
    ...filters,
    startDate,
    endDate,
  };
}

export interface RangeIncomeExpenseTotals {
  incomeTotal: number;
  expenseTotal: number;
}

export function getBillsByRange(
  data: PersistedAppData,
  currentUserId: number | null,
  startDate: string,
  endDate: string,
  filters?: Omit<BillFilters, 'startDate' | 'endDate' | 'month'>,
): BillRecord[] {
  const userId = ensureCurrentUserId(currentUserId);
  const normalizedRange = normalizeDateRange(startDate, endDate);

  return listBills(
    data,
    userId,
    buildRangeListFilters(
      normalizedRange.startDate,
      normalizedRange.endDate,
      filters,
    ),
  );
}

export function getTrendDataByRange(
  data: PersistedAppData,
  currentUserId: number | null,
  startDate: string,
  endDate: string,
  type: BillType,
  filters?: Omit<BillFilters, 'type' | 'startDate' | 'endDate' | 'month'>,
): TrendPoint[] {
  const normalizedRange = normalizeDateRange(startDate, endDate);
  const scopedFilters = {
    includeTransfers: false,
    ...filters,
  };
  const bills = getBillsByRange(
    data,
    currentUserId,
    normalizedRange.startDate,
    normalizedRange.endDate,
    scopedFilters,
  );

  return buildStatsTrendPointsByRange(
    bills,
    normalizedRange.startDate,
    normalizedRange.endDate,
    type,
  );
}

export function getCategoryStatsByRange(
  data: PersistedAppData,
  currentUserId: number | null,
  startDate: string,
  endDate: string,
  type: BillType,
  filters?: Omit<BillFilters, 'type' | 'startDate' | 'endDate' | 'month'>,
): CategoryStat[] {
  const scopedFilters = {
    includeTransfers: false,
    ...filters,
  };
  const bills = getBillsByRange(data, currentUserId, startDate, endDate, {
    ...scopedFilters,
    type,
  });
  const total = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const categoryMap = new Map<number, number>();

  bills.forEach(bill => {
    categoryMap.set(bill.categoryId, (categoryMap.get(bill.categoryId) ?? 0) + bill.amount);
  });

  return Array.from(categoryMap.entries())
    .map(([categoryId, amount]) => {
      const category = data.categories.find(item => item.id === categoryId);

      return {
        categoryId,
        categoryName: category?.name ?? '未分类',
        color: category?.color ?? '#6C757D',
        amount,
        percentage: total > 0 ? amount / total : 0,
      };
    })
    .sort((left, right) => right.amount - left.amount);
}

export function getPreviousPeriodTotalByRange(
  data: PersistedAppData,
  currentUserId: number | null,
  startDate: string,
  endDate: string,
  type: BillType,
  filters?: Omit<BillFilters, 'type' | 'startDate' | 'endDate' | 'month'>,
): number {
  const normalizedRange = normalizeDateRange(startDate, endDate);
  const scopedFilters = {
    includeTransfers: false,
    ...filters,
  };
  const currentStart = dayjs(normalizedRange.startDate).startOf('day');
  const previousEnd = currentStart.subtract(1, 'day').format('YYYY-MM-DD');
  const previousStart = dayjs(previousEnd)
    .subtract(normalizedRange.days - 1, 'day')
    .format('YYYY-MM-DD');
  const previousBills = getBillsByRange(
    data,
    currentUserId,
    previousStart,
    previousEnd,
    {
      ...scopedFilters,
      type,
    },
  );

  return previousBills.reduce((sum, bill) => sum + bill.amount, 0);
}

export function getIncomeExpenseTotalsByRange(
  data: PersistedAppData,
  currentUserId: number | null,
  startDate: string,
  endDate: string,
  filters?: Omit<BillFilters, 'type' | 'startDate' | 'endDate' | 'month'>,
): RangeIncomeExpenseTotals {
  const bills = getBillsByRange(data, currentUserId, startDate, endDate, {
    includeTransfers: false,
    ...filters,
  });
  const incomeTotal = bills
    .filter(bill => bill.type === 'INCOME')
    .reduce((sum, bill) => sum + bill.amount, 0);
  const expenseTotal = bills
    .filter(bill => bill.type === 'EXPENSE')
    .reduce((sum, bill) => sum + bill.amount, 0);

  return {
    incomeTotal,
    expenseTotal,
  };
}

export function getTrendData(
  data: PersistedAppData,
  currentUserId: number | null,
  rangeDays: number,
  type: BillType,
): TrendPoint[] {
  const safeRangeDays = Math.max(1, Math.floor(rangeDays));
  const end = dayjs().format('YYYY-MM-DD');
  const start = dayjs()
    .startOf('day')
    .subtract(safeRangeDays - 1, 'day')
    .format('YYYY-MM-DD');
  return getTrendDataByRange(data, currentUserId, start, end, type, {
    includeTransfers: false,
  });
}

export interface AppDataExportPayload {
  schemaVersion: number;
  exportedAt: string;
  userId: number;
  accounts: Account[];
  categories: Category[];
  bills: BillRecord[];
  budgets: BudgetSetting[];
}

const SUPPORTED_BACKUP_SCHEMA_VERSIONS = new Set([3, 4]);
const VALID_BILL_TYPES = new Set<BillType>(['INCOME', 'EXPENSE']);
const VALID_ACCOUNT_TYPES = new Set<AccountType>([
  'CASH',
  'BANK_CARD',
  'ALIPAY',
  'WECHAT',
  'OTHER',
]);
const VALID_BILL_SOURCES = new Set<NonNullable<BillRecord['source']>>([
  'MANUAL',
  'IMPORT',
  'RECURRING',
]);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidMonthText(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function assertBackupPayload(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function validateBackupAccounts(accounts: Account[]): void {
  accounts.forEach((account, index) => {
    assertBackupPayload(
      isFiniteNumber(account.id) && account.id > 0,
      `备份账户第 ${index + 1} 项 id 不合法`,
    );
    assertBackupPayload(
      isFiniteNumber(account.userId) && account.userId > 0,
      `备份账户第 ${index + 1} 项 userId 不合法`,
    );
    assertBackupPayload(
      typeof account.name === 'string' && account.name.trim().length > 0,
      `备份账户第 ${index + 1} 项名称为空`,
    );
    assertBackupPayload(
      VALID_ACCOUNT_TYPES.has(account.type),
      `备份账户第 ${index + 1} 项账户类型不支持`,
    );
    assertBackupPayload(
      isFiniteNumber(account.openingBalance) && isFiniteNumber(account.currentBalance),
      `备份账户第 ${index + 1} 项金额不合法`,
    );
  });
}

function validateBackupCategories(categories: Category[]): void {
  categories.forEach((category, index) => {
    assertBackupPayload(
      isFiniteNumber(category.id) && category.id > 0,
      `备份分类第 ${index + 1} 项 id 不合法`,
    );
    assertBackupPayload(
      category.userId === null || (isFiniteNumber(category.userId) && category.userId > 0),
      `备份分类第 ${index + 1} 项 userId 不合法`,
    );
    assertBackupPayload(
      VALID_BILL_TYPES.has(category.type),
      `备份分类第 ${index + 1} 项类型不支持`,
    );
    assertBackupPayload(
      typeof category.name === 'string' && category.name.trim().length > 0,
      `备份分类第 ${index + 1} 项名称为空`,
    );
  });
}

function validateBackupBills(
  bills: BillRecord[],
  accounts: Account[],
  categories: Category[],
): void {
  const accountIdSet = new Set(accounts.map(item => item.id));
  const categoryIdSet = new Set(categories.map(item => item.id));

  bills.forEach((bill, index) => {
    const itemLabel = `备份账单第 ${index + 1} 项`;
    assertBackupPayload(isFiniteNumber(bill.id) && bill.id > 0, `${itemLabel} id 不合法`);
    assertBackupPayload(
      isFiniteNumber(bill.userId) && bill.userId > 0,
      `${itemLabel} userId 不合法`,
    );
    assertBackupPayload(VALID_BILL_TYPES.has(bill.type), `${itemLabel} 类型不支持`);
    assertBackupPayload(
      isFiniteNumber(bill.amount) && bill.amount > 0,
      `${itemLabel} 金额必须大于 0`,
    );
    assertBackupPayload(
      isFiniteNumber(bill.categoryId) && categoryIdSet.has(bill.categoryId),
      `${itemLabel} 分类引用无效`,
    );
    assertBackupPayload(
      VALID_ACCOUNT_TYPES.has(bill.accountType),
      `${itemLabel} 账户类型不支持`,
    );
    assertBackupPayload(
      typeof bill.billTime === 'string' && dayjs(bill.billTime).isValid(),
      `${itemLabel} 时间格式不合法`,
    );
    assertBackupPayload(typeof bill.remark === 'string', `${itemLabel} 备注字段不合法`);
    assertBackupPayload(typeof bill.deleted === 'boolean', `${itemLabel} deleted 字段不合法`);
    assertBackupPayload(
      bill.accountId === null ||
        bill.accountId === undefined ||
        (isFiniteNumber(bill.accountId) && accountIdSet.has(bill.accountId)),
      `${itemLabel} 账户引用无效`,
    );
    assertBackupPayload(
      bill.source === undefined || VALID_BILL_SOURCES.has(bill.source),
      `${itemLabel} 来源字段不合法`,
    );
    if (bill.isTransfer) {
      assertBackupPayload(
        bill.transferTargetAccountId !== null &&
          bill.transferTargetAccountId !== undefined &&
          isFiniteNumber(bill.transferTargetAccountId) &&
          accountIdSet.has(bill.transferTargetAccountId),
        `${itemLabel} 转入账户引用无效`,
      );
      if (
        bill.accountId !== null &&
        bill.accountId !== undefined &&
        bill.transferTargetAccountId !== null &&
        bill.transferTargetAccountId !== undefined
      ) {
        assertBackupPayload(
          bill.accountId !== bill.transferTargetAccountId,
          `${itemLabel} 转出与转入账户不能相同`,
        );
      }
    } else {
      assertBackupPayload(
        bill.transferTargetAccountId === null || bill.transferTargetAccountId === undefined,
        `${itemLabel} 非转账账单不能包含转入账户`,
      );
    }
    assertBackupPayload(
      bill.tagNames === undefined ||
        (Array.isArray(bill.tagNames) &&
          bill.tagNames.every(tag => typeof tag === 'string')),
      `${itemLabel} 标签字段不合法`,
    );
  });
}

function validateBackupBudgets(budgets: BudgetSetting[]): void {
  budgets.forEach((budget, index) => {
    assertBackupPayload(
      isFiniteNumber(budget.id) && budget.id > 0,
      `备份预算第 ${index + 1} 项 id 不合法`,
    );
    assertBackupPayload(
      isFiniteNumber(budget.userId) && budget.userId > 0,
      `备份预算第 ${index + 1} 项 userId 不合法`,
    );
    assertBackupPayload(
      typeof budget.month === 'string' && isValidMonthText(budget.month),
      `备份预算第 ${index + 1} 项 month 不合法`,
    );
    assertBackupPayload(
      isFiniteNumber(budget.amount) && budget.amount >= 0,
      `备份预算第 ${index + 1} 项金额不合法`,
    );
  });
}

export function exportAppData(
  data: PersistedAppData,
  currentUserId: number | null,
): AppDataExportPayload {
  const userId = ensureCurrentUserId(currentUserId);
  const accounts = data.accounts.filter(account => account.userId === userId);
  const categories = data.categories.filter(
    category => category.userId === null || category.userId === userId,
  );
  const bills = data.bills.filter(bill => bill.userId === userId);
  const budgets = data.budgets.filter(budget => budget.userId === userId);

  return {
    schemaVersion: data.schemaVersion,
    exportedAt: nowString(),
    userId,
    accounts,
    categories,
    bills,
    budgets,
  };
}

export function importAppData(
  data: PersistedAppData,
  currentUserId: number | null,
  payload: AppDataExportPayload,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  if (!payload || typeof payload !== 'object') {
    throw new Error('导入数据格式不正确');
  }
  if (!SUPPORTED_BACKUP_SCHEMA_VERSIONS.has(payload.schemaVersion)) {
    throw new Error(`备份版本 ${String(payload.schemaVersion)} 暂不支持，请先升级应用`);
  }
  if (!Array.isArray(payload.accounts)) {
    throw new Error('备份文件缺少 accounts 数组');
  }
  if (!Array.isArray(payload.categories)) {
    throw new Error('备份文件缺少 categories 数组');
  }
  if (!Array.isArray(payload.bills)) {
    throw new Error('备份文件缺少 bills 数组');
  }
  if (!Array.isArray(payload.budgets)) {
    throw new Error('备份文件缺少 budgets 数组');
  }

  const importedAccounts = payload.accounts;
  const importedCategories = payload.categories;
  const importedBills = payload.bills;
  const importedBudgets = payload.budgets;

  validateBackupAccounts(importedAccounts);
  validateBackupCategories(importedCategories);
  validateBackupBills(importedBills, importedAccounts, importedCategories);
  validateBackupBudgets(importedBudgets);

  const now = nowString();

  const accountsWithoutUser = data.accounts.filter(account => account.userId !== userId);
  const categoriesWithoutUser = data.categories.filter(category => category.userId !== userId);
  const billsWithoutUser = data.bills.filter(bill => bill.userId !== userId);
  const budgetsWithoutUser = data.budgets.filter(budget => budget.userId !== userId);
  const importedCategoryById = new Map(importedCategories.map(category => [category.id, category]));

  let nextAccountId = nextId(data.accounts);
  const accountIdMapping = new Map<number, number>();
  const normalizedUserAccounts: Account[] = importedAccounts
    .map((account, index) => {
      const normalized: Account = {
        ...account,
        id: nextAccountId,
        userId,
        name: (account.name ?? '').trim() || `账户${index + 1}`,
        openingBalance: roundCurrency(account.openingBalance ?? 0),
        currentBalance: roundCurrency(account.currentBalance ?? account.openingBalance ?? 0),
        includeInTotal: account.includeInTotal !== false,
        isArchived: Boolean(account.isArchived),
        sortNum: Number.isFinite(account.sortNum) ? account.sortNum : index + 1,
        createdAt: account.createdAt ?? now,
        updatedAt: now,
      };
      accountIdMapping.set(account.id, nextAccountId);
      nextAccountId += 1;
      return normalized;
    });

  let nextCategoryId = nextId(data.categories);
  const categoryIdMapping = new Map<number, number>();
  const normalizedUserCategories: Category[] = importedCategories
    .filter(category => category.userId !== null)
    .map(category => {
      const normalized: Category = {
        ...category,
        id: nextCategoryId,
        userId,
        name: category.name.trim(),
        updatedAt: now,
      };
      categoryIdMapping.set(category.id, nextCategoryId);
      nextCategoryId += 1;
      return normalized;
    });

  let nextBillId = nextId(data.bills);
  const normalizedUserBills: BillRecord[] = importedBills.map(bill => {
    const mappedCategoryId = categoryIdMapping.get(bill.categoryId);
    const importedCategory = importedCategoryById.get(bill.categoryId);
    const mappedDefaultCategoryId =
      importedCategory?.userId === null
        ? categoriesWithoutUser.find(
            category =>
              category.userId === null &&
              category.type === importedCategory.type &&
              category.name === importedCategory.name,
          )?.id
        : undefined;
    const mappedAccountId =
      bill.accountId !== undefined && bill.accountId !== null
        ? accountIdMapping.get(bill.accountId)
        : undefined;
    const mappedTransferTargetAccountId =
      bill.transferTargetAccountId !== undefined &&
      bill.transferTargetAccountId !== null
        ? accountIdMapping.get(bill.transferTargetAccountId)
        : undefined;
    const fallbackAccount =
      normalizedUserAccounts.find(
        account => account.type === bill.accountType && !account.isArchived,
      ) ??
      normalizedUserAccounts.find(account => !account.isArchived) ??
      normalizedUserAccounts[0];
    const fallbackCategoryId =
      normalizedUserCategories.find(category => category.type === bill.type)?.id ??
      categoriesWithoutUser.find(category => category.type === bill.type)?.id ??
      1;

    const normalized: BillRecord = {
      ...bill,
      id: nextBillId,
      userId,
      categoryId: mappedCategoryId ?? mappedDefaultCategoryId ?? fallbackCategoryId,
      accountId: mappedAccountId ?? fallbackAccount?.id ?? null,
      accountType: bill.accountType ?? fallbackAccount?.type ?? 'OTHER',
      transferTargetAccountId: mappedTransferTargetAccountId ?? null,
      remark: bill.remark ?? '',
      source: bill.source ?? 'IMPORT',
      updatedAt: now,
    };
    nextBillId += 1;
    return normalized;
  });

  let nextBudgetId = nextId(data.budgets);
  const normalizedUserBudgets: BudgetSetting[] = importedBudgets.map(budget => {
    const normalized: BudgetSetting = {
      ...budget,
      id: nextBudgetId,
      userId,
      updatedAt: now,
    };
    nextBudgetId += 1;
    return normalized;
  });

  return ensureUserAccountDomainData(
    {
      ...data,
      accounts: [...accountsWithoutUser, ...normalizedUserAccounts],
      categories: [...categoriesWithoutUser, ...normalizedUserCategories],
      bills: [...billsWithoutUser, ...normalizedUserBills],
      budgets: [...budgetsWithoutUser, ...normalizedUserBudgets],
    },
    userId,
  );
}
