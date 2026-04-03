import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import dayjs from 'dayjs';
import {Menu, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import CashflowTrendCard from '@/components/stats/CashflowTrendCard';
import CashflowTrendXLCard from '@/components/stats/xl/CashflowTrendXLCard';
import CategoryDonutCard from '@/components/stats/CategoryDonutCard';
import CompareBarCard from '@/components/stats/CompareBarCard';
import StatsSummaryStrip from '@/components/stats/StatsSummaryStrip';
import AppInput from '@/components/common/AppInput';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {getStatsChartTheme} from '@/components/stats/chart/statsChartTheme';
import {segmentedSwitchHaptic} from '@/utils/haptics';
import {accountTypeOptions} from '@/utils/constants';
import {buildStatsTrendPointsByRange} from '@/utils/statsDisplayData';
import {AccountType} from '@/types/bill';

type StatsType = 'INCOME' | 'EXPENSE';
type TimePreset = 'THIS_MONTH' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

interface ResolvedRange {
  startDate: string;
  endDate: string;
  label: string;
  days: number;
}

function isValidDateText(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return dayjs(value).format('YYYY-MM-DD') === value;
}

function resolveStatsRange(
  preset: TimePreset,
  customStartDate: string,
  customEndDate: string,
): ResolvedRange {
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
    const start = dayjs(customStartDate).startOf('day');
    const end = dayjs(customEndDate).endOf('day');
    const normalizedStart = start.isAfter(end) ? end.startOf('day') : start;
    const normalizedEnd = start.isAfter(end) ? start.endOf('day') : end;
    return {
      startDate: normalizedStart.format('YYYY-MM-DD'),
      endDate: normalizedEnd.format('YYYY-MM-DD'),
      label: '自定义',
      days: Math.max(
        1,
        normalizedEnd.startOf('day').diff(normalizedStart.startOf('day'), 'day') + 1,
      ),
    };
  }

  return {
    startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    label: '近7天',
    days: 7,
  };
}

