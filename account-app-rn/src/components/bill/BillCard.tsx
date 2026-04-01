import React from 'react';
import {Pressable, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {BillRecord, Category} from '@/types/bill';
import {colors} from '@/theme';
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
  const amountColor = bill.type === 'INCOME' ? colors.income : colors.expense;

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
            <Text variant="titleMedium">{category?.name ?? '未分类'}</Text>
            <Text variant="bodySmall" style={{color: colors.muted}}>
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
            <Text variant="bodySmall" style={{color: colors.muted}}>
              {formatDateTime(bill.billTime)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
}
