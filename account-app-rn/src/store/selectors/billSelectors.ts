import {useMemo} from 'react';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {
  listBills,
  listBillSections,
  PersistedAppData,
} from '@/services/localAppService';
import {BillFilters, BillListSection, BillRecord} from '@/types/bill';

function buildServiceData(
  schemaVersion: number,
  categories: PersistedAppData['categories'],
  accounts: PersistedAppData['accounts'],
  bills: PersistedAppData['bills'],
  budgets: PersistedAppData['budgets'],
  currentUserId: number | null,
): PersistedAppData {
  return {
    schemaVersion,
    categories,
    accounts,
    bills,
    budgets,
    users: [],
    authCredentials: [],
    currentUserId,
  };
}

export function useRealBills(filters?: BillFilters): BillRecord[] {
  const schemaVersion = useAppStore(state => state.schemaVersion);
  const accounts = useAppStore(state => state.accounts);
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const budgets = useAppStore(state => state.budgets);
  const currentUserId = useAuthStore(state => state.currentUserId);

  return useMemo(() => {
    const data = buildServiceData(
      schemaVersion,
      categories,
      accounts,
      bills,
      budgets,
      currentUserId,
    );
    return listBills(data, currentUserId, filters);
  }, [schemaVersion, categories, accounts, bills, budgets, currentUserId, filters]);
}

export function useRecentBills(limit = 5): BillRecord[] {
  const bills = useRealBills();
  return useMemo(() => bills.slice(0, limit), [bills, limit]);
}

export function useBillSections(filters?: BillFilters): BillListSection[] {
  const schemaVersion = useAppStore(state => state.schemaVersion);
  const accounts = useAppStore(state => state.accounts);
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const budgets = useAppStore(state => state.budgets);
  const currentUserId = useAuthStore(state => state.currentUserId);

  return useMemo(() => {
    const data = buildServiceData(
      schemaVersion,
      categories,
      accounts,
      bills,
      budgets,
      currentUserId,
    );
    return listBillSections(data, currentUserId, filters);
  }, [schemaVersion, categories, accounts, bills, budgets, currentUserId, filters]);
}
