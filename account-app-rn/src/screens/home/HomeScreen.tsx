import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, ScrollView, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import dayjs from 'dayjs';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {formatCurrency, formatSignedCurrency} from '@/utils/format';
import BillCard from '@/components/bill/BillCard';
import SwipeableBillRow from '@/components/bill/SwipeableBillRow';
import EmptyState from '@/components/common/EmptyState';
import PlusLineIcon from '@/components/common/icons/PlusLineIcon';
import DraggableFab from '@/components/common/DraggableFab';
import {useRecentBills} from '@/store/selectors/billSelectors';
import {useBudgetSummary, useMonthlyOverview} from '@/store/selectors/statsSelectors';
import {useMainTabNavigation} from '@/navigation/hooks';
import {deleteBill} from '@/api/bill';

export default function HomeScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const navigation = useMainTabNavigation<'Home'>();
  const insets = useSafeAreaInsets();
  const fabBottom = 24 + Math.max(insets.bottom, 8);
  const listBottomPadding = fabBottom + 88;
  const month = dayjs().format('YYYY-MM');
  const users = useAuthStore(state => state.users);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const categories = useAppStore(state => state.categories);
  const accounts = useAppStore(state => state.accounts);
  const overview = useMonthlyOverview(month);
  const budget = useBudgetSummary(month);
  const bills = useRecentBills(5);
  const [activeSwipeRowKey, setActiveSwipeRowKey] = useState<number | null>(null);
  const user = useMemo(
    () => users.find(item => item.id === currentUserId),
    [users, currentUserId],
  );
  const accountNameMap = useMemo(() => {
    const map = new Map<number, string>();
    accounts
      .filter(account => account.userId === currentUserId)
      .forEach(account => {
        map.set(account.id, account.name);
      });
    return map;
  }, [accounts, currentUserId]);
  const budgetBarAnim = useRef(new Animated.Value(0)).current;
  const [budgetTrackWidth, setBudgetTrackWidth] = useState(0);
  const budgetUsageRate = Math.min(Math.max(budget.usageRate, 0), 1);
  const budgetFillWidth = budgetBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, budgetTrackWidth],
  });

  useEffect(() => {
    budgetBarAnim.stopAnimation();
    Animated.spring(budgetBarAnim, {
      toValue: budgetUsageRate,
      damping: 14,
      stiffness: 170,
      mass: 0.94,
      useNativeDriver: false,
    }).start();
  }, [budgetBarAnim, budgetUsageRate]);

  const handleDeleteBill = useCallback((billId: number) => {
    Alert.alert('删除账单', '删除后不可恢复，是否继续？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(billId);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '请稍后重试';
            Alert.alert('删除失败', message);
          }
        },
      },
    ]);
  }, []);

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
          onScrollBeginDrag={() => setActiveSwipeRowKey(null)}
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
              <View
                onLayout={event =>
                  setBudgetTrackWidth(event.nativeEvent.layout.width)
                }
                style={{
                  height: 10,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor:
                    isDark
                      ? 'rgba(173,190,184,0.14)'
                      : 'rgba(26,32,44,0.07)',
                }}>
                <Animated.View
                  style={{
                    height: 10,
                    width: budgetFillWidth,
                    borderRadius: 999,
                    backgroundColor: colors.secondary,
                  }}
                />
              </View>
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
              bills.map(item => (
                <View key={item.id} style={{marginBottom: 10}}>
                  <SwipeableBillRow
                    rowKey={item.id}
                    activeRowKey={activeSwipeRowKey}
                    onRowOpen={setActiveSwipeRowKey}
                    onRowClose={rowKey =>
                      setActiveSwipeRowKey(current =>
                        current === rowKey ? null : current,
                      )
                    }
                    onPress={() =>
                      navigation.navigate('BillDetail', {
                        billId: item.id,
                      })
                    }
                    onEdit={() =>
                      navigation.navigate('BillEdit', {
                        billId: item.id,
                      })
                    }
                    onDelete={() => handleDeleteBill(item.id)}>
                    <BillCard
                      bill={item}
                      category={categories.find(
                        category => category.id === item.categoryId,
                      )}
                      sourceAccountName={item.accountId ? accountNameMap.get(item.accountId) : undefined}
                      transferTargetAccountName={
                        item.transferTargetAccountId
                          ? accountNameMap.get(item.transferTargetAccountId)
                          : undefined
                      }
                    />
                  </SwipeableBillRow>
                </View>
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
