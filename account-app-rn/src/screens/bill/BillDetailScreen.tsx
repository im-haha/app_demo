import React, {useCallback, useMemo} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button, Card, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import EmptyState from '@/components/common/EmptyState';
import {RootStackParamList} from '@/navigation/types';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {useThemeColors} from '@/theme';
import {formatCurrency, formatDateLabel} from '@/utils/format';
import {deleteBill} from '@/api/bill';
import {accountTypeOptions} from '@/utils/constants';
import BillCategoryIcon from '@/components/bill/BillCategoryIcon';
import {Account, AccountType, BillRecord} from '@/types/bill';

type Props = NativeStackScreenProps<RootStackParamList, 'BillDetail'>;

function formatBillSourceLabel(source?: BillRecord['source']): string {
  if (source === 'IMPORT') {
    return '文件导入';
  }
  if (source === 'RECURRING') {
    return '周期生成';
  }
  return '手动录入';
}

function resolveAccountDisplayName(
  accounts: Account[],
  currentUserId: number | null,
  accountId?: number | null,
  fallbackAccountType?: AccountType,
): string {
  const matchedAccount =
    accountId !== null && accountId !== undefined
      ? accounts.find(account => account.id === accountId && account.userId === currentUserId)
      : undefined;
  if (matchedAccount) {
    return matchedAccount.name;
  }
  if (!fallbackAccountType) {
    return '未找到账户';
  }
  return (
    accountTypeOptions.find(item => item.value === fallbackAccountType)?.label ?? fallbackAccountType
  );
}

export default function BillDetailScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const bills = useAppStore(state => state.bills);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const categories = useAppStore(state => state.categories);
  const accounts = useAppStore(state => state.accounts);
  const bill = useMemo(
    () =>
      bills.find(
        item =>
          item.id === route.params.billId &&
          item.userId === currentUserId &&
          !item.deleted,
      ),
    [bills, currentUserId, route.params.billId],
  );

  const currentCategory = categories.find(item => item.id === bill?.categoryId);

  if (!bill) {
    return <EmptyState title="账单不存在" description="这条账单可能已经被删除。" />;
  }

  const isTransfer = Boolean(bill.isTransfer);
  const billId = bill.id;
  const sourceLabel = formatBillSourceLabel(bill.source);
  const amountColor = isTransfer
    ? colors.primary
    : bill.type === 'INCOME'
      ? colors.income
      : colors.expense;
  const sourceAccountName = resolveAccountDisplayName(
    accounts,
    currentUserId,
    bill.accountId,
    bill.accountType,
  );
  const transferTargetAccountName = resolveAccountDisplayName(
    accounts,
    currentUserId,
    bill.transferTargetAccountId,
  );

  const handleEdit = useCallback(() => {
    try {
      navigation.push('BillEdit', {billId});
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '请稍后重试';
      Alert.alert('无法打开编辑页', message);
    }
  }, [billId, navigation]);

  function handleDelete() {
    Alert.alert('删除账单', '删除后不可恢复，是否继续？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(billId);
            navigation.goBack();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '请稍后重试';
            Alert.alert('删除失败', message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['bottom']}>
      <ScrollView
        bounces={false}
        style={{flex: 1, backgroundColor: colors.background}}
        contentContainerStyle={{padding: 20, gap: 16, paddingBottom: 24}}>
        <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
          <Card.Content style={{gap: 18}}>
            <View style={{alignItems: 'center', gap: 10}}>
              <BillCategoryIcon
                categoryName={isTransfer ? '转账' : currentCategory?.name}
                categoryIcon={isTransfer ? 'bank-transfer' : currentCategory?.icon}
                size={72}
                iconSize={34}
              />
              <Text variant="headlineSmall" style={{fontWeight: '800', color: amountColor}}>
                {isTransfer ? '' : bill.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(bill.amount)}
              </Text>
              <Text variant="titleMedium">
                {isTransfer ? '账户转账' : currentCategory?.name ?? '未分类'}
              </Text>
            </View>

            <View style={{gap: 10}}>
              {isTransfer ? (
                <>
                  <Text>转出账户：{sourceAccountName}</Text>
                  <Text>转入账户：{transferTargetAccountName}</Text>
                  <Text>
                    时间：{formatDateLabel(bill.billTime)} {bill.billTime.slice(11, 16)}
                  </Text>
                  <Text>备注：{bill.remark || '无备注'}</Text>
                  <Text style={{color: colors.muted}}>口径：默认不计入统计收支</Text>
                </>
              ) : (
                <>
                  <Text>账户：{sourceAccountName}</Text>
                  <Text>
                    时间：{formatDateLabel(bill.billTime)} {bill.billTime.slice(11, 16)}
                  </Text>
                  <Text>备注：{bill.remark || '无备注'}</Text>
                  {bill.merchant ? <Text>商户：{bill.merchant}</Text> : null}
                </>
              )}
            </View>

            <View style={{gap: 8}}>
              {bill.tagNames && bill.tagNames.length > 0 ? (
                <Text>标签：{bill.tagNames.join(' / ')}</Text>
              ) : null}
              <Text>来源：{sourceLabel}</Text>
              <Text>创建时间：{bill.createdAt}</Text>
              <Text>更新时间：{bill.updatedAt}</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={{flexDirection: 'row', gap: 12}}>
          <Button
            mode="contained"
            buttonColor={colors.primary}
            textColor="#FFFFFF"
            style={{flex: 1}}
            onPress={handleEdit}>
            编辑
          </Button>
          <Button
            mode="contained"
            buttonColor={colors.danger}
            textColor="#FFFFFF"
            style={{flex: 1}}
            onPress={handleDelete}>
            删除
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
