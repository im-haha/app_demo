import dayjs from 'dayjs';

export type CommonTimePreset = 'THIS_MONTH' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';
export type BillTimePreset = Exclude<CommonTimePreset, 'LAST_30_DAYS'>;

export interface TimePresetOption<T extends string = string> {
  label: string;
  value: T;
}

export interface ResolvedTimeRange {
  startDate: string;
  endDate: string;
  label: string;
  days: number;
}

export const billTimePresetOptions: TimePresetOption<BillTimePreset>[] = [
  {label: '本月', value: 'THIS_MONTH'},
  {label: '近 7 天', value: 'LAST_7_DAYS'},
  {label: '自定义', value: 'CUSTOM'},
];

export const statsTimePresetOptions: TimePresetOption<CommonTimePreset>[] = [
  {label: '本月', value: 'THIS_MONTH'},
  {label: '近 7 天', value: 'LAST_7_DAYS'},
  {label: '近 30 天', value: 'LAST_30_DAYS'},
  {label: '自定义', value: 'CUSTOM'},
];

export function isValidDateText(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return dayjs(value).format('YYYY-MM-DD') === value;
}

export function normalizeDateRange(
  startDate: string,
  endDate: string,
): {startDate: string; endDate: string; days: number} {
  const rawStart = dayjs(startDate).startOf('day');
  const rawEnd = dayjs(endDate).endOf('day');
  const start = rawStart.isAfter(rawEnd) ? rawEnd.startOf('day') : rawStart;
  const end = rawStart.isAfter(rawEnd) ? rawStart.endOf('day') : rawEnd;
  const days = Math.max(1, end.startOf('day').diff(start.startOf('day'), 'day') + 1);

  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    days,
  };
}

export function resolveTimeRange(
  preset: CommonTimePreset,
  customStartDate: string,
  customEndDate: string,
): ResolvedTimeRange {
  if (preset === 'THIS_MONTH') {
    const start = dayjs().startOf('month');
    const end = dayjs().endOf('day');
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      label: '本月',
      days: Math.max(1, end.startOf('day').diff(start.startOf('day'), 'day') + 1),
    };
  }

  if (preset === 'LAST_7_DAYS') {
    return {
      startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
      label: '近7天',
      days: 7,
    };
  }

  if (preset === 'LAST_30_DAYS') {
    return {
      startDate: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
      label: '近30天',
      days: 30,
    };
  }

  const validStart = isValidDateText(customStartDate);
  const validEnd = isValidDateText(customEndDate);
  if (validStart && validEnd) {
    const normalized = normalizeDateRange(customStartDate, customEndDate);
    return {
      ...normalized,
      label: '自定义',
    };
  }

  return {
    startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    label: '近7天',
    days: 7,
  };
}
