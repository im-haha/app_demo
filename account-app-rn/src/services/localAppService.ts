import dayjs from 'dayjs';
import {
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

export interface PersistedAppData {
  schemaVersion: number;
  users: UserProfile[];
  currentUserId: number | null;
  token: string | null;
  categories: Category[];
  bills: BillRecord[];
  budgets: BudgetSetting[];
}

export function createInitialAppData(): PersistedAppData {
  return {
    schemaVersion: 2,
    users: [],
    currentUserId: null,
    token: null,
    categories: defaultCategories,
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
  const now = nowString();
  let billId = nextId(data.bills);
  const demoBills: BillRecord[] = [];

  for (let index = 0; index < 7; index += 1) {
    const day = dayjs().subtract(6 - index, 'day');
    const expenseAmount = expenseAmounts[index];
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
      accountType: accountTypes[index % accountTypes.length],
      billTime: day.hour(12).minute(18).second(0).format('YYYY-MM-DD HH:mm:ss'),
      remark: expenseRemarks[index],
      deleted: false,
      createdAt: now,
      updatedAt: now,
    });
    billId += 1;

    if (incomeAmounts[index] > 0) {
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
        accountType: accountTypes[(index + 1) % accountTypes.length],
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
  demoBills.push({
    id: billId,
    userId,
    type: 'INCOME',
    amount: 6800,
    categoryId: findCategoryId(data, userId, 'INCOME', '工资'),
    accountType: 'BANK_CARD',
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
  if (!currentUserId || !options?.enableDemoData) {
    return data;
  }

  const hasAnyBill = data.bills.some(bill => bill.userId === currentUserId && !bill.deleted);
  if (hasAnyBill) {
    return data;
  }

  const now = nowString();
  const month = dayjs().format('YYYY-MM');
  const demoBills = buildDemoBills(data, currentUserId);
  const hasBudget = data.budgets.some(
    budget => budget.userId === currentUserId && budget.month === month,
  );
  const nextBudgets = hasBudget
    ? data.budgets
    : [
        ...data.budgets,
        {
          id: nextId(data.budgets),
          userId: currentUserId,
          month,
          amount: 4200,
          createdAt: now,
          updatedAt: now,
        },
      ];

  return {
    ...data,
    bills: [...demoBills, ...data.bills],
    budgets: nextBudgets,
  };
}

export function registerUser(data: PersistedAppData, payload: RegisterPayload): PersistedAppData {
  const duplicated = data.users.find(user => user.username === payload.username.trim());
  if (duplicated) {
    throw new Error('用户名已存在');
  }

  const now = nowString();
  const user: UserProfile = {
    id: nextId(data.users),
    username: payload.username.trim(),
    password: payload.password,
    nickname: payload.nickname.trim(),
    status: 1,
    createdAt: now,
    updatedAt: now,
  };

  return ensureUserDemoData(
    {
      ...data,
      users: [...data.users, user],
      currentUserId: user.id,
      token: `local-token-${user.id}-${Date.now()}`,
    },
    user.id,
  );
}

export function loginUser(data: PersistedAppData, username: string, password: string): PersistedAppData {
  const user = data.users.find(
    item => item.username === username.trim() && item.password === password,
  );

  if (!user) {
    throw new Error('用户名或密码错误');
  }

  return ensureUserDemoData(
    {
      ...data,
      currentUserId: user.id,
      token: `local-token-${user.id}-${Date.now()}`,
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

export function listBills(
  data: PersistedAppData,
  currentUserId: number | null,
  filters?: BillFilters,
): BillRecord[] {
  const userId = ensureCurrentUserId(currentUserId);
  const keyword = filters?.keyword?.trim().toLowerCase();
  const merchantKeyword = filters?.merchantKeyword?.trim().toLowerCase();
  const categoryNameMap = new Map<number, string>(
    data.categories.map(category => [category.id, category.name]),
  );

  return data.bills
    .filter(bill => bill.userId === userId && !bill.deleted)
    .filter(bill => {
      if (!filters) {
        return true;
      }

      if (filters.type && filters.type !== 'ALL' && bill.type !== filters.type) {
        return false;
      }

      if (filters.categoryId !== undefined && filters.categoryId !== null && bill.categoryId !== filters.categoryId) {
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

      if (keyword) {
        const billTime = dayjs(bill.billTime).format('YYYY-MM-DD HH:mm');
        const searchableText = [
          bill.remark,
          bill.merchant,
          categoryNameMap.get(bill.categoryId),
          bill.accountType,
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

export function listBillSections(
  data: PersistedAppData,
  currentUserId: number | null,
  filters?: BillFilters,
): BillListSection[] {
  const bills = listBills(data, currentUserId, filters);
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const sectionMap = new Map<string, BillListSection>();

  bills.forEach(bill => {
    const date = dayjs(bill.billTime).format('YYYY-MM-DD');
    const title = date === today ? '今天' : date === yesterday ? '昨天' : date;
    const section = sectionMap.get(date);
    if (section) {
      section.data.push(bill);
      if (bill.type === 'INCOME') {
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
      dayExpense: bill.type === 'EXPENSE' ? bill.amount : 0,
      dayIncome: bill.type === 'INCOME' ? bill.amount : 0,
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
  const now = nowString();

  if (payload.amount <= 0) {
    throw new Error('金额必须大于 0');
  }

  if (billId) {
    return {
      ...data,
      bills: data.bills.map(bill =>
        bill.id === billId && bill.userId === userId
          ? {...bill, ...payload, updatedAt: now}
          : bill,
      ),
    };
  }

  const bill: BillRecord = {
    id: nextId(data.bills),
    userId,
    ...payload,
    deleted: false,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...data,
    bills: [bill, ...data.bills],
  };
}

export function deleteBill(
  data: PersistedAppData,
  currentUserId: number | null,
  billId: number,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const now = nowString();

  return {
    ...data,
    bills: data.bills.map(bill =>
      bill.id === billId && bill.userId === userId ? {...bill, deleted: true, updatedAt: now} : bill,
    ),
  };
}

export function getBudgetSummary(
  data: PersistedAppData,
  currentUserId: number | null,
  month: string,
): BudgetSummary {
  const userId = ensureCurrentUserId(currentUserId);
  const budget = data.budgets.find(item => item.userId === userId && item.month === month);
  const spentAmount = listBills(data, userId, {type: 'EXPENSE'})
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
  const bills = listBills(data, userId);
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
  const userId = ensureCurrentUserId(currentUserId);
  const bills = listBills(data, userId, {type}).filter(
    bill => dayjs(bill.billTime).format('YYYY-MM') === month,
  );
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

export function getTrendData(
  data: PersistedAppData,
  currentUserId: number | null,
  rangeDays: number,
  type: BillType,
): TrendPoint[] {
  const userId = ensureCurrentUserId(currentUserId);
  const end = dayjs().endOf('day');
  const start = dayjs().startOf('day').subtract(rangeDays - 1, 'day');
  const bills = listBills(data, userId, {type}).filter(bill =>
    dayjs(bill.billTime).isAfter(start.subtract(1, 'millisecond')) &&
    dayjs(bill.billTime).isBefore(end.add(1, 'millisecond')),
  );

  return Array.from({length: rangeDays}).map((_, index) => {
    const date = start.add(index, 'day');
    const amount = bills
      .filter(bill => dayjs(bill.billTime).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'))
      .reduce((sum, bill) => sum + bill.amount, 0);

    return {
      axisLabel: date.format('MM/DD'),
      amount,
      date: date.format('YYYY-MM-DD'),
    };
  });
}

export interface AppDataExportPayload {
  schemaVersion: number;
  exportedAt: string;
  userId: number;
  categories: Category[];
  bills: BillRecord[];
  budgets: BudgetSetting[];
}

export function exportAppData(
  data: PersistedAppData,
  currentUserId: number | null,
): AppDataExportPayload {
  const userId = ensureCurrentUserId(currentUserId);
  const categories = data.categories.filter(
    category => category.userId === null || category.userId === userId,
  );
  const bills = data.bills.filter(bill => bill.userId === userId);
  const budgets = data.budgets.filter(budget => budget.userId === userId);

  return {
    schemaVersion: data.schemaVersion,
    exportedAt: nowString(),
    userId,
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

  const importedCategories = Array.isArray(payload.categories) ? payload.categories : [];
  const importedBills = Array.isArray(payload.bills) ? payload.bills : [];
  const importedBudgets = Array.isArray(payload.budgets) ? payload.budgets : [];
  const now = nowString();

  const categoriesWithoutUser = data.categories.filter(category => category.userId !== userId);
  const billsWithoutUser = data.bills.filter(bill => bill.userId !== userId);
  const budgetsWithoutUser = data.budgets.filter(budget => budget.userId !== userId);

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
    const fallbackCategoryId =
      normalizedUserCategories.find(category => category.type === bill.type)?.id ??
      categoriesWithoutUser.find(category => category.type === bill.type)?.id ??
      1;

    const normalized: BillRecord = {
      ...bill,
      id: nextBillId,
      userId,
      categoryId: mappedCategoryId ?? fallbackCategoryId,
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

  return {
    ...data,
    categories: [...categoriesWithoutUser, ...normalizedUserCategories],
    bills: [...billsWithoutUser, ...normalizedUserBills],
    budgets: [...budgetsWithoutUser, ...normalizedUserBudgets],
  };
}
