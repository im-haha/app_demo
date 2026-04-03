import React, {useMemo, useState} from 'react';
import {Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import BillForm from '@/components/bill/BillForm';
import EmptyState from '@/components/common/EmptyState';
import {RootStackParamList} from '@/navigation/types';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {updateBill} from '@/api/bill';

type Props = NativeStackScreenProps<RootStackParamList, 'BillEdit'>;

export default function BillEditScreen({navigation, route}: Props): React.JSX.Element {
  const bills = useAppStore(state => state.bills);
  const currentUserId = useAuthStore(state => state.currentUserId);
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
  const getCategories = useAppStore(state => state.getCategories);
  const getAccounts = useAppStore(state => state.getAccounts);
  const [submitting, setSubmitting] = useState(false);

  if (!bill) {
    return <EmptyState title="账单不存在" description="这条账单可能已经被删除。" />;
  }

  return (
    <BillForm
      initialValue={{
        type: bill.type,
        amount: bill.amount,
        categoryId: bill.categoryId,
        accountType: bill.accountType,
        accountId: bill.accountId ?? null,
        billTime: bill.billTime,
        remark: bill.remark,
        source: bill.source,
        merchant: bill.merchant,
        tagNames: bill.tagNames,
        isTransfer: bill.isTransfer,
        transferTargetAccountId: bill.transferTargetAccountId,
      }}
      categories={getCategories}
      accounts={getAccounts}
      submitLabel="保存修改"
      loading={submitting}
      submitDisabled={submitting}
      onSubmit={async payload => {
        if (submitting) {
          return;
        }
        setSubmitting(true);
        try {
          await updateBill(route.params.billId, payload);
          Alert.alert('修改成功', '账单已更新', [
            {
              text: '查看详情',
              onPress: () =>
                navigation.replace('BillDetail', {billId: route.params.billId}),
            },
          ]);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : '请稍后重试';
          Alert.alert('更新失败', message);
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}
