import dayjs from 'dayjs';
import {useMemo} from 'react';
import {useAppStore} from './appStore';
import {useAuthStore} from './authStore';

export const useRecentBills = () => {
  const bills = useAppStore(state => state.bills);
  const currentUserId = useAuthStore(state => state.currentUserId);

  return useMemo(
    () =>
      bills
        .filter(bill => bill.userId === currentUserId && !bill.deleted)
        .sort((left, right) => dayjs(right.billTime).valueOf() - dayjs(left.billTime).valueOf())
        .slice(0, 8),
    [bills, currentUserId],
  );
};
