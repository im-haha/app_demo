export function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function formatAxisCurrency(value: number): string {
  if (value === 0) {
    return '¥0';
  }
  if (Math.abs(value) >= 10000) {
    const wan = value / 10000;
    return `¥${wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1)}万`;
  }
  return `¥${Math.round(value)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDeltaPercent(current: number, previous: number): string {
  if (previous <= 0) {
    return '暂无可比';
  }
  const ratio = (current - previous) / previous;
  const sign = ratio >= 0 ? '+' : '-';
  return `${sign}${Math.abs(ratio * 100).toFixed(1)}%`;
}
