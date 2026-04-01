import React from 'react';
import {Pressable, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {BillRecord, Category} from '@/types/bill';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {formatCurrency, formatDateTime} from '@/utils/format';
import BillCategoryIcon from '@/components/bill/BillCategoryIcon';

interface Props {
  bill: BillRecord;
  category?: Category;
  onPress?: () => void;
}

export default function BillCard({
  bill,
  category,
  onPress,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const amountColor = bill.type === 'INCOME' ? colors.income : colors.expense;
  const subTextColor = isDark ? '#A8B7B3' : colors.muted;
  const timeTextColor = isDark ? '#97A9A4' : colors.muted;

  return (
    <Pressable onPress={onPress}>
      <Card
        mode="contained"
        style={{
          backgroundColor: colors.surface,
          borderRadius: 22,
        }}>
        <Card.Content
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingVertical: 8,
          }}>
          <BillCategoryIcon
            categoryName={category?.name}
            categoryIcon={category?.icon}
            size={46}
            iconSize={20}
          />
          <View style={{flex: 1, gap: 4}}>
            <Text variant="titleMedium" style={{color: colors.text, fontWeight: '700'}}>
              {category?.name ?? '未分类'}
            </Text>
            <Text variant="bodyMedium" style={{color: subTextColor}}>
              {bill.remark || '无备注'}
            </Text>
          </View>
          <View style={{alignItems: 'flex-end', gap: 4}}>
            <Text
              variant="titleMedium"
              style={{color: amountColor, fontWeight: '800'}}>
              {bill.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(bill.amount)}
            </Text>
            <Text variant="bodyMedium" style={{color: timeTextColor}}>
              {formatDateTime(bill.billTime)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
}
