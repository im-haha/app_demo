import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import StatsMetricPill, {MetricTone} from '@/components/stats/StatsMetricPill';
import {
  formatCurrency,
  formatDeltaPercent,
} from '@/components/stats/chart/statsChartFormat';

type StatsType = 'INCOME' | 'EXPENSE';

interface Props {
  type: StatsType;
  rangeDays: 7 | 30;
  totalAmount: number;
  previousTotal: number;
}

export default function StatsSummaryStrip({
  type,
  rangeDays,
  totalAmount,
  previousTotal,
}: Props): React.JSX.Element {
  const summaryLabel = type === 'EXPENSE' ? '本期总支出' : '本期总收入';
  const summaryTone: MetricTone = type === 'EXPENSE' ? 'expense' : 'income';
  const dailyAverage = rangeDays > 0 ? totalAmount / rangeDays : 0;

  const deltaTone = useMemo<MetricTone>(() => {
    if (previousTotal <= 0) {
      return 'default';
    }
    const delta = totalAmount - previousTotal;
    if (type === 'EXPENSE') {
      return delta <= 0 ? 'positive' : 'negative';
    }
    return delta >= 0 ? 'positive' : 'negative';
  }, [previousTotal, totalAmount, type]);

  const deltaValue =
    previousTotal <= 0 ? '暂无可比' : formatDeltaPercent(totalAmount, previousTotal);

  return (
    <View style={styles.row}>
      <StatsMetricPill
        label={summaryLabel}
        value={formatCurrency(totalAmount)}
        helper={`近${rangeDays}天`}
        tone={summaryTone}
      />
      <StatsMetricPill
        label="日均"
        value={formatCurrency(dailyAverage)}
        helper={`按 ${rangeDays} 天计算`}
      />
      <StatsMetricPill
        label="较上周期"
        value={deltaValue}
        helper={previousTotal <= 0 ? `前${rangeDays}天无数据` : `较前${rangeDays}天`}
        tone={deltaTone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
