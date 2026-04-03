import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import Svg, {Circle, G} from 'react-native-svg';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {getStatsChartTheme} from '@/components/stats/chart/statsChartTheme';
import {formatCurrency, formatPercent} from '@/components/stats/chart/statsChartFormat';

interface Props {
  rangeDays: 7 | 30;
  incomeTotal: number;
  expenseTotal: number;
}

interface CompareItem {
  key: 'income' | 'expense' | 'balance';
  label: string;
  amount: number;
  color: string;
}

interface PieDatum {
  id: string;
  label: string;
  value: number;
  color: string;
  percentage: number;
}

const PIE_SIZE = 110;
const PIE_STROKE_WIDTH = 16;
const PIE_RADIUS = (PIE_SIZE - PIE_STROKE_WIDTH) / 2;
const PIE_CIRCUMFERENCE = 2 * Math.PI * PIE_RADIUS;

export default function CompareBarCard({
  rangeDays,
  incomeTotal,
  expenseTotal,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const mode = useResolvedThemeMode();
  const chartTheme = getStatsChartTheme(mode);
  const balance = incomeTotal - expenseTotal;
  const flowTotal = Math.max(incomeTotal + expenseTotal, 0);

  const items = useMemo<CompareItem[]>(
    () => [
      {
        key: 'income',
        label: '收入',
        amount: incomeTotal,
        color: colors.income,
      },
      {
        key: 'expense',
        label: '支出',
        amount: expenseTotal,
        color: colors.expense,
      },
      {
        key: 'balance',
        label: '结余',
        amount: balance,
        color: balance >= 0 ? chartTheme.positive : chartTheme.negative,
      },
    ],
    [balance, chartTheme.negative, chartTheme.positive, colors.expense, colors.income],
  );

  const base = useMemo(
    () => Math.max(...items.map(item => Math.abs(item.amount)), 1),
    [items],
  );
  const pieData = useMemo<PieDatum[]>(
    () =>
      flowTotal > 0
        ? [
            {
              id: 'income',
              label: '收入',
              value: incomeTotal,
              color: colors.income,
              percentage: incomeTotal / flowTotal,
            },
            {
              id: 'expense',
              label: '支出',
              value: expenseTotal,
              color: colors.expense,
              percentage: expenseTotal / flowTotal,
            },
          ]
        : [],
    [colors.expense, colors.income, expenseTotal, flowTotal, incomeTotal],
  );
  const incomeRatio = pieData[0]?.percentage ?? 0;
  const expenseRatio = pieData[1]?.percentage ?? 0;
  const incomeArcLength = Math.max(incomeRatio * PIE_CIRCUMFERENCE, 0);
  const expenseArcLength = Math.max(expenseRatio * PIE_CIRCUMFERENCE, 0);

  return (
    <Card
      mode="contained"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: chartTheme.panelBorder,
        },
      ]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={{fontWeight: '700'}}>
            收支对比
          </Text>
          <Text variant="bodySmall" style={{color: colors.muted}}>
            近{rangeDays}天
          </Text>
        </View>
        <View style={styles.pieRow}>
          <View style={styles.piePanel}>
            {pieData.length > 0 ? (
              <Svg width={PIE_SIZE} height={PIE_SIZE} style={styles.pieCanvas}>
                <G rotation={-90} origin={`${PIE_SIZE / 2}, ${PIE_SIZE / 2}`}>
                  <Circle
                    cx={PIE_SIZE / 2}
                    cy={PIE_SIZE / 2}
                    r={PIE_RADIUS}
                    stroke={chartTheme.panelMutedFill}
                    strokeWidth={PIE_STROKE_WIDTH}
                    fill="none"
                  />
                  <Circle
                    cx={PIE_SIZE / 2}
                    cy={PIE_SIZE / 2}
                    r={PIE_RADIUS}
                    stroke={colors.income}
                    strokeWidth={PIE_STROKE_WIDTH}
                    strokeDasharray={`${incomeArcLength} ${PIE_CIRCUMFERENCE}`}
                    strokeLinecap="butt"
                    fill="none"
                  />
                  {expenseArcLength > 0 ? (
                    <Circle
                      cx={PIE_SIZE / 2}
                      cy={PIE_SIZE / 2}
                      r={PIE_RADIUS}
                      stroke={colors.expense}
                      strokeWidth={PIE_STROKE_WIDTH}
                      strokeDasharray={`${expenseArcLength} ${PIE_CIRCUMFERENCE}`}
                      strokeDashoffset={-incomeArcLength}
                      strokeLinecap="butt"
                      fill="none"
                    />
                  ) : null}
                </G>
              </Svg>
            ) : (
              <View
                style={[
                  styles.pieEmptyState,
                  {
                    backgroundColor: chartTheme.panelMutedFill,
                    borderColor: chartTheme.panelBorder,
                  },
                ]}
              />
            )}
            <View pointerEvents="none" style={styles.pieCenter}>
              <Text variant="labelSmall" style={{color: colors.muted}}>
                总流量
              </Text>
              <Text variant="bodyMedium" style={{fontWeight: '700', color: colors.text}}>
                {formatCurrency(flowTotal)}
              </Text>
            </View>
          </View>
          <View style={styles.pieLegend}>
            {pieData.length > 0 ? (
              pieData.map(item => (
                <View key={item.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: item.color}]} />
                  <Text variant="bodyMedium" style={{flex: 1, color: colors.text}}>
                    {item.label}
                  </Text>
                  <Text variant="labelLarge" style={{fontWeight: '700', color: colors.text}}>
                    {formatPercent(item.percentage)}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="bodySmall" style={{color: colors.muted}}>
                暂无可计算的占比数据
              </Text>
            )}
          </View>
        </View>
        {items.map(item => {
          const widthPercent = Math.max((Math.abs(item.amount) / base) * 100, 0);
          const isBalance = item.key === 'balance';
          return (
            <View key={item.key} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text variant="bodyMedium" style={{color: colors.text}}>
                  {item.label}
                </Text>
                <Text
                  variant="labelLarge"
                  style={{
                    color: isBalance ? item.color : colors.text,
                    fontWeight: '700',
                  }}>
                  {item.key === 'balance' && item.amount > 0 ? '+' : ''}
                  {formatCurrency(item.amount)}
                </Text>
              </View>
              <View
                style={[
                  styles.track,
                  {
                    backgroundColor: chartTheme.panelMutedFill,
                  },
                ]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${widthPercent}%`,
                      backgroundColor: item.color,
                      opacity: isBalance ? 0.95 : 0.82,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  piePanel: {
    width: PIE_SIZE,
    height: PIE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pieCanvas: {
    width: PIE_SIZE,
    height: PIE_SIZE,
  },
  pieEmptyState: {
    width: PIE_SIZE - 8,
    height: PIE_SIZE - 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pieCenter: {
    position: 'absolute',
    alignItems: 'center',
    gap: 1,
  },
  pieLegend: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  row: {
    gap: 5,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 3,
  },
});
