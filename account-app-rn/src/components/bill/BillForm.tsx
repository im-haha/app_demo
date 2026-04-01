import React, {useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import {Menu, SegmentedButtons, Text} from 'react-native-paper';
import dayjs from 'dayjs';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import BillTypeSwitch from './BillTypeSwitch';
import CategorySelector from './CategorySelector';
import {BillInput, BillType, Category} from '@/types/bill';
import {accountTypeOptions} from '@/utils/constants';

interface Props {
  initialValue?: BillInput;
  categories: (type: BillType) => Category[];
  onSubmit: (payload: BillInput) => void;
  submitLabel: string;
}

export default function BillForm({
  initialValue,
  categories,
  onSubmit,
  submitLabel,
}: Props): React.JSX.Element {
  const [type, setType] = useState<BillType>(initialValue?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(initialValue ? String(initialValue.amount) : '');
  const [categoryId, setCategoryId] = useState<number | null>(initialValue?.categoryId ?? null);
  const [accountType, setAccountType] = useState(initialValue?.accountType ?? 'WECHAT');
  const [billTime, setBillTime] = useState(
    initialValue?.billTime ?? dayjs().format('YYYY-MM-DD HH:mm:ss'),
  );
  const [remark, setRemark] = useState(initialValue?.remark ?? '');
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);

  const categoryOptions = categories(type);
  const selectedCategoryId = categoryId ?? categoryOptions[0]?.id ?? null;

  function handleSubmit() {
    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('提示', '请输入大于 0 的金额');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('提示', '请选择分类');
      return;
    }

    if (!dayjs(billTime).isValid()) {
      Alert.alert('提示', '请输入有效的时间，格式如 2026-04-01 09:30:00');
      return;
    }

    onSubmit({
      type,
      amount: parsedAmount,
      categoryId: selectedCategoryId,
      accountType,
      billTime: dayjs(billTime).format('YYYY-MM-DD HH:mm:ss'),
      remark: remark.trim(),
    });
  }

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 18}}>
      <BillTypeSwitch
        value={type}
        onChange={next => {
          setType(next);
          setCategoryId(categories(next)[0]?.id ?? null);
        }}
      />

      <CategorySelector
        categories={categoryOptions}
        selectedId={selectedCategoryId}
        onChange={setCategoryId}
      />

      <AppInput
        label="金额"
        value={amount}
        onChangeText={setAmount}
        placeholder="例如 35.50"
        keyboardType="numeric"
      />

      <View style={{gap: 8}}>
        <Text variant="titleSmall">账户</Text>
        <Menu
          visible={accountMenuVisible}
          onDismiss={() => setAccountMenuVisible(false)}
          anchor={
            <SegmentedButtons
              value={accountType}
              onValueChange={() => setAccountMenuVisible(true)}
              buttons={[
                {
                  value: accountType,
                  label: accountTypeOptions.find(item => item.value === accountType)?.label ?? '选择账户',
                },
              ]}
            />
          }>
          {accountTypeOptions.map(item => (
            <Menu.Item
              key={item.value}
              title={item.label}
              onPress={() => {
                setAccountType(item.value);
                setAccountMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      <AppInput
        label="记账时间"
        value={billTime}
        onChangeText={setBillTime}
        placeholder="YYYY-MM-DD HH:mm:ss"
      />
      <AppInput
        label="备注"
        value={remark}
        onChangeText={setRemark}
        placeholder="例如：早餐、打车、发工资"
        multiline
      />
      <AppButton onPress={handleSubmit}>{submitLabel}</AppButton>
    </ScrollView>
  );
}
