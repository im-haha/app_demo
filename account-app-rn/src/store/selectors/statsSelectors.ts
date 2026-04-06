import dayjs from 'dayjs';
import {useMemo} from 'react';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {getBudgetSummary, PersistedAppData} from '@/services/localAppService';
import {BudgetSummary, OverviewStats} from '@/types/bill';
import {useRealBills} from './billSelectors';

export function useMonthlyOverview(month: string): OverviewStats {
  const bills = useRealBills();

  return useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayIncome = bills
      .filter(
        bill =>
          bill.type === 'INCOME' &&
          dayjs(bill.billTime).format('YYYY-MM-DD') === today,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);
    const todayExpense = bills
      .filter(
        bill =>
          bill.type === 'EXPENSE' &&
          dayjs(bill.billTime).format('YYYY-MM-DD') === today,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);
    const monthIncome = bills
      .filter(
        bill =>
          bill.type === 'INCOME' &&
          dayjs(bill.billTime).format('YYYY-MM') === month,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);
    const monthExpense = bills
      .filter(
        bill =>
          bill.type === 'EXPENSE' &&
          dayjs(bill.billTime).format('YYYY-MM') === month,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);

    return {
      todayIncome,
      todayExpense,
      monthIncome,
      monthExpense,
      monthBalance: monthIncome - monthExpense,
    };
  }, [bills, month]);
}

export function useBudgetSummary(month: string): BudgetSummary {
  const schemaVersion = useAppStore(state => state.schemaVersion);
  const categories = useAppStore(state => state.categories);
  const accounts = useAppStore(state => state.accounts);
  const bills = useAppStore(state => state.bills);
  const budgets = useAppStore(state => state.budgets);
  const currentUserId = useAuthStore(state => state.currentUserId);

  return useMemo(() => {
    const data: PersistedAppData = {
      schemaVersion,
      categories,
      accounts,
      bills,
      budgets,
      users: [],
      authCredentials: [],
      currentUserId,
    };

    return getBudgetSummary(data, currentUserId, month);
  }, [month, schemaVersion, categories, accounts, bills, budgets, currentUserId]);
}
