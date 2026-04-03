import React, {useEffect, useMemo, useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import dayjs from 'dayjs';
import {Button, Card, ProgressBar, Text} from 'react-native-paper';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import {copyLastMonthBudget, saveBudget} from '@/api/budget';
import {useAppStore} from '@/store/appStore';
import {useThemeColors} from '@/theme';
import {formatCurrency} from '@/utils/format';

export default function BudgetScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const currentMonth = dayjs().format('YYYY-MM');
  const [month, setMonth] = useState(currentMonth);
  const [amount, setAmount] = useState('');
  const bills = useAppStore(state => state.bills);
  const budgets = useAppStore(state => state.budgets);
  const currentUserId = useAppStore(state => state.currentUserId);
  const getBudgetByMonth = useAppStore(state => state.getBudgetByMonth);
  const getBudgetHistoryStore = useAppStore(state => state.getBudgetHistory);
  const summary = useMemo(
    () => getBudgetByMonth(month),
    [getBudgetByMonth, month, bills, budgets, currentUserId],
  );
  const history = useMemo(
    () => getBudgetHistoryStore(12),
    [getBudgetHistoryStore, bills, budgets, currentUserId],
  );
  const canMoveNextMonth = dayjs(month).isBefore(dayjs(currentMonth), 'month');

  useEffect(() => {
    setAmount(summary.budgetAmount > 0 ? String(summary.budgetAmount) : '');
  }, [summary.budgetAmount, month]);

  function moveMonth(direction: -1 | 1): void {
    const nextMonth = dayjs(month).add(direction, 'month').format('YYYY-MM');
    if (direction > 0 && !dayjs(nextMonth).isBefore(dayjs(currentMonth).add(1, 'month'), 'month')) {
      return;
    }
    if (direction > 0 && dayjs(nextMonth).isAfter(dayjs(currentMonth), 'month')) {
      return;
    }
    setMonth(nextMonth);
  }

  async function handleSave() {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert('提示', '请输入大于 0 的预算金额');
      return;
    }

    try {
      await saveBudget(month, parsed);
      Alert.alert('已保存', `${month} 预算已更新`);
    } catch (error: any) {
      Alert.alert('保存失败', error?.message ?? '请稍后重试');
    }
  }

  async function handleCopyLastMonthBudget(): Promise<void> {
    try {
      await copyLastMonthBudget(month);
      Alert.alert('已沿用', `${month} 已沿用上月预算`);
    } catch (error: any) {
      Alert.alert('无法沿用', error?.message ?? '请先设置上月预算');
    }
  }

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
        <Card.Content style={{gap: 16}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Button mode="text" onPress={() => moveMonth(-1)}>
              上月
            </Button>
            <Text variant="headlineSmall" style={{fontWeight: '800'}}>
              {month} 月预算
            </Text>
            <Button mode="text" disabled={!canMoveNextMonth} onPress={() => moveMonth(1)}>
              下月
            </Button>
          </View>
          <AppInput
            label="预算金额"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="例如 3000"
          />
          <View style={{flexDirection: 'row', gap: 10}}>
            <View style={{flex: 1}}>
              <AppButton onPress={handleSave}>保存预算</AppButton>
            </View>
            <View style={{flex: 1}}>
              <Button mode="contained-tonal" onPress={() => void handleCopyLastMonthBudget()}>
                沿用上月预算
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
        <Card.Content style={{gap: 14}}>
          <Text variant="titleMedium">预算使用情况</Text>
          <ProgressBar progress={summary.usageRate} color={colors.secondary} style={{height: 10}} />
          <View style={{gap: 8}}>
            <Text>预算总额：{formatCurrency(summary.budgetAmount)}</Text>
            <Text>本月已支出：{formatCurrency(summary.spentAmount)}</Text>
            <Text>剩余预算：{formatCurrency(summary.remainingAmount)}</Text>
            <Text>使用比例：{(summary.usageRate * 100).toFixed(0)}%</Text>
          </View>
        </Card.Content>
      </Card>

      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
        <Card.Content style={{gap: 10}}>
          <Text variant="titleMedium">预算历史（最近 12 个月）</Text>
          {history.map(item => (
            <View
              key={item.month}
              style={{
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(120,130,140,0.16)',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text>{item.month}</Text>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={{fontWeight: '700'}}>
                  预算 {formatCurrency(item.budgetAmount)}
                </Text>
                <Text style={{color: colors.muted}}>
                  支出 {formatCurrency(item.spentAmount)}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
