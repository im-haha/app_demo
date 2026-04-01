import React, {useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import dayjs from 'dayjs';
import {Card, ProgressBar, Text} from 'react-native-paper';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import {saveBudget} from '@/api/budget';
import {useAppStore} from '@/store/appStore';
import {colors} from '@/theme';
import {formatCurrency} from '@/utils/format';

export default function BudgetScreen(): React.JSX.Element {
  const month = dayjs().format('YYYY-MM');
  const summary = useAppStore(state => state.getBudgetByMonth(month));
  const [amount, setAmount] = useState(summary.budgetAmount > 0 ? String(summary.budgetAmount) : '');

  async function handleSave() {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert('提示', '请输入大于 0 的预算金额');
      return;
    }

    await saveBudget(month, parsed);
    Alert.alert('已保存', '本月预算已更新');
  }

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
        <Card.Content style={{gap: 16}}>
          <Text variant="headlineSmall" style={{fontWeight: '800'}}>
            {month} 月预算
          </Text>
          <AppInput
            label="预算金额"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="例如 3000"
          />
          <AppButton onPress={handleSave}>保存预算</AppButton>
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
    </ScrollView>
  );
}