export default function StatsScreen(): React.JSX.Element {
  const useXLChart = true;
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const chartTheme = getStatsChartTheme(resolvedThemeMode);
  const [type, setType] = useState<StatsType>('EXPENSE');
  const [timePreset, setTimePreset] = useState<TimePreset>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState(
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  );
  const [customEndDate, setCustomEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | 'ALL'>('ALL');
  const [switchWidth, setSwitchWidth] = useState(0);
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const typeSwitchAnim = useRef(
    new Animated.Value(type === 'EXPENSE' ? 0 : 1),
  ).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const currentUserId = useAppStore(state => state.currentUserId);
  const visibleCategories = useMemo(
    () =>
      categories
        .filter(category => category.userId === null || category.userId === currentUserId)
        .sort((left, right) => left.sortNum - right.sortNum),
    [categories, currentUserId],
  );
  const userBills = useMemo(
    () => bills.filter(bill => bill.userId === currentUserId && !bill.deleted),
    [bills, currentUserId],
  );
  const timeRange = useMemo(
    () => resolveStatsRange(timePreset, customStartDate, customEndDate),
    [timePreset, customStartDate, customEndDate],
  );
  const scopedBills = useMemo(
    () =>
      userBills.filter(bill => {
        if (selectedCategoryId !== null && bill.categoryId !== selectedCategoryId) {
          return false;
        }
        if (selectedAccountType !== 'ALL' && bill.accountType !== selectedAccountType) {
          return false;
        }
        return true;
      }),
    [selectedAccountType, selectedCategoryId, userBills],
  );
  const currentRangeBills = useMemo(() => {
    const start = dayjs(timeRange.startDate).startOf('day').subtract(1, 'millisecond');
    const end = dayjs(timeRange.endDate).endOf('day').add(1, 'millisecond');
    return scopedBills.filter(bill => {
      const billTime = dayjs(bill.billTime);
      return billTime.isAfter(start) && billTime.isBefore(end);
    });
  }, [scopedBills, timeRange.endDate, timeRange.startDate]);
  const categoryStats = useMemo(() => {
    const monthBills = currentRangeBills.filter(bill => bill.type === type);
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
  }, [currentRangeBills, type, categories]);
  const trendStats = useMemo(
    () =>
      buildStatsTrendPointsByRange(
        scopedBills,
        timeRange.startDate,
        timeRange.endDate,
        type,
      ),
    [scopedBills, timeRange.endDate, timeRange.startDate, type],
  );
  const previousPeriodTotal = useMemo(() => {
    const currentStart = dayjs(timeRange.startDate).startOf('day');
    const previousEnd = currentStart.subtract(1, 'day').endOf('day');
    const previousStart = previousEnd.subtract(timeRange.days - 1, 'day').startOf('day');
    const startThreshold = previousStart.subtract(1, 'millisecond');
    const endThreshold = previousEnd.add(1, 'millisecond');

    return scopedBills
      .filter(bill => {
        if (bill.type !== type) {
          return false;
        }
        const billTime = dayjs(bill.billTime);
        return (
          billTime.isAfter(startThreshold) &&
          billTime.isBefore(endThreshold)
        );
      })
      .reduce((sum, bill) => sum + bill.amount, 0);
  }, [scopedBills, timeRange.days, timeRange.startDate, type]);
  const rangeCompareStats = useMemo(() => {
    const incomeTotal = currentRangeBills
      .filter(bill => bill.type === 'INCOME')
      .reduce((sum, bill) => sum + bill.amount, 0);
    const expenseTotal = currentRangeBills
      .filter(bill => bill.type === 'EXPENSE')
      .reduce((sum, bill) => sum + bill.amount, 0);
    return {incomeTotal, expenseTotal};
  }, [currentRangeBills]);
  const currentRangeTotal = useMemo(
    () => trendStats.reduce((sum, item) => sum + item.amount, 0),
    [trendStats],
  );
  const indicatorWidth = Math.max((switchWidth - 4) / 2, 0);
  const indicatorTranslateX = typeSwitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 2 + indicatorWidth],
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
  const selectedCategoryName =
    selectedCategoryId === null
      ? '全部分类'
      : visibleCategories.find(category => category.id === selectedCategoryId)?.name ??
        '全部分类';
  const selectedAccountName =
    selectedAccountType === 'ALL'
      ? '全部账户'
      : accountTypeOptions.find(item => item.value === selectedAccountType)?.label ??
        '全部账户';

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
  }, [
    contentOpacity,
    contentTranslateY,
    selectedAccountType,
    selectedCategoryId,
    timePreset,
    type,
    customStartDate,
    customEndDate,
  ]);

  function handleTypeChange(nextType: StatsType) {
    if (nextType === type) {
      return;
    }
    segmentedSwitchHaptic();
    setType(nextType);
  }

  function getSegmentTextColor(segmentType: StatsType): string {
    const isSelected = segmentType === type;
    if (!isSelected) {
      return colors.muted;
    }
    return segmentType === 'EXPENSE'
      ? selectedExpenseTextColor
      : selectedIncomeTextColor;
  }

  function clearFilters(): void {
    setTimePreset('THIS_MONTH');
    setCustomStartDate(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
    setCustomEndDate(dayjs().format('YYYY-MM-DD'));
    setSelectedCategoryId(null);
    setSelectedAccountType('ALL');
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <View style={{flex: 1}}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 8,
            gap: 10,
          }}>
          <View style={styles.headerRow}>
            <View style={{gap: 4}}>
              <Text variant="headlineSmall" style={{fontWeight: '800', color: colors.text}}>
                统计分析
              </Text>
              <Text variant="bodyMedium" style={{color: colors.muted}}>
                趋势、分类与收支对比共用同一组筛选条件
              </Text>
            </View>
          </View>

          <View style={{flexDirection: 'row', gap: 8}}>
            <Menu
              visible={timeMenuVisible}
              onDismiss={() => setTimeMenuVisible(false)}
              anchor={
                <Pressable
                  onPress={() => setTimeMenuVisible(true)}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: chartTheme.panelBorder,
                      backgroundColor: chartTheme.panelMutedFill,
                    },
                  ]}>
                  <Text numberOfLines={1} style={{fontWeight: '600', color: colors.text}}>
                    时间：{timeRange.label}
                  </Text>
                </Pressable>
              }>
              <Menu.Item
                title="本月"
                onPress={() => {
                  setTimePreset('THIS_MONTH');
                  setTimeMenuVisible(false);
                }}
              />
              <Menu.Item
                title="近 7 天"
                onPress={() => {
                  setTimePreset('LAST_7_DAYS');
                  setTimeMenuVisible(false);
                }}
              />
              <Menu.Item
                title="近 30 天"
                onPress={() => {
                  setTimePreset('LAST_30_DAYS');
                  setTimeMenuVisible(false);
                }}
              />
              <Menu.Item
                title="自定义"
                onPress={() => {
                  setTimePreset('CUSTOM');
                  setTimeMenuVisible(false);
                }}
              />
            </Menu>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Pressable
                  onPress={() => setCategoryMenuVisible(true)}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: chartTheme.panelBorder,
                      backgroundColor: chartTheme.panelMutedFill,
                    },
                  ]}>
                  <Text numberOfLines={1} style={{fontWeight: '600', color: colors.text}}>
                    {selectedCategoryName}
                  </Text>
                </Pressable>
              }>
              <Menu.Item
                title="全部分类"
                onPress={() => {
                  setSelectedCategoryId(null);
                  setCategoryMenuVisible(false);
                }}
              />
              {visibleCategories.map(category => (
                <Menu.Item
                  key={category.id}
                  title={category.name}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    setCategoryMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
            <Menu
              visible={accountMenuVisible}
              onDismiss={() => setAccountMenuVisible(false)}
              anchor={
                <Pressable
                  onPress={() => setAccountMenuVisible(true)}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: chartTheme.panelBorder,
                      backgroundColor: chartTheme.panelMutedFill,
                    },
                  ]}>
                  <Text numberOfLines={1} style={{fontWeight: '600', color: colors.text}}>
                    {selectedAccountName}
                  </Text>
                </Pressable>
              }>
              <Menu.Item
                title="全部账户"
                onPress={() => {
                  setSelectedAccountType('ALL');
                  setAccountMenuVisible(false);
                }}
              />
              {accountTypeOptions.map(option => (
                <Menu.Item
                  key={option.value}
                  title={option.label}
                  onPress={() => {
                    setSelectedAccountType(option.value);
                    setAccountMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
          </View>

          {timePreset === 'CUSTOM' ? (
            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                <AppInput
                  label="开始日期"
                  value={customStartDate}
                  onChangeText={setCustomStartDate}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{flex: 1}}>
                <AppInput
                  label="结束日期"
                  value={customEndDate}
                  onChangeText={setCustomEndDate}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          ) : null}

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
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text variant="bodySmall" style={{color: colors.muted}}>
              {timeRange.label} · {selectedCategoryName} · {selectedAccountName}
            </Text>
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Text variant="labelLarge" style={{color: colors.primary}}>
                清空筛选
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
              rangeDays={timeRange.days}
              rangeLabel={timeRange.label}
              totalAmount={currentRangeTotal}
              previousTotal={previousPeriodTotal}
            />
            {useXLChart ? (
              <CashflowTrendXLCard
                data={trendStats}
                type={type}
                rangeDays={timeRange.days}
                rangeLabel={timeRange.label}
                previousTotal={previousPeriodTotal}
              />
            ) : (
              <CashflowTrendCard
                data={trendStats}
                type={type}
                rangeDays={timeRange.days}
                rangeLabel={timeRange.label}
                previousTotal={previousPeriodTotal}
              />
            )}
            <CategoryDonutCard title={`${timeRange.label} 分类结构`} data={categoryStats} type={type} />
            <CompareBarCard
              rangeDays={timeRange.days}
              rangeLabel={timeRange.label}
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
  filterChip: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
  },
});
