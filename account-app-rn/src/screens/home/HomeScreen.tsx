import React, {useMemo} from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Card, ProgressBar, Text} from 'react-native-paper';
import dayjs from 'dayjs';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import {useThemeColors} from '@/theme';
import {formatCurrency, formatSignedCurrency} from '@/utils/format';
import BillCard from '@/components/bill/BillCard';
import EmptyState from '@/components/common/EmptyState';
import PlusLineIcon from '@/components/common/icons/PlusLineIcon';
import DraggableFab from '@/components/common/DraggableFab';

export default function HomeScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const fabBottom = 24 + Math.max(insets.bottom, 8);
  const listBottomPadding = fabBottom + 88;
  const month = dayjs().format('YYYY-MM');
  const users = useAppStore(state => state.users);
  const storeBills = useAppStore(state => state.bills);
  const budgets = useAppStore(state => state.budgets);
  const currentUserId = useAppStore(state => state.currentUserId);
  const categories = useAppStore(state => state.categories);
  const userBills = useMemo(
    () =>
      storeBills
        .filter(bill => bill.userId === currentUserId && !bill.deleted)
        .sort(
          (left, right) =>
            dayjs(right.billTime).valueOf() - dayjs(left.billTime).valueOf(),
        ),
    [storeBills, currentUserId],
  );
  const overview = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayIncome = userBills
      .filter(
        bill =>
          bill.type === 'INCOME' &&
          dayjs(bill.billTime).format('YYYY-MM-DD') === today,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);
    const todayExpense = userBills
      .filter(
        bill =>
          bill.type === 'EXPENSE' &&
          dayjs(bill.billTime).format('YYYY-MM-DD') === today,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);
    const monthIncome = userBills
      .filter(
        bill =>
          bill.type === 'INCOME' &&
          dayjs(bill.billTime).format('YYYY-MM') === month,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);
    const monthExpense = userBills
      .filter(
        bill =>
          bill.type === 'EXPENSE' &&
          dayjs(bill.billTime).format('YYYY-MM') === month,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);

    return {
      todayIncome,
      todayExpense,
      monthIncome,
      monthExpense,
      monthBalance: monthIncome - monthExpense,
    };
  }, [userBills, month]);
  const budget = useMemo(() => {
    if (!currentUserId) {
      return {
        month,
        budgetAmount: 0,
        spentAmount: 0,
        remainingAmount: 0,
        usageRate: 0,
      };
    }

    const budgetSetting = budgets.find(
      item => item.userId === currentUserId && item.month === month,
    );
    const spentAmount = userBills
      .filter(
        bill =>
          bill.type === 'EXPENSE' &&
          dayjs(bill.billTime).format('YYYY-MM') === month,
      )
      .reduce((sum, bill) => sum + bill.amount, 0);
    const budgetAmount = budgetSetting?.amount ?? 0;
    const remainingAmount = budgetAmount - spentAmount;
    const usageRate =
      budgetAmount > 0 ? Math.min(spentAmount / budgetAmount, 1) : 0;

    return {
      month,
      budgetAmount,
      spentAmount,
      remainingAmount,
      usageRate,
    };
  }, [month, budgets, userBills, currentUserId]);
  const bills = useMemo(() => userBills.slice(0, 5), [userBills]);
  const user = useMemo(
    () => users.find(item => item.id === currentUserId),
    [users, currentUserId],
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <View style={{flex: 1}}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 10,
            gap: 4,
          }}>
          <Text variant="headlineMedium" style={{fontWeight: '800'}}>
            早上好，{user?.nickname ?? '你'}
          </Text>
          <Text variant="bodyMedium" style={{color: colors.muted}}>
            今天先把现金流看清楚。
          </Text>
        </View>
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: listBottomPadding,
            paddingTop: 8,
            gap: 18,
          }}>
          <Card
            mode="contained"
            style={{backgroundColor: colors.primary, borderRadius: 28}}>
            <Card.Content style={{gap: 16}}>
              <Text variant="titleMedium" style={{color: '#FFFFFF'}}>
                本月结余
              </Text>
              <Text
                variant="displaySmall"
                style={{color: '#FFFFFF', fontWeight: '800'}}>
                {formatSignedCurrency(overview.monthBalance)}
              </Text>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
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
            <Card
              mode="contained"
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 24,
              }}>
              <Card.Content style={{gap: 8}}>
                <Text variant="bodySmall" style={{color: colors.muted}}>
                  本月收入
                </Text>
                <Text
                  variant="titleLarge"
                  style={{color: colors.income, fontWeight: '800'}}>
                  {formatCurrency(overview.monthIncome)}
                </Text>
              </Card.Content>
            </Card>
            <Card
              mode="contained"
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 24,
              }}>
              <Card.Content style={{gap: 8}}>
                <Text variant="bodySmall" style={{color: colors.muted}}>
                  本月支出
                </Text>
                <Text
                  variant="titleLarge"
                  style={{color: colors.expense, fontWeight: '800'}}>
                  {formatCurrency(overview.monthExpense)}
                </Text>
              </Card.Content>
            </Card>
          </View>

          <Card
            mode="contained"
            style={{backgroundColor: colors.surface, borderRadius: 24}}>
            <Card.Content style={{gap: 12}}>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text variant="titleMedium">预算进度</Text>
                <Text variant="bodySmall" style={{color: colors.muted}}>
                  {budget.budgetAmount > 0 ? '已设置' : '未设置'}
                </Text>
              </View>
              <ProgressBar
                progress={budget.usageRate}
                color={colors.secondary}
                style={{height: 10}}
              />
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{color: colors.muted}}>
                  剩余 {formatCurrency(budget.remainingAmount)}
                </Text>
                <Text style={{color: colors.muted}}>
                  支出 {formatCurrency(budget.spentAmount)} / 预算{' '}
                  {formatCurrency(budget.budgetAmount)}
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
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
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
                  category={categories.find(
                    item => item.id === bill.categoryId,
                  )}
                  onPress={() =>
                    navigation.navigate('BillDetail', {billId: bill.id})
                  }
                />
              ))
            )}
          </View>
        </ScrollView>
        <DraggableFab
          bottomOffset={fabBottom}
          backgroundColor={colors.secondary}
          onPress={() => navigation.navigate('BillAdd')}>
          <PlusLineIcon />
        </DraggableFab>
      </View>
    </SafeAreaView>
  );
}
