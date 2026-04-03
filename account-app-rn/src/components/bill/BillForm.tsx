import React, {useCallback, useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, View} from 'react-native';
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

type CategoryMemory = Record<BillType, number | null>;

function sanitizeAmountInput(input: string): string {
  const normalized = input.replace(/[^\d.]/g, '');
  const [integerPart = '', decimalRaw = ''] = normalized.split('.');
  const decimalPart = decimalRaw.slice(0, 2);
  if (normalized.includes('.')) {
    return `${integerPart}.${decimalPart}`;
  }
  return integerPart;
}

function isValidDate(dateText: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return false;
  }
  return dayjs(dateText).format('YYYY-MM-DD') === dateText;
}

function isValidClock(clockText: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(clockText);
}

export default function BillForm({
  initialValue,
  categories,
  onSubmit,
  submitLabel,
}: Props): React.JSX.Element {
  const initialDate = dayjs(initialValue?.billTime || undefined);
  const [type, setType] = useState<BillType>(initialValue?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(initialValue ? String(initialValue.amount) : '');
  const [categoryId, setCategoryId] = useState<number | null>(initialValue?.categoryId ?? null);
  const [accountType, setAccountType] = useState(initialValue?.accountType ?? 'WECHAT');
  const [billDate, setBillDate] = useState(
    initialDate.isValid() ? initialDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
  );
  const [billClock, setBillClock] = useState(
    initialDate.isValid() ? initialDate.format('HH:mm') : dayjs().format('HH:mm'),
  );
  const [remark, setRemark] = useState(initialValue?.remark ?? '');
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [recentCategoryByType, setRecentCategoryByType] = useState<CategoryMemory>({
    INCOME:
      initialValue?.type === 'INCOME'
        ? initialValue.categoryId
        : null,
    EXPENSE:
      initialValue?.type === 'EXPENSE'
        ? initialValue.categoryId
        : null,
  });

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
      const nextOptions = categories(next);
      const recentCategoryId = recentCategoryByType[next];
      const resolvedCategoryId = nextOptions.some(item => item.id === recentCategoryId)
        ? recentCategoryId
        : nextOptions[0]?.id ?? null;
      setCategoryId(resolvedCategoryId);
    },
    [categories, recentCategoryByType],
  );

  const handleCategoryChange = useCallback(
    (nextCategoryId: number | null) => {
      setCategoryId(nextCategoryId);
      setRecentCategoryByType(current => ({
        ...current,
        [type]: nextCategoryId,
      }));
    },
    [type],
  );

  const fillNow = useCallback(() => {
    const now = dayjs();
    setBillDate(now.format('YYYY-MM-DD'));
    setBillClock(now.format('HH:mm'));
  }, []);

  const fillYesterday = useCallback(() => {
    const yesterday = dayjs().subtract(1, 'day');
    setBillDate(yesterday.format('YYYY-MM-DD'));
    setBillClock(yesterday.format('HH:mm'));
  }, []);

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

    const dateText = billDate.trim();
    const clockText = billClock.trim();

    if (!isValidDate(dateText)) {
      Alert.alert('提示', '请输入有效日期，格式如 2026-04-01');
      return;
    }

    if (!isValidClock(clockText)) {
      Alert.alert('提示', '请输入有效时间，格式如 09:30');
      return;
    }

    const dateTimeText = `${dateText} ${clockText}:00`;
    if (dayjs(dateTimeText).format('YYYY-MM-DD HH:mm:ss') !== dateTimeText) {
      Alert.alert('提示', '记账时间不合法');
      return;
    }

    onSubmit({
      type,
      amount: Number(parsedAmount.toFixed(2)),
      categoryId: selectedCategoryId,
      accountType,
      billTime: dateTimeText,
      remark: remark.trim(),
      source: initialValue?.source ?? 'MANUAL',
      accountId: initialValue?.accountId ?? null,
      merchant: initialValue?.merchant,
      tagNames: initialValue?.tagNames,
      isTransfer: initialValue?.isTransfer,
      transferTargetAccountId: initialValue?.transferTargetAccountId,
    });
  }, [
    accountType,
    amount,
    billClock,
    billDate,
    initialValue?.accountId,
    initialValue?.isTransfer,
    initialValue?.merchant,
    initialValue?.source,
    initialValue?.tagNames,
    initialValue?.transferTargetAccountId,
    onSubmit,
    remark,
    selectedCategoryId,
    type,
  ]);

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 18}}>
      <BillTypeSwitch value={type} onChange={handleTypeChange} />

      <CategorySelector
        categories={categoryOptions}
        selectedId={selectedCategoryId}
        onChange={handleCategoryChange}
      />

      <AppInput
        label="金额"
        value={amount}
        onChangeText={value => setAmount(sanitizeAmountInput(value))}
        placeholder="例如 35.50"
        keyboardType="decimal-pad"
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

      <View style={{gap: 8}}>
        <Text variant="titleSmall">记账时间</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          <Pressable
            onPress={fillNow}
            style={{
              paddingHorizontal: 12,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              backgroundColor: 'rgba(94,122,151,0.15)',
            }}>
            <Text variant="labelMedium">现在</Text>
          </Pressable>
          <Pressable
            onPress={fillYesterday}
            style={{
              paddingHorizontal: 12,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              backgroundColor: 'rgba(94,122,151,0.15)',
            }}>
            <Text variant="labelMedium">昨天同一时间</Text>
          </Pressable>
        </View>
        <View style={{flexDirection: 'row', gap: 10}}>
          <View style={{flex: 1}}>
            <AppInput
              label="日期"
              value={billDate}
              onChangeText={setBillDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={{flex: 1}}>
            <AppInput
              label="时间"
              value={billClock}
              onChangeText={setBillClock}
              placeholder="HH:mm"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
      </View>
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
