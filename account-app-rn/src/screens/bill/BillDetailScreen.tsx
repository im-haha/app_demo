import React, {useMemo} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button, Card, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import EmptyState from '@/components/common/EmptyState';
import {RootStackParamList} from '@/navigation/types';
import {useAppStore} from '@/store/appStore';
import {useThemeColors} from '@/theme';
import {formatCurrency, formatDateLabel} from '@/utils/format';
import {deleteBill} from '@/api/bill';
import {accountTypeOptions} from '@/utils/constants';
import BillCategoryIcon from '@/components/bill/BillCategoryIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'BillDetail'>;

export default function BillDetailScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const bills = useAppStore(state => state.bills);
  const currentUserId = useAppStore(state => state.currentUserId);
  const categories = useAppStore(state => state.categories);
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
    return (
      <EmptyState title="账单不存在" description="这条账单可能已经被删除。" />
    );
  }

  const billId = bill.id;
  const amountColor = bill.type === 'INCOME' ? colors.income : colors.expense;

  function handleDelete() {
    Alert.alert('删除账单', '删除后不可恢复，是否继续？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteBill(billId);
          navigation.goBack();
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
        <Card
          mode="contained"
          style={{backgroundColor: colors.surface, borderRadius: 28}}>
          <Card.Content style={{gap: 18}}>
            <View style={{alignItems: 'center', gap: 10}}>
              <BillCategoryIcon
                categoryName={currentCategory?.name}
                categoryIcon={currentCategory?.icon}
                size={72}
                iconSize={34}
              />
              <Text
                variant="headlineSmall"
                style={{fontWeight: '800', color: amountColor}}>
                {bill.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(bill.amount)}
              </Text>
              <Text variant="titleMedium">
                {currentCategory?.name ?? '未分类'}
              </Text>
            </View>
            <View style={{gap: 12}}>
              <Text>
                账户：
                {
                  accountTypeOptions.find(item => item.value === bill.accountType)
                    ?.label
                }
              </Text>
              <Text>
                时间：{formatDateLabel(bill.billTime)}{' '}
                {bill.billTime.slice(11, 16)}
              </Text>
              <Text>备注：{bill.remark || '无备注'}</Text>
              <Text>创建时间：{bill.createdAt}</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={{flexDirection: 'row', gap: 12}}>
          <Button
            mode="contained-tonal"
            style={{flex: 1}}
            onPress={() => navigation.navigate('BillEdit', {billId})}>
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
