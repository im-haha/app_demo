import React, {useCallback, useMemo, useState} from 'react';
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

  const categoryOptions = useMemo(() => categories(type), [categories, type]);
  const selectedCategoryId = categoryId ?? categoryOptions[0]?.id ?? null;
  const accountLabel =
    accountTypeOptions.find(item => item.value === accountType)?.label ?? '选择账户';
  const accountButtons = useMemo(
    () => [
      {
        value: accountType,
        label: accountLabel,
      },
    ],
    [accountLabel, accountType],
  );
  const openAccountMenu = useCallback(() => setAccountMenuVisible(true), []);
  const closeAccountMenu = useCallback(() => setAccountMenuVisible(false), []);
  const handleAccountTypeSelect = useCallback((nextAccountType: string) => {
    setAccountType(nextAccountType as typeof accountType);
    setAccountMenuVisible(false);
  }, []);

  const handleTypeChange = useCallback(
    (next: BillType) => {
      setType(next);
      setCategoryId(categories(next)[0]?.id ?? null);
    },
    [categories],
  );

  const handleSubmit = useCallback(() => {
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
  }, [accountType, amount, billTime, onSubmit, remark, selectedCategoryId, type]);

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 18}}>
      <BillTypeSwitch value={type} onChange={handleTypeChange} />

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
          onDismiss={closeAccountMenu}
          anchor={
            <SegmentedButtons
              value={accountType}
              onValueChange={openAccountMenu}
              buttons={accountButtons}
            />
          }>
          {accountTypeOptions.map(item => (
            <Menu.Item
              key={item.value}
              title={item.label}
              onPress={() => handleAccountTypeSelect(item.value)}
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
