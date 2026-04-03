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
  sourceAccountName?: string;
  transferTargetAccountName?: string;
  accountPerspectiveAccountId?: number;
  onPress?: () => void;
}

export default function BillCard({
  bill,
  category,
  sourceAccountName,
  transferTargetAccountName,
  accountPerspectiveAccountId,
  onPress,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const isTransfer = Boolean(bill.isTransfer);
  const isTransferInPerspective =
    isTransfer &&
    accountPerspectiveAccountId !== undefined &&
    bill.transferTargetAccountId === accountPerspectiveAccountId;
  const amountColor =
    isTransfer
      ? isTransferInPerspective
        ? colors.income
        : colors.expense
      : bill.type === 'INCOME'
        ? colors.income
        : colors.expense;
  const subTextColor = isDark ? '#A8B7B3' : colors.muted;
  const timeTextColor = isDark ? '#97A9A4' : colors.muted;
  const sourceName = sourceAccountName ?? '转出账户';
  const targetName = transferTargetAccountName ?? '转入账户';
  const title = isTransfer ? '账户转账' : category?.name ?? '未分类';
  const transferDirectionLabel = isTransfer
    ? isTransferInPerspective
      ? '转入'
      : '转出'
    : '';
  const subtitle = isTransfer ? `${sourceName} → ${targetName}` : bill.remark || '无备注';
  const amountPrefix = isTransfer
    ? isTransferInPerspective
      ? '+'
      : '-'
    : bill.type === 'INCOME'
      ? '+'
      : '-';

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
            categoryName={isTransfer ? '转账' : category?.name}
            categoryIcon={isTransfer ? 'bank-transfer' : category?.icon}
            size={46}
            iconSize={20}
          />
          <View style={{flex: 1, gap: 4}}>
            <Text variant="titleMedium" style={{color: colors.text, fontWeight: '700'}}>
              {title}
            </Text>
            {isTransfer ? (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Text
                  variant="labelSmall"
                  style={{
                    color: isTransferInPerspective ? colors.income : colors.expense,
                    fontWeight: '700',
                  }}>
                  {transferDirectionLabel}
                </Text>
                <Text variant="bodyMedium" style={{color: subTextColor, flexShrink: 1}}>
                  {subtitle}
                </Text>
              </View>
            ) : (
              <Text variant="bodyMedium" style={{color: subTextColor}}>
                {subtitle}
              </Text>
            )}
          </View>
          <View style={{alignItems: 'flex-end', gap: 4}}>
            <Text
              variant="titleMedium"
              style={{color: amountColor, fontWeight: '800'}}>
              {amountPrefix}
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
