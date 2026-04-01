import React, {useMemo, useState} from 'react';
import {ScrollView, View} from 'react-native';
import dayjs from 'dayjs';
import {Chip, SegmentedButtons, Text} from 'react-native-paper';
import {useAppStore} from '@/store/appStore';
import PieChartCard from '@/components/stats/PieChartCard';
import TrendChartCard from '@/components/stats/TrendChartCard';
import {colors} from '@/theme';

export default function StatsScreen(): React.JSX.Element {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const month = dayjs().format('YYYY-MM');
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const currentUserId = useAppStore(state => state.currentUserId);
  const userBills = useMemo(
    () =>
      bills.filter(bill => bill.userId === currentUserId && !bill.deleted),
    [bills, currentUserId],
  );
  const overview = useMemo(() => {
    const currentMonth = dayjs().format('YYYY-MM');
    const monthIncome = userBills
      .filter(bill => bill.type === 'INCOME' && dayjs(bill.billTime).format('YYYY-MM') === currentMonth)
      .reduce((sum, bill) => sum + bill.amount, 0);
    const monthExpense = userBills
      .filter(bill => bill.type === 'EXPENSE' && dayjs(bill.billTime).format('YYYY-MM') === currentMonth)
      .reduce((sum, bill) => sum + bill.amount, 0);

    return {
      monthIncome,
      monthExpense,
    };
  }, [userBills]);
  const categoryStats = useMemo(
    () => {
      const monthBills = userBills.filter(
        bill => bill.type === type && dayjs(bill.billTime).format('YYYY-MM') === month,
      );
      const total = monthBills.reduce((sum, bill) => sum + bill.amount, 0);
      const categoryMap = new Map<number, number>();

      monthBills.forEach(bill => {
        categoryMap.set(bill.categoryId, (categoryMap.get(bill.categoryId) ?? 0) + bill.amount);
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
    },
    [userBills, month, type, categories],
  );
  const trendStats = useMemo(
    () => {
      const start = dayjs().subtract(rangeDays - 1, 'day').startOf('day');
      const rangedBills = userBills.filter(
        bill =>
          bill.type === type && dayjs(bill.billTime).isAfter(start.subtract(1, 'millisecond')),
      );

      return Array.from({length: rangeDays}).map((_, index) => {
        const date = start.add(index, 'day');
        const amount = rangedBills
          .filter(bill => dayjs(bill.billTime).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'))
          .reduce((sum, bill) => sum + bill.amount, 0);

        return {
          label: date.format(rangeDays <= 7 ? 'MM/DD' : 'DD'),
          amount,
          date: date.format('YYYY-MM-DD'),
        };
      });
    },
    [userBills, rangeDays, type],
  );

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
      <View style={{gap: 4}}>
        <Text variant="headlineSmall" style={{fontWeight: '800'}}>
          统计分析
        </Text>
        <Text variant="bodyMedium" style={{color: colors.muted}}>
          用当前数据看消费结构和趋势。
        </Text>
      </View>

      <SegmentedButtons
        value={type}
        onValueChange={value => setType(value as 'INCOME' | 'EXPENSE')}
        buttons={[
          {label: '支出', value: 'EXPENSE'},
          {label: '收入', value: 'INCOME'},
        ]}
      />

      <View style={{flexDirection: 'row', gap: 12}}>
        <Chip selected={rangeDays === 7} onPress={() => setRangeDays(7)}>
          最近 7 天
        </Chip>
        <Chip selected={rangeDays === 30} onPress={() => setRangeDays(30)}>
          最近 30 天
        </Chip>
      </View>

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
          <Text variant="titleLarge" style={{color: colors.income, fontWeight: '800'}}>
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
          <Text variant="titleLarge" style={{color: colors.expense, fontWeight: '800'}}>
            ¥{overview.monthExpense.toFixed(2)}
          </Text>
        </View>
      </View>

      <PieChartCard title={`${month} 分类占比`} data={categoryStats} />
      <TrendChartCard title={`${rangeDays} 天趋势`} data={trendStats} />
    </ScrollView>
  );
}
