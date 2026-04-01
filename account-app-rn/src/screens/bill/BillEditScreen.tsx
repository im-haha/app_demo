import React from 'react';
import {Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import BillForm from '@/components/bill/BillForm';
import EmptyState from '@/components/common/EmptyState';
import {RootStackParamList} from '@/navigation/types';
import {useAppStore} from '@/store/appStore';
import {updateBill} from '@/api/bill';

type Props = NativeStackScreenProps<RootStackParamList, 'BillEdit'>;

export default function BillEditScreen({navigation, route}: Props): React.JSX.Element {
  const bill = useAppStore(state => state.getBillById(route.params.billId));
  const getCategories = useAppStore(state => state.getCategories);

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
        billTime: bill.billTime,
        remark: bill.remark,
      }}
      categories={getCategories}
      submitLabel="保存修改"
      onSubmit={async payload => {
        try {
          await updateBill(route.params.billId, payload);
          navigation.replace('BillDetail', {billId: route.params.billId});
        } catch (error: any) {
          Alert.alert('更新失败', error.message ?? '请稍后重试');
        }
      }}
    />
  );
}
