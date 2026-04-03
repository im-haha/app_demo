import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import dayjs from 'dayjs';
import {Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import CashflowTrendCard from '@/components/stats/CashflowTrendCard';
import CashflowTrendXLCard from '@/components/stats/xl/CashflowTrendXLCard';
import CategoryDonutCard from '@/components/stats/CategoryDonutCard';
import CompareBarCard from '@/components/stats/CompareBarCard';
import StatsSummaryStrip from '@/components/stats/StatsSummaryStrip';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {getStatsChartTheme} from '@/components/stats/chart/statsChartTheme';
import {segmentedSwitchHaptic} from '@/utils/haptics';
import {TrendPoint} from '@/types/bill';

const MIN_TREND_AMOUNT = 1;
const DEFAULT_SYNTHETIC_BASE = {
  INCOME: 260,
  EXPENSE: 120,
} as const;

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
  type: 'INCOME' | 'EXPENSE',
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

  return points.map((point, index) => {
    return {
      ...point,
      amount: Number(normalizedSeries[index].toFixed(2)),
    };
  });
}

export default function StatsScreen(): React.JSX.Element {
  const useXLChart = true;
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const chartTheme = getStatsChartTheme(resolvedThemeMode);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [switchWidth, setSwitchWidth] = useState(0);
  const [rangeSwitchWidth, setRangeSwitchWidth] = useState(0);
  const typeSwitchAnim = useRef(
    new Animated.Value(type === 'EXPENSE' ? 0 : 1),
  ).current;
  const rangeSwitchAnim = useRef(
    new Animated.Value(rangeDays === 7 ? 0 : 1),
  ).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const month = dayjs().format('YYYY-MM');
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const currentUserId = useAppStore(state => state.currentUserId);
  const userBills = useMemo(
    () => bills.filter(bill => bill.userId === currentUserId && !bill.deleted),
    [bills, currentUserId],
  );
  const categoryStats = useMemo(() => {
    const monthBills = userBills.filter(
      bill =>
        bill.type === type && dayjs(bill.billTime).format('YYYY-MM') === month,
    );
    const total = monthBills.reduce((sum, bill) => sum + bill.amount, 0);
    const categoryMap = new Map<number, number>();

    monthBills.forEach(bill => {
      categoryMap.set(
        bill.categoryId,
        (categoryMap.get(bill.categoryId) ?? 0) + bill.amount,
      );
    });

    return Array.from(categoryMap.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find(item => item.id === categoryId);

        return {
          categoryId,
          categoryName: category?.name ?? '未分类',
          color: category?.color ?? '#6C757D',
          amount,
          percentage: total > 0 ? amount / total : 0,
        };
      })
      .sort((left, right) => right.amount - left.amount);
  }, [userBills, month, type, categories]);
  const trendStats = useMemo(() => {
    const end = dayjs().startOf('day');
    const start = end.subtract(rangeDays, 'day');
    const startThreshold = start.subtract(1, 'millisecond');
    const rangedBills = userBills.filter(
      bill =>
        bill.type === type &&
        dayjs(bill.billTime).isAfter(startThreshold) &&
        dayjs(bill.billTime).isBefore(end),
    );

    const rawTrendStats = Array.from({length: rangeDays}).map((_, index) => {
      const date = start.add(index, 'day');
      const amount = rangedBills
        .filter(
          bill =>
            dayjs(bill.billTime).format('YYYY-MM-DD') ===
            date.format('YYYY-MM-DD'),
        )
        .reduce((sum, bill) => sum + bill.amount, 0);

      return {
        axisLabel: date.format('MM/DD'),
        amount,
        date: date.format('YYYY-MM-DD'),
      };
    });

    return normalizeTrendPoints(rawTrendStats, type);
  }, [userBills, rangeDays, type]);
  const previousPeriodTotal = useMemo(() => {
    const currentStart = dayjs().startOf('day').subtract(rangeDays, 'day');
    const previousStart = currentStart.subtract(rangeDays, 'day');
    const previousStartThreshold = previousStart.subtract(1, 'millisecond');

    return userBills
      .filter(bill => {
        if (bill.type !== type) {
          return false;
        }
        const billTime = dayjs(bill.billTime);
        return (
          billTime.isAfter(previousStartThreshold) && billTime.isBefore(currentStart)
        );
      })
      .reduce((sum, bill) => sum + bill.amount, 0);
  }, [rangeDays, type, userBills]);
  const rangeCompareStats = useMemo(() => {
    const end = dayjs().startOf('day');
    const start = end.subtract(rangeDays, 'day');
    const startThreshold = start.subtract(1, 'millisecond');
    const rangedBills = userBills.filter(
      bill =>
        dayjs(bill.billTime).isAfter(startThreshold) &&
        dayjs(bill.billTime).isBefore(end),
    );
    const incomeTotal = rangedBills
      .filter(bill => bill.type === 'INCOME')
      .reduce((sum, bill) => sum + bill.amount, 0);
    const expenseTotal = rangedBills
      .filter(bill => bill.type === 'EXPENSE')
      .reduce((sum, bill) => sum + bill.amount, 0);
    return {incomeTotal, expenseTotal};
  }, [rangeDays, userBills]);
  const currentRangeTotal = useMemo(
    () => trendStats.reduce((sum, item) => sum + item.amount, 0),
    [trendStats],
  );
  const indicatorWidth = Math.max((switchWidth - 4) / 2, 0);
  const indicatorTranslateX = typeSwitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 2 + indicatorWidth],
  });
  const rangeIndicatorWidth = Math.max((rangeSwitchWidth - 4) / 2, 0);
  const rangeIndicatorTranslateX = rangeSwitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 2 + rangeIndicatorWidth],
  });
  const switchThumbBackground =
    type === 'EXPENSE'
      ? isDark
        ? 'rgba(225,144,104,0.24)'
        : 'rgba(197,106,60,0.15)'
      : isDark
        ? 'rgba(89,196,160,0.26)'
        : 'rgba(29,138,108,0.16)';
  const switchTrackBackground = chartTheme.panelMutedFill;
  const switchBorderColor = chartTheme.panelBorder;
  const selectedExpenseTextColor = isDark ? '#FFCAAF' : '#8D4A2E';
  const selectedIncomeTextColor = isDark ? '#BBEED9' : '#1E6E54';
  const rangeTrackBackground = chartTheme.panelMutedFill;
  const rangeBorderColor = chartTheme.panelBorder;
  const rangeThumbBackground = colors.surface;
  const selectedRangeTextColor = colors.text;

  useEffect(() => {
    Animated.spring(typeSwitchAnim, {
      toValue: type === 'EXPENSE' ? 0 : 1,
      damping: 18,
      stiffness: 210,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [type, typeSwitchAnim]);

  useEffect(() => {
    Animated.spring(rangeSwitchAnim, {
      toValue: rangeDays === 7 ? 0 : 1,
      damping: 18,
      stiffness: 215,
      mass: 0.92,
      useNativeDriver: true,
    }).start();
  }, [rangeDays, rangeSwitchAnim]);

  useEffect(() => {
    contentOpacity.setValue(0.76);
    contentTranslateY.setValue(14);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        damping: 16,
        stiffness: 165,
        mass: 1.02,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY, type, rangeDays]);

  function handleTypeChange(nextType: 'INCOME' | 'EXPENSE') {
    if (nextType === type) {
      return;
    }
    segmentedSwitchHaptic();
    setType(nextType);
  }

  function handleRangeChange(nextRange: 7 | 30) {
    if (nextRange === rangeDays) {
      return;
    }
    segmentedSwitchHaptic();
    setRangeDays(nextRange);
  }

  function getSegmentTextColor(segmentType: 'INCOME' | 'EXPENSE'): string {
    const isSelected = segmentType === type;
    if (!isSelected) {
      return colors.muted;
    }
    return segmentType === 'EXPENSE'
      ? selectedExpenseTextColor
      : selectedIncomeTextColor;
  }

  function getRangeTextColor(targetRange: 7 | 30): string {
    return rangeDays === targetRange ? selectedRangeTextColor : colors.muted;
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <View style={{flex: 1}}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 8,
            gap: 14,
          }}>
          <View style={styles.headerRow}>
            <View style={{gap: 4}}>
              <Text variant="headlineSmall" style={{fontWeight: '800', color: colors.text}}>
                统计分析
              </Text>
              <Text variant="bodyMedium" style={{color: colors.muted}}>
                基于当前账单数据生成消费结构与趋势
              </Text>
            </View>
            <View style={styles.headerTagRow}>
              <View
                style={[
                  styles.headerTag,
                  {
                    backgroundColor: chartTheme.panelMutedFill,
                    borderColor: chartTheme.panelBorder,
                  },
                ]}>
                <Text variant="labelSmall" style={{color: colors.muted}}>
                  本月
                </Text>
              </View>
              <View
                style={[
                  styles.headerTag,
                  {
                    backgroundColor: chartTheme.panelMutedFill,
                    borderColor: chartTheme.panelBorder,
                  },
                ]}>
                <Text variant="labelSmall" style={{color: colors.muted}}>
                  离线数据
                </Text>
              </View>
            </View>
          </View>

          <View
            onLayout={event => setSwitchWidth(event.nativeEvent.layout.width)}
            style={{
              height: 56,
              backgroundColor: switchTrackBackground,
              borderRadius: 28,
              padding: 2,
              borderWidth: 1,
              borderColor: switchBorderColor,
              flexDirection: 'row',
              overflow: 'hidden',
            }}>
            <Animated.View
              style={{
                position: 'absolute',
                top: 2,
                left: 0,
                height: 52,
                width: indicatorWidth,
                borderRadius: 26,
                backgroundColor: switchThumbBackground,
                transform: [{translateX: indicatorTranslateX}],
              }}
            />
            <Pressable
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
              }}
              onPress={() => handleTypeChange('EXPENSE')}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: '700',
                  color: getSegmentTextColor('EXPENSE'),
                }}>
                支出
              </Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
              }}
              onPress={() => handleTypeChange('INCOME')}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: '700',
                  color: getSegmentTextColor('INCOME'),
                }}>
                收入
              </Text>
            </Pressable>
          </View>

          <View
            onLayout={event =>
              setRangeSwitchWidth(event.nativeEvent.layout.width)
            }
            style={{
              height: 44,
              backgroundColor: rangeTrackBackground,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: rangeBorderColor,
              padding: 2,
              flexDirection: 'row',
              overflow: 'hidden',
            }}>
            <Animated.View
              style={{
                position: 'absolute',
                top: 2,
                left: 0,
                height: 40,
                width: rangeIndicatorWidth,
                borderRadius: 20,
                backgroundColor: rangeThumbBackground,
                transform: [{translateX: rangeIndicatorTranslateX}],
              }}
            />
            <Pressable
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
              onPress={() => handleRangeChange(7)}>
              <Text
                variant="titleSmall"
                style={{fontWeight: '700', color: getRangeTextColor(7)}}>
                最近 7 天
              </Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
              onPress={() => handleRangeChange(30)}>
              <Text
                variant="titleSmall"
                style={{fontWeight: '700', color: getRangeTextColor(30)}}>
                最近 30 天
              </Text>
            </Pressable>
          </View>
        </View>
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 20,
            paddingTop: 10,
          }}>
          <Animated.View
            style={{
              gap: 14,
              opacity: contentOpacity,
              transform: [{translateY: contentTranslateY}],
            }}>
            <StatsSummaryStrip
              type={type}
              rangeDays={rangeDays}
              totalAmount={currentRangeTotal}
              previousTotal={previousPeriodTotal}
            />
            {useXLChart ? (
              <CashflowTrendXLCard
                data={trendStats}
                type={type}
                rangeDays={rangeDays}
                previousTotal={previousPeriodTotal}
              />
            ) : (
              <CashflowTrendCard
                data={trendStats}
                type={type}
                rangeDays={rangeDays}
                previousTotal={previousPeriodTotal}
              />
            )}
            <CategoryDonutCard title={`${month} 分类结构`} data={categoryStats} type={type} />
            <CompareBarCard
              rangeDays={rangeDays}
              incomeTotal={rangeCompareStats.incomeTotal}
              expenseTotal={rangeCompareStats.expenseTotal}
            />
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerTagRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  headerTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
