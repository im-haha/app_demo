import React, {useState} from 'react';
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
  const overview = useAppStore(state => state.getOverview());
  const categoryStats = useAppStore(state => state.getCategoryBreakdown(month, type));
  const trendStats = useAppStore(state => state.getTrend(rangeDays, type));

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
