import React from 'react';
import {Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import BillForm from '@/components/bill/BillForm';
import {RootStackParamList} from '@/navigation/types';
import {createBill} from '@/api/bill';
import {useAppStore} from '@/store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'BillAdd'>;

export default function BillAddScreen({navigation}: Props): React.JSX.Element {
  const getCategories = useAppStore(state => state.getCategories);

  return (
    <BillForm
      categories={getCategories}
      submitLabel="保存账单"
      onSubmit={async payload => {
        try {
          await createBill(payload);
          navigation.goBack();
        } catch (error: any) {
          Alert.alert('保存失败', error.message ?? '请稍后重试');
        }
      }}
    />
  );
}
