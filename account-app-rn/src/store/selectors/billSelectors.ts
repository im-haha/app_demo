import {useMemo} from 'react';
import {useAppStore} from '@/store/appStore';
import {BillFilters, BillListSection, BillRecord} from '@/types/bill';

function buildFiltersKey(filters?: BillFilters): string {
  if (!filters) {
    return 'all';
  }

  return JSON.stringify({
    type: filters.type ?? 'ALL',
    categoryId: filters.categoryId ?? null,
    startDate: filters.startDate ?? null,
    endDate: filters.endDate ?? null,
    keyword: filters.keyword ?? null,
    accountType: filters.accountType ?? 'ALL',
    minAmount: filters.minAmount ?? null,
    maxAmount: filters.maxAmount ?? null,
    month: filters.month ?? null,
    merchantKeyword: filters.merchantKeyword ?? null,
  });
}

export function useRealBills(filters?: BillFilters): BillRecord[] {
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const currentUserId = useAppStore(state => state.currentUserId);
  const getBills = useAppStore(state => state.getBills);
  const filtersKey = buildFiltersKey(filters);

  return useMemo(
    () => getBills(filters),
    [getBills, bills, categories, currentUserId, filters, filtersKey],
  );
}

export function useRecentBills(limit = 5): BillRecord[] {
  const bills = useRealBills();
  return useMemo(() => bills.slice(0, limit), [bills, limit]);
}

export function useBillSections(filters?: BillFilters): BillListSection[] {
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const currentUserId = useAppStore(state => state.currentUserId);
  const getBillSections = useAppStore(state => state.getBillSections);
  const filtersKey = buildFiltersKey(filters);

  return useMemo(
    () => getBillSections(filters),
    [getBillSections, bills, categories, currentUserId, filters, filtersKey],
  );
}
