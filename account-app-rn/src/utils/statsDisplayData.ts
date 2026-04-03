import dayjs from 'dayjs';
import {BillRecord, BillType, Category, TrendPoint} from '@/types/bill';

const MIN_TREND_AMOUNT = 1;
const DEFAULT_SYNTHETIC_BASE = {
  INCOME: 260,
  EXPENSE: 120,
} as const;

export interface StatsDisplayBillMapping {
  displayBill: BillRecord;
  sourceBillId: number | null;
}

function findNearestPositiveIndex(
  amounts: number[],
  from: number,
  direction: -1 | 1,
): number | null {
  let cursor = from + direction;
  while (cursor >= 0 && cursor < amounts.length) {
    if (amounts[cursor] > 0) {
      return cursor;
    }
    cursor += direction;
  }
  return null;
}

function normalizeTrendPoints(
  points: TrendPoint[],
  type: BillType,
): TrendPoint[] {
  if (points.length === 0) {
    return points;
  }

  const amounts = points.map(point => Math.max(0, point.amount));
  const targetTotal = amounts.reduce((sum, amount) => sum + amount, 0);
  const fallbackBase =
    targetTotal > 0
      ? targetTotal / points.length
      : DEFAULT_SYNTHETIC_BASE[type];

  const baseSeries = amounts.map((amount, index) => {
    if (amount > 0) {
      return amount;
    }

    const prevIndex = findNearestPositiveIndex(amounts, index, -1);
    const nextIndex = findNearestPositiveIndex(amounts, index, 1);

    if (prevIndex !== null && nextIndex !== null) {
      const prevAmount = amounts[prevIndex];
      const nextAmount = amounts[nextIndex];
      const span = nextIndex - prevIndex;
      const progress = span === 0 ? 0 : (index - prevIndex) / span;
      return prevAmount + (nextAmount - prevAmount) * progress;
    }
    if (prevIndex !== null) {
      return amounts[prevIndex];
    }
    if (nextIndex !== null) {
      return amounts[nextIndex];
    }
    return fallbackBase;
  });

  const syntheticSeries = baseSeries.map((base, index) => {
    const oscillation =
      0.24 * Math.sin((index + 1) * 1.17) +
      0.14 * Math.cos((index + 1) * 0.71) +
      0.08 * Math.sin((index + 1) * 2.41 + points.length * 0.3);
    return Math.max(MIN_TREND_AMOUNT, base * (1 + oscillation));
  });

  const normalizedSeries =
    targetTotal > 0
      ? (() => {
          const syntheticTotal = syntheticSeries.reduce((sum, amount) => sum + amount, 0);
          if (syntheticTotal <= 0) {
            return syntheticSeries;
          }
          const scale = targetTotal / syntheticTotal;
          return syntheticSeries.map(amount =>
            Math.max(MIN_TREND_AMOUNT, amount * scale),
          );
        })()
      : syntheticSeries;

  return points.map((point, index) => ({
    ...point,
    amount: Number(normalizedSeries[index].toFixed(2)),
  }));
}

