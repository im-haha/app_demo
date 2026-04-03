import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {getStatsChartTheme} from '@/components/stats/chart/statsChartTheme';
import {formatCurrency} from '@/components/stats/chart/statsChartFormat';

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

export default function CompareBarCard({
  rangeDays,
  incomeTotal,
  expenseTotal,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const mode = useResolvedThemeMode();
  const chartTheme = getStatsChartTheme(mode);
  const balance = incomeTotal - expenseTotal;

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
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
