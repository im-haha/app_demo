import dayjs from 'dayjs';
import {BillRecord, BillType, TrendPoint} from '@/types/bill';

export function buildStatsTrendPoints(
  bills: BillRecord[],
  rangeDays: number,
  type: BillType,
): TrendPoint[] {
  const safeRangeDays = Math.max(1, Math.floor(rangeDays));
  const end = dayjs();
  const start = dayjs().startOf('day').subtract(safeRangeDays - 1, 'day');

  return buildStatsTrendPointsByRange(
    bills,
    start.format('YYYY-MM-DD'),
    end.format('YYYY-MM-DD'),
    type,
  );
}

export function buildStatsTrendPointsByRange(
  bills: BillRecord[],
  startDate: string,
  endDate: string,
  type: BillType,
): TrendPoint[] {
  const rawStart = dayjs(startDate).startOf('day');
  const rawEnd = dayjs(endDate).endOf('day');
  const start = rawStart.isAfter(rawEnd) ? rawEnd.startOf('day') : rawStart;
  const end = rawStart.isAfter(rawEnd) ? rawStart.endOf('day') : rawEnd;
  const rangeDays = Math.max(
    1,
    end.startOf('day').diff(start.startOf('day'), 'day') + 1,
  );
  const startThreshold = start.subtract(1, 'millisecond');
  const endThreshold = end.add(1, 'millisecond');
  const rangedBills = bills.filter(
    bill =>
      bill.type === type &&
      dayjs(bill.billTime).isAfter(startThreshold) &&
      dayjs(bill.billTime).isBefore(endThreshold),
  );

  return Array.from({length: rangeDays}).map((_, index) => {
    const date = start.add(index, 'day');
    const dateKey = date.format('YYYY-MM-DD');
    const amount = rangedBills
      .filter(bill => dayjs(bill.billTime).format('YYYY-MM-DD') === dateKey)
      .reduce((sum, bill) => sum + bill.amount, 0);

    return {
      axisLabel: date.format('MM/DD'),
      amount,
      date: dateKey,
    };
  });
}
