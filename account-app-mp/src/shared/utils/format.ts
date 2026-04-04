import dayjs from 'dayjs';

export function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function formatSignedCurrency(value: number): string {
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}${formatCurrency(Math.abs(value))}`;
}

export function formatDateTime(value: string): string {
  return dayjs(value).format('MM-DD HH:mm');
}

export function formatDateLabel(value: string): string {
  return dayjs(value).format('YYYY-MM-DD');
}

export function formatMonth(value: string): string {
  return dayjs(value).format('YYYY-MM');
}

export function isSameDay(left: string, right: string): boolean {
  return dayjs(left).format('YYYY-MM-DD') === dayjs(right).format('YYYY-MM-DD');
}
