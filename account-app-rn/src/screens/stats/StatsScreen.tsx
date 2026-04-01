import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, View} from 'react-native';
import dayjs from 'dayjs';
import {Chip, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import PieChartCard from '@/components/stats/PieChartCard';
import TrendChartCard from '@/components/stats/TrendChartCard';
import {colors} from '@/theme';
import {segmentedSwitchHaptic} from '@/utils/haptics';

export default function StatsScreen(): React.JSX.Element {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [switchWidth, setSwitchWidth] = useState(0);
  const typeSwitchAnim = useRef(
    new Animated.Value(type === 'EXPENSE' ? 0 : 1),
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
  const indicatorWidth = Math.max((switchWidth - 4) / 2, 0);
  const indicatorTranslateX = typeSwitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 2 + indicatorWidth],
  });

  useEffect(() => {
    Animated.timing(typeSwitchAnim, {
      toValue: type === 'EXPENSE' ? 0 : 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [type, typeSwitchAnim]);

  useEffect(() => {
    contentOpacity.setValue(0.55);
    contentTranslateY.setValue(10);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        damping: 14,
        stiffness: 180,
        mass: 0.9,
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

  return (
    <SafeAreaView style={{flex: 1}} edges={['top']}>
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
              backgroundColor: colors.surface,
              borderRadius: 28,
              padding: 2,
              borderWidth: 1,
              borderColor: colors.border,
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
                backgroundColor: '#E3E9E8',
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
                  color: type === 'EXPENSE' ? colors.text : colors.muted,
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
                  color: type === 'INCOME' ? colors.text : colors.muted,
                }}>
                收入
              </Text>
            </Pressable>
          </View>

          <View style={{flexDirection: 'row', gap: 12}}>
            <Chip
              selected={rangeDays === 7}
              showSelectedCheck={false}
              onPress={() => handleRangeChange(7)}>
              最近 7 天
            </Chip>
            <Chip
              selected={rangeDays === 30}
              showSelectedCheck={false}
              onPress={() => handleRangeChange(30)}>
              最近 30 天
            </Chip>
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
            <TrendChartCard title={`${rangeDays} 天趋势`} data={trendStats} />
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
