import React from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Card, FAB, ProgressBar, Text} from 'react-native-paper';
import dayjs from 'dayjs';
import {useAppStore} from '@/store/appStore';
import {colors} from '@/theme';
import {formatCurrency, formatSignedCurrency} from '@/utils/format';
import BillCard from '@/components/bill/BillCard';
import EmptyState from '@/components/common/EmptyState';

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const overview = useAppStore(state => state.getOverview());
  const budget = useAppStore(state => state.getBudgetByMonth(dayjs().format('YYYY-MM')));
  const bills = useAppStore(state => state.getBills().slice(0, 5));
  const categories = useAppStore(state => state.categories);
  const user = useAppStore(state => state.getCurrentUser());

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={{padding: 20, gap: 18}}>
        <View style={{gap: 4}}>
          <Text variant="headlineMedium" style={{fontWeight: '800'}}>
            早上好，{user?.nickname ?? '你'}
          </Text>
          <Text variant="bodyMedium" style={{color: colors.muted}}>
            今天先把现金流看清楚。
          </Text>
        </View>

        <Card mode="contained" style={{backgroundColor: colors.primary, borderRadius: 28}}>
          <Card.Content style={{gap: 16}}>
            <Text variant="titleMedium" style={{color: '#FFFFFF'}}>
              本月结余
            </Text>
            <Text variant="displaySmall" style={{color: '#FFFFFF', fontWeight: '800'}}>
              {formatSignedCurrency(overview.monthBalance)}
            </Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View style={{gap: 4}}>
                <Text variant="bodySmall" style={{color: '#D9F2EE'}}>
                  今日支出
                </Text>
                <Text variant="titleMedium" style={{color: '#FFFFFF'}}>
                  {formatCurrency(overview.todayExpense)}
                </Text>
              </View>
              <View style={{gap: 4, alignItems: 'flex-end'}}>
                <Text variant="bodySmall" style={{color: '#D9F2EE'}}>
                  今日收入
                </Text>
                <Text variant="titleMedium" style={{color: '#FFFFFF'}}>
                  {formatCurrency(overview.todayIncome)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={{flexDirection: 'row', gap: 12}}>
          <Card mode="contained" style={{flex: 1, backgroundColor: colors.surface, borderRadius: 24}}>
            <Card.Content style={{gap: 8}}>
              <Text variant="bodySmall" style={{color: colors.muted}}>
                本月收入
              </Text>
              <Text variant="titleLarge" style={{color: colors.income, fontWeight: '800'}}>
                {formatCurrency(overview.monthIncome)}
              </Text>
            </Card.Content>
          </Card>
          <Card mode="contained" style={{flex: 1, backgroundColor: colors.surface, borderRadius: 24}}>
            <Card.Content style={{gap: 8}}>
              <Text variant="bodySmall" style={{color: colors.muted}}>
                本月支出
              </Text>
              <Text variant="titleLarge" style={{color: colors.expense, fontWeight: '800'}}>
                {formatCurrency(overview.monthExpense)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
          <Card.Content style={{gap: 12}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text variant="titleMedium">预算进度</Text>
              <Text variant="bodySmall" style={{color: colors.muted}}>
                {budget.budgetAmount > 0 ? '已设置' : '未设置'}
              </Text>
            </View>
            <ProgressBar progress={budget.usageRate} color={colors.secondary} style={{height: 10}} />
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{color: colors.muted}}>剩余 {formatCurrency(budget.remainingAmount)}</Text>
              <Text style={{color: colors.muted}}>
                支出 {formatCurrency(budget.spentAmount)} / 预算 {formatCurrency(budget.budgetAmount)}
              </Text>
            </View>
            <Text
              variant="labelLarge"
              onPress={() => navigation.navigate('Budget')}
              style={{color: colors.primary}}>
              去设置预算
            </Text>
          </Card.Content>
        </Card>

        <View style={{gap: 10}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text variant="titleMedium">最近账单</Text>
            <Text
              variant="labelLarge"
              style={{color: colors.primary}}
              onPress={() => navigation.navigate('Bills')}>
              查看全部
            </Text>
          </View>
          {bills.length === 0 ? (
            <EmptyState
              title="还没开始记账"
              description="新增一笔支出或收入后，这里会展示最近记录。"
              icon="notebook-plus-outline"
            />
          ) : (
            bills.map(bill => (
              <BillCard
                key={bill.id}
                bill={bill}
                category={categories.find(item => item.id === bill.categoryId)}
                onPress={() => navigation.navigate('BillDetail', {billId: bill.id})}
              />
            ))
          )}
        </View>
      </ScrollView>
      <FAB
        icon="plus"
        style={{position: 'absolute', right: 20, bottom: 24, backgroundColor: colors.secondary}}
        color="#FFFFFF"
        onPress={() => navigation.navigate('BillAdd')}
      />
    </View>
  );
}
