import {useMemo} from 'react';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {BillFilters, BillListSection, BillRecord} from '@/types/bill';

function buildFiltersKey(filters?: BillFilters): string {
  if (!filters) {
    return 'all';
  }

  return JSON.stringify({
    type: filters.type ?? 'ALL',
    categoryId: filters.categoryId ?? null,
    accountId: filters.accountId ?? null,
    accountPerspectiveAccountId: filters.accountPerspectiveAccountId ?? null,
    startDate: filters.startDate ?? null,
    endDate: filters.endDate ?? null,
    keyword: filters.keyword ?? null,
    accountType: filters.accountType ?? 'ALL',
    includeTransfers: filters.includeTransfers ?? null,
    minAmount: filters.minAmount ?? null,
    maxAmount: filters.maxAmount ?? null,
    month: filters.month ?? null,
    merchantKeyword: filters.merchantKeyword ?? null,
    tagKeyword: filters.tagKeyword ?? null,
    source: filters.source ?? 'ALL',
  });
}

export function useRealBills(filters?: BillFilters): BillRecord[] {
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const getBills = useAppStore(state => state.getBills);
  const filtersKey = buildFiltersKey(filters);

  return useMemo(
    () => getBills(filters),
    [getBills, filters, filtersKey, bills, categories, currentUserId],
  );
}

export function useRecentBills(limit = 5): BillRecord[] {
  const bills = useRealBills();
  return useMemo(() => bills.slice(0, limit), [bills, limit]);
}

export function useBillSections(filters?: BillFilters): BillListSection[] {
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const getBillSections = useAppStore(state => state.getBillSections);
  const filtersKey = buildFiltersKey(filters);

  return useMemo(
    () => getBillSections(filters),
    [getBillSections, filters, filtersKey, bills, categories, currentUserId],
  );
}