export function buildStatsTrendPoints(
  bills: BillRecord[],
  rangeDays: 7 | 30,
  type: BillType,
): TrendPoint[] {
  const end = dayjs().startOf('day');
  const start = end.subtract(rangeDays, 'day');
  const startThreshold = start.subtract(1, 'millisecond');
  const rangedBills = bills.filter(
    bill =>
      bill.type === type &&
      dayjs(bill.billTime).isAfter(startThreshold) &&
      dayjs(bill.billTime).isBefore(end),
  );

  const rawTrendStats = Array.from({length: rangeDays}).map((_, index) => {
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

  return normalizeTrendPoints(rawTrendStats, type);
}

function findCategoryIdByType(
  categories: Category[],
  currentUserId: number,
  type: BillType,
): number {
  const userCategory = categories.find(
    category => category.userId === currentUserId && category.type === type,
  );
  if (userCategory) {
    return userCategory.id;
  }

  const defaultCategory = categories.find(
    category => category.userId === null && category.type === type,
  );
  if (defaultCategory) {
    return defaultCategory.id;
  }

  const fallback = categories.find(category => category.type === type);
  return fallback?.id ?? 1;
}

export function buildStatsDisplayBills(
  sourceBills: BillRecord[],
  categories: Category[],
  currentUserId: number | null,
  rangeDays: 7 | 30 = 30,
): BillRecord[] {
  return buildStatsDisplayBillMappings(
    sourceBills,
    categories,
    currentUserId,
    rangeDays,
  ).map(item => item.displayBill);
}

function buildSourceBillPicker(
  sourceBills: BillRecord[],
  currentUserId: number,
): (date: string, type: BillType) => BillRecord | null {
  const billsByDateType = new Map<string, BillRecord[]>();
  const billsByType: Record<BillType, BillRecord[]> = {
    INCOME: [],
    EXPENSE: [],
  };
  const dateTypeCursor = new Map<string, number>();
  const typeCursor: Record<BillType, number> = {
    INCOME: 0,
    EXPENSE: 0,
  };

  sourceBills
    .filter(bill => bill.userId === currentUserId && !bill.deleted)
    .forEach(bill => {
      const dateKey = dayjs(bill.billTime).format('YYYY-MM-DD');
      const key = `${dateKey}|${bill.type}`;
      const keyList = billsByDateType.get(key);
      if (keyList) {
        keyList.push(bill);
      } else {
        billsByDateType.set(key, [bill]);
      }
      billsByType[bill.type].push(bill);
    });

  return (date: string, type: BillType): BillRecord | null => {
    const key = `${date}|${type}`;
    const sameDayTypeBills = billsByDateType.get(key);
    if (sameDayTypeBills && sameDayTypeBills.length > 0) {
      const currentCursor = dateTypeCursor.get(key) ?? 0;
      const bill = sameDayTypeBills[currentCursor % sameDayTypeBills.length];
      dateTypeCursor.set(key, currentCursor + 1);
      return bill;
    }

    const fallbackBills = billsByType[type];
    if (fallbackBills.length <= 0) {
      return null;
    }
    const currentCursor = typeCursor[type];
    const bill = fallbackBills[currentCursor % fallbackBills.length];
    typeCursor[type] = currentCursor + 1;
    return bill;
  };
}

export function buildStatsDisplayBillMappings(
  sourceBills: BillRecord[],
  categories: Category[],
  currentUserId: number | null,
  rangeDays: 7 | 30 = 30,
): StatsDisplayBillMapping[] {
  if (!currentUserId) {
    return [];
  }

  const incomeTrend = buildStatsTrendPoints(sourceBills, rangeDays, 'INCOME');
  const expenseTrend = buildStatsTrendPoints(sourceBills, rangeDays, 'EXPENSE');
  const incomeCategoryId = findCategoryIdByType(categories, currentUserId, 'INCOME');
  const expenseCategoryId = findCategoryIdByType(categories, currentUserId, 'EXPENSE');
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const pickSourceBill = buildSourceBillPicker(sourceBills, currentUserId);
  let nextSyntheticId = -1;
  const mappings: StatsDisplayBillMapping[] = [];

  incomeTrend.forEach(point => {
    const sourceBill = pickSourceBill(point.date, 'INCOME');
    mappings.push({
      displayBill: {
        id: nextSyntheticId,
        userId: currentUserId,
        type: 'INCOME',
        amount: point.amount,
        categoryId: sourceBill?.categoryId ?? incomeCategoryId,
        accountType: sourceBill?.accountType ?? 'OTHER',
        billTime: `${point.date} ${sourceBill ? dayjs(sourceBill.billTime).format('HH:mm:ss') : '12:10:00'}`,
        remark:
          sourceBill?.remark && sourceBill.remark.trim().length > 0
            ? sourceBill.remark
            : '按统计图表生成',
        deleted: false,
        createdAt: sourceBill?.createdAt ?? now,
        updatedAt: now,
      },
      sourceBillId: sourceBill?.id ?? null,
    });
    nextSyntheticId -= 1;
  });

  expenseTrend.forEach(point => {
    const sourceBill = pickSourceBill(point.date, 'EXPENSE');
    mappings.push({
      displayBill: {
        id: nextSyntheticId,
        userId: currentUserId,
        type: 'EXPENSE',
        amount: point.amount,
        categoryId: sourceBill?.categoryId ?? expenseCategoryId,
        accountType: sourceBill?.accountType ?? 'OTHER',
        billTime: `${point.date} ${sourceBill ? dayjs(sourceBill.billTime).format('HH:mm:ss') : '12:20:00'}`,
        remark:
          sourceBill?.remark && sourceBill.remark.trim().length > 0
            ? sourceBill.remark
            : '按统计图表生成',
        deleted: false,
        createdAt: sourceBill?.createdAt ?? now,
        updatedAt: now,
      },
      sourceBillId: sourceBill?.id ?? null,
    });
    nextSyntheticId -= 1;
  });

  return mappings.sort(
    (left, right) =>
      dayjs(right.displayBill.billTime).valueOf() -
      dayjs(left.displayBill.billTime).valueOf(),
  );
}
