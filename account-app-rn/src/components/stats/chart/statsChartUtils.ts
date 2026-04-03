import {CategoryStat, TrendPoint} from '@/types/bill';

export interface ChartCategoryDatum {
  key: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export function computeYAxisMax(maxValue: number, segments = 4): number {
  if (maxValue <= 0) {
    return 100;
  }

  const padded = maxValue * 1.14;
  const roughStep = padded / Math.max(segments, 2);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;

  let step = magnitude;
  if (normalized > 1 && normalized <= 2) {
    step = 2 * magnitude;
  } else if (normalized > 2 && normalized <= 5) {
    step = 5 * magnitude;
  } else if (normalized > 5) {
    step = 10 * magnitude;
  }

  return Math.ceil(padded / step) * step;
}

export function buildYAxisTicks(maxValue: number, segments = 4): number[] {
  const safeSegments = Math.max(segments, 2);
  const step = maxValue / safeSegments;
  return Array.from({length: safeSegments + 1}, (_, index) =>
    Number((step * index).toFixed(2)),
  );
}

export function buildVisibleLabelIndexes(length: number): Set<number> {
  const indexes = new Set<number>();
  if (length <= 0) {
    return indexes;
  }

  if (length <= 5) {
    return new Set(Array.from({length}, (_, index) => index));
  }

  const target = 5;
  const step = (length - 1) / (target - 1);
  for (let index = 0; index < target; index += 1) {
    indexes.add(Math.round(index * step));
  }
  indexes.add(0);
  indexes.add(length - 1);
  return indexes;
}

export function countLeadingZeroDays(data: TrendPoint[]): number {
  let count = 0;
  for (const item of data) {
    if (item.amount > 0) {
      break;
    }
    count += 1;
  }
  return count;
}

export function mergeTopCategories(
  categories: CategoryStat[],
  palette: string[],
  topN = 5,
): ChartCategoryDatum[] {
  if (categories.length === 0) {
    return [];
  }

  const sorted = [...categories].sort((left, right) => right.amount - left.amount);
  const total = sorted.reduce((sum, item) => sum + item.amount, 0);

  if (total <= 0) {
    return [];
  }

  const head = sorted.slice(0, topN);
  const tail = sorted.slice(topN);

  const result: ChartCategoryDatum[] = head.map((item, index) => ({
    key: String(item.categoryId),
    label: item.categoryName,
    amount: item.amount,
    percentage: item.amount / total,
    color: palette[index % palette.length],
  }));

  if (tail.length > 0) {
    const otherAmount = tail.reduce((sum, item) => sum + item.amount, 0);
    result.push({
      key: 'other',
      label: '其他',
      amount: otherAmount,
      percentage: otherAmount / total,
      color: palette[result.length % palette.length],
    });
  }

  return result;
}
