export function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function formatAxisCurrency(value: number): string {
  if (value === 0) {
    return '¥0';
  }
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) {
    const million = value / 1_000_000;
    return `¥${million % 1 === 0 ? million.toFixed(0) : million.toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    const thousand = value / 1_000;
    return `¥${thousand % 1 === 0 ? thousand.toFixed(0) : thousand.toFixed(1)}k`;
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
