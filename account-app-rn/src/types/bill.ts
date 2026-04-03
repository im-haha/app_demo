export type BillType = 'INCOME' | 'EXPENSE';

export type AccountType =
  | 'CASH'
  | 'BANK_CARD'
  | 'ALIPAY'
  | 'WECHAT'
  | 'OTHER';

export interface Category {
  id: number;
  userId: number | null;
  type: BillType;
  name: string;
  icon: string;
  color: string;
  sortNum: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillRecord {
  id: number;
  userId: number;
  type: BillType;
  amount: number;
  categoryId: number;
  accountType: AccountType;
  billTime: string;
  remark: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillInput {
  type: BillType;
  amount: number;
  categoryId: number;
  accountType: AccountType;
  billTime: string;
  remark: string;
}

export interface BillFilters {
  type?: BillType | 'ALL';
  categoryId?: number | null;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface BudgetSetting {
  id: number;
  userId: number;
  month: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  month: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  usageRate: number;
}

export interface OverviewStats {
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  monthBalance: number;
}

export interface CategoryStat {
  categoryId: number;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface TrendPoint {
  axisLabel: string;
  amount: number;
  date: string;
}
