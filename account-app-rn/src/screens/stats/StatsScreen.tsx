import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, View} from 'react-native';
import dayjs from 'dayjs';
import {Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import PieChartCard from '@/components/stats/PieChartCard';
import TrendChartCard from '@/components/stats/TrendChartCard';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {segmentedSwitchHaptic} from '@/utils/haptics';

export default function StatsScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
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
  const overview = useMemo(() => {
    const currentMonth = dayjs().format('YYYY-MM');
    const monthIncome = userBills
      .filter(
        bill =>
          bill.type === 'INCOME' &&
          dayjs(bill.billTime).format('YYYY-MM') === currentMonth,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);
    const monthExpense = userBills
      .filter(
        bill =>
          bill.type === 'EXPENSE' &&
          dayjs(bill.billTime).format('YYYY-MM') === currentMonth,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);

    return {
      monthIncome,
      monthExpense,
    };
  }, [userBills]);
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
    const start = dayjs()
      .subtract(rangeDays - 1, 'day')
      .startOf('day');
    const rangedBills = userBills.filter(
      bill =>
        bill.type === type &&
        dayjs(bill.billTime).isAfter(start.subtract(1, 'millisecond')),
    );

    return Array.from({length: rangeDays}).map((_, index) => {
      const date = start.add(index, 'day');
      const amount = rangedBills
        .filter(
          bill =>
            dayjs(bill.billTime).format('YYYY-MM-DD') ===
            date.format('YYYY-MM-DD'),
        )
        .reduce((sum, bill) => sum + bill.amount, 0);

      return {
        label: date.format(rangeDays <= 7 ? 'MM/DD' : 'DD'),
        amount,
        date: date.format('YYYY-MM-DD'),
      };
    });
  }, [userBills, rangeDays, type]);
  const previousPeriodTotal = useMemo(() => {
    const currentStart = dayjs()
      .subtract(rangeDays - 1, 'day')
      .startOf('day');
    const previousStart = currentStart.subtract(rangeDays, 'day');

    return userBills
      .filter(bill => {
        if (bill.type !== type) {
          return false;
        }
        const billTime = dayjs(bill.billTime);
        return (
          billTime.isAfter(previousStart.subtract(1, 'millisecond')) &&
          billTime.isBefore(currentStart)
        );
      })
      .reduce((sum, bill) => sum + bill.amount, 0);
  }, [rangeDays, type, userBills]);
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
        ? 'rgba(224,106,58,0.26)'
        : 'rgba(224,106,58,0.14)'
      : isDark
        ? 'rgba(45,156,116,0.28)'
        : 'rgba(45,156,116,0.16)';
  const switchTrackBackground = isDark ? '#101B21' : '#F7F2E8';
  const switchBorderColor = isDark
    ? 'rgba(142,148,143,0.28)'
    : 'rgba(142,148,143,0.2)';
  const selectedExpenseTextColor = isDark ? '#FFD8CB' : '#8A3E22';
  const selectedIncomeTextColor = isDark ? '#CBF3E4' : '#216B4E';
  const rangeTrackBackground = isDark ? '#111B22' : '#FBF7EF';
  const rangeBorderColor = isDark
    ? 'rgba(142,148,143,0.26)'
    : 'rgba(142,148,143,0.2)';
  const rangeThumbBackground = isDark ? '#2B3646' : '#ECE4FC';
  const selectedRangeTextColor = isDark ? '#EAF2F0' : '#1F4346';

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
            paddingTop: 12,
            paddingBottom: 10,
            gap: 16,
          }}>
          <View style={{gap: 4}}>
            <Text variant="headlineSmall" style={{fontWeight: '800'}}>
              统计分析
            </Text>
            <Text variant="bodyMedium" style={{color: colors.muted}}>
              用当前数据看消费结构和趋势。
            </Text>
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
            paddingTop: 8,
          }}>
          <Animated.View
            style={{
              gap: 16,
              opacity: contentOpacity,
              transform: [{translateY: contentTranslateY}],
            }}>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View
                style={{
                  flex: 1,
                  borderRadius: 24,
                  backgroundColor: colors.surface,
                  padding: 16,
                  gap: 6,
                }}>
                <Text style={{color: colors.muted}}>本月收入</Text>
                <Text
                  variant="titleLarge"
                  style={{color: colors.income, fontWeight: '800'}}>
                  ¥{overview.monthIncome.toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  borderRadius: 24,
                  backgroundColor: colors.surface,
                  padding: 16,
                  gap: 6,
                }}>
                <Text style={{color: colors.muted}}>本月支出</Text>
                <Text
                  variant="titleLarge"
                  style={{color: colors.expense, fontWeight: '800'}}>
                  ¥{overview.monthExpense.toFixed(2)}
                </Text>
              </View>
            </View>

            <PieChartCard title={`${month} 分类占比`} data={categoryStats} />
            <TrendChartCard
              title={`${rangeDays} 天趋势`}
              data={trendStats}
              type={type}
              rangeDays={rangeDays}
              previousTotal={previousPeriodTotal}
            />
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
