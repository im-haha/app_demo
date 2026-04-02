import dayjs from 'dayjs';
import {
  AccountType,
  BillFilters,
  BillInput,
  BillRecord,
  BillType,
  BudgetSetting,
  BudgetSummary,
  Category,
  CategoryStat,
  OverviewStats,
  TrendPoint,
} from '../types/bill';
import {RegisterPayload, UserProfile} from '../types/user';
import {defaultCategories} from '../data/defaultCategories';

export interface PersistedAppData {
  users: UserProfile[];
  currentUserId: number | null;
  token: string | null;
  categories: Category[];
  bills: BillRecord[];
  budgets: BudgetSetting[];
}

export function createInitialAppData(): PersistedAppData {
  return {
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
): PersistedAppData {
  if (!currentUserId) {
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

export function createCategory(
  data: PersistedAppData,
  currentUserId: number | null,
  payload: Pick<Category, 'type' | 'name' | 'icon' | 'color'>,
): PersistedAppData {
  const userId = ensureCurrentUserId(currentUserId);
  const now = nowString();
  const sameTypeCount = data.categories.filter(
    item => item.userId === userId && item.type === payload.type,
  ).length;

  const category: Category = {
    id: nextId(data.categories),
    userId,
    type: payload.type,
    name: payload.name.trim(),
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
        name: payload.name ? payload.name.trim() : category.name,
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
    throw new Error('已有账单使用该分类，暂不能删除');
  }

  return {
    ...data,
    categories: data.categories.filter(
      category => !(category.id === categoryId && category.userId === userId),
    ),
  };
}

export function listBills(
  data: PersistedAppData,
  currentUserId: number | null,
  filters?: BillFilters,
): BillRecord[] {
  const userId = ensureCurrentUserId(currentUserId);

  return data.bills
    .filter(bill => bill.userId === userId && !bill.deleted)
    .filter(bill => {
      if (!filters) {
        return true;
      }

      if (filters.type && filters.type !== 'ALL' && bill.type !== filters.type) {
        return false;
      }

      if (filters.categoryId && bill.categoryId !== filters.categoryId) {
        return false;
      }

      if (filters.startDate && dayjs(bill.billTime).isBefore(dayjs(filters.startDate).startOf('day'))) {
        return false;
      }

      if (filters.endDate && dayjs(bill.billTime).isAfter(dayjs(filters.endDate).endOf('day'))) {
        return false;
      }

      if (filters.keyword && !bill.remark.toLowerCase().includes(filters.keyword.toLowerCase().trim())) {
        return false;
      }

      return true;
    })
    .sort((left, right) => dayjs(right.billTime).valueOf() - dayjs(left.billTime).valueOf());
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
  const start = dayjs().subtract(rangeDays - 1, 'day').startOf('day');
  const bills = listBills(data, userId, {type}).filter(bill =>
    dayjs(bill.billTime).isAfter(start.subtract(1, 'millisecond')),
  );

  return Array.from({length: rangeDays}).map((_, index) => {
    const date = start.add(index, 'day');
    const amount = bills
      .filter(bill => dayjs(bill.billTime).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'))
      .reduce((sum, bill) => sum + bill.amount, 0);

    return {
      label: date.format(rangeDays <= 7 ? 'MM/DD' : 'DD'),
      amount,
      date: date.format('YYYY-MM-DD'),
    };
  });
}
