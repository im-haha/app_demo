import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, View} from 'react-native';
import {Menu, SegmentedButtons, Text} from 'react-native-paper';
import dayjs from 'dayjs';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import DateTimePickerField from '@/components/common/DateTimePickerField';
import DateTimePickerModal, {
  DateTimePickerMode,
} from '@/components/common/DateTimePickerModal';
import BillTypeSwitch from './BillTypeSwitch';
import CategorySelector from './CategorySelector';
import {Account, BillInput, BillType, Category} from '@/types/bill';
import {accountTypeOptions} from '@/utils/constants';

interface Props {
  initialValue?: BillInput;
  categories: (type: BillType) => Category[];
  accounts: () => Account[];
  onSubmit: (payload: BillInput) => void;
  submitLabel: string;
  loading?: boolean;
  submitDisabled?: boolean;
}

type CategoryMemory = Record<BillType, number | null>;
type BillMode = 'NORMAL' | 'TRANSFER';

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

function normalizeTagNames(input: string): string[] {
  const normalized = input
    .split(/[,，]/)
    .map(item => item.trim())
    .filter(Boolean);
  const deduplicated: string[] = [];
  const seen = new Set<string>();
  normalized.forEach(item => {
    const key = item.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    deduplicated.push(item);
  });
  return deduplicated.slice(0, 8);
}

export default function BillForm({
  initialValue,
  categories,
  accounts,
  onSubmit,
  submitLabel,
  loading = false,
  submitDisabled = false,
}: Props): React.JSX.Element {
  const initialDate = dayjs(initialValue?.billTime || undefined);
  const [billMode, setBillMode] = useState<BillMode>(
    initialValue?.isTransfer ? 'TRANSFER' : 'NORMAL',
  );
  const [type, setType] = useState<BillType>(initialValue?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(initialValue ? String(initialValue.amount) : '');
  const [categoryId, setCategoryId] = useState<number | null>(initialValue?.categoryId ?? null);
  const [accountId, setAccountId] = useState<number | null>(initialValue?.accountId ?? null);
  const [transferTargetAccountId, setTransferTargetAccountId] = useState<number | null>(
    initialValue?.transferTargetAccountId ?? null,
  );
  const [billDate, setBillDate] = useState(
    initialDate.isValid() ? initialDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
  );
  const [billClock, setBillClock] = useState(
    initialDate.isValid() ? initialDate.format('HH:mm') : dayjs().format('HH:mm'),
  );
  const [remark, setRemark] = useState(initialValue?.remark ?? '');
  const [merchant, setMerchant] = useState(initialValue?.merchant ?? '');
  const [tagInput, setTagInput] = useState(
    initialValue?.tagNames?.join(', ') ?? '',
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<DateTimePickerMode>('date');
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [transferMenuVisible, setTransferMenuVisible] = useState(false);
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
  const accountOptions = accounts();
  const selectedCategoryId = categoryId ?? categoryOptions[0]?.id ?? null;
  const transferFallbackCategoryId = useMemo(() => {
    const expenseCategories = categories('EXPENSE');
    const recentExpenseCategoryId = recentCategoryByType.EXPENSE;
    if (expenseCategories.some(item => item.id === recentExpenseCategoryId)) {
      return recentExpenseCategoryId;
    }
    return expenseCategories[0]?.id ?? selectedCategoryId;
  }, [categories, recentCategoryByType.EXPENSE, selectedCategoryId]);
  const selectedAccount = useMemo(
    () =>
      accountOptions.find(account => account.id === accountId) ??
      (initialValue?.accountType
        ? accountOptions.find(account => account.type === initialValue.accountType)
        : undefined) ??
      accountOptions[0],
    [accountId, accountOptions, initialValue?.accountType],
  );
  const accountLabel = selectedAccount?.name ?? '请选择账户';
  const accountButtons = useMemo(
    () => [
      {
        value: selectedAccount ? String(selectedAccount.id) : 'UNSET',
        label: accountLabel,
      },
    ],
    [accountLabel, selectedAccount],
  );
  const openAccountMenu = useCallback(() => setAccountMenuVisible(true), []);
  const closeAccountMenu = useCallback(() => setAccountMenuVisible(false), []);
  const handleAccountSelect = useCallback((nextAccountId: number) => {
    setAccountId(nextAccountId);
    setAccountMenuVisible(false);
  }, []);
  const transferTargetOptions = useMemo(
    () =>
      selectedAccount
        ? accountOptions.filter(account => account.id !== selectedAccount.id)
        : accountOptions,
    [accountOptions, selectedAccount],
  );
  const selectedTransferTarget = useMemo(
    () =>
      transferTargetOptions.find(account => account.id === transferTargetAccountId) ??
      transferTargetOptions[0],
    [transferTargetAccountId, transferTargetOptions],
  );
  const transferTargetLabel = selectedTransferTarget?.name ?? '请选择转入账户';
  const transferButtons = useMemo(
    () => [
      {
        value: selectedTransferTarget ? String(selectedTransferTarget.id) : 'UNSET',
        label: transferTargetLabel,
      },
    ],
    [selectedTransferTarget, transferTargetLabel],
  );
  const openTransferMenu = useCallback(() => setTransferMenuVisible(true), []);
  const closeTransferMenu = useCallback(() => setTransferMenuVisible(false), []);
  const handleTransferTargetSelect = useCallback((nextTargetAccountId: number) => {
    setTransferTargetAccountId(nextTargetAccountId);
    setTransferMenuVisible(false);
  }, []);

  useEffect(() => {
    if (selectedAccount && selectedAccount.id !== accountId) {
      setAccountId(selectedAccount.id);
    }
  }, [accountId, selectedAccount]);

  useEffect(() => {
    if (billMode !== 'TRANSFER') {
      return;
    }
    if (selectedTransferTarget && selectedTransferTarget.id !== transferTargetAccountId) {
      setTransferTargetAccountId(selectedTransferTarget.id);
    }
  }, [billMode, selectedTransferTarget, transferTargetAccountId]);

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

  useEffect(() => {
    if (billMode !== 'TRANSFER') {
      return;
    }
    if (type !== 'EXPENSE') {
      handleTypeChange('EXPENSE');
    }
  }, [billMode, handleTypeChange, type]);

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

  const pickerInitialValue = useMemo(() => {
    const dateTimeText = `${billDate.trim()} ${billClock.trim()}:00`;
    const parsed = dayjs(dateTimeText);
    if (parsed.format('YYYY-MM-DD HH:mm:ss') === dateTimeText) {
      return parsed.toDate();
    }
    return dayjs().second(0).toDate();
  }, [billClock, billDate]);

  const openDatePicker = useCallback(() => {
    setPickerMode('date');
    setPickerVisible(true);
  }, []);

  const openTimePicker = useCallback(() => {
    setPickerMode('time');
    setPickerVisible(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const handlePickerConfirm = useCallback(
    (value: Date) => {
      const next = dayjs(value);
      if (pickerMode === 'date') {
        setBillDate(next.format('YYYY-MM-DD'));
      } else {
        setBillClock(next.format('HH:mm'));
      }
      setPickerVisible(false);
    },
    [pickerMode],
  );

  const handleSubmit = useCallback(() => {
    const parsedAmount = Number(amount);
    const resolvedCategoryId =
      billMode === 'TRANSFER'
        ? selectedCategoryId ?? transferFallbackCategoryId
        : selectedCategoryId;

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('提示', '请输入大于 0 的金额');
      return;
    }

    if (!resolvedCategoryId) {
      Alert.alert('提示', billMode === 'TRANSFER' ? '请先创建支出分类' : '请选择分类');
      return;
    }
    if (billMode === 'NORMAL' && !selectedCategoryId) {
      Alert.alert('提示', '请选择分类');
      return;
    }
    if (!selectedAccount) {
      Alert.alert('提示', '请先创建并选择账户');
      return;
    }
    if (billMode === 'TRANSFER') {
      if (accountOptions.length < 2) {
        Alert.alert('提示', '至少需要两个可用账户才能转账');
        return;
      }
      if (!selectedTransferTarget) {
        Alert.alert('提示', '请选择转入账户');
        return;
      }
      if (selectedTransferTarget.id === selectedAccount.id) {
        Alert.alert('提示', '转出与转入账户不能相同');
        return;
      }
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
      type: billMode === 'TRANSFER' ? 'EXPENSE' : type,
      amount: Number(parsedAmount.toFixed(2)),
      categoryId: resolvedCategoryId,
      accountType: selectedAccount.type,
      billTime: dateTimeText,
      remark: remark.trim(),
      source: initialValue?.source ?? 'MANUAL',
      accountId: selectedAccount.id,
      merchant: billMode === 'NORMAL' ? merchant.trim() || undefined : undefined,
      tagNames: billMode === 'NORMAL' ? normalizeTagNames(tagInput) : undefined,
      isTransfer: billMode === 'TRANSFER',
      transferTargetAccountId: billMode === 'TRANSFER' ? selectedTransferTarget?.id ?? null : null,
    });
  }, [
    accountOptions.length,
    amount,
    billClock,
    billDate,
    billMode,
    initialValue?.source,
    merchant,
    onSubmit,
    remark,
    selectedAccount,
    selectedCategoryId,
    selectedTransferTarget,
    tagInput,
    transferFallbackCategoryId,
    type,
  ]);

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 18}}>
      <View style={{gap: 8}}>
        <Text variant="titleSmall">记账模式</Text>
        <SegmentedButtons
          value={billMode}
          onValueChange={value => setBillMode(value as BillMode)}
          buttons={[
            {
              value: 'NORMAL',
              label: '普通记账',
            },
            {
              value: 'TRANSFER',
              label: '账户转账',
            },
          ]}
        />
        {billMode === 'TRANSFER' ? (
          <View style={{gap: 2}}>
            <Text variant="bodySmall" style={{opacity: 0.72}}>
              转账默认不计入统计收支，可在统计页手动切换计入口径。
            </Text>
            <Text variant="bodySmall" style={{opacity: 0.72}}>
              转账不会计入普通收入/支出分类。
            </Text>
          </View>
        ) : null}
      </View>

      {billMode === 'NORMAL' ? <BillTypeSwitch value={type} onChange={handleTypeChange} /> : null}
      {billMode === 'NORMAL' ? (
        <CategorySelector
          categories={categoryOptions}
          selectedId={selectedCategoryId}
          onChange={handleCategoryChange}
        />
      ) : null}

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
              value={selectedAccount ? String(selectedAccount.id) : 'UNSET'}
              onValueChange={openAccountMenu}
              buttons={accountButtons}
            />
          }>
          {accountOptions.map(item => (
            <Menu.Item
              key={item.id}
              title={`${item.name} · ${
                accountTypeOptions.find(option => option.value === item.type)?.label ?? item.type
              }`}
              onPress={() => handleAccountSelect(item.id)}
            />
          ))}
        </Menu>
      </View>

      {billMode === 'TRANSFER' ? (
        <View style={{gap: 8}}>
          <Text variant="titleSmall">转入账户</Text>
          <Menu
            visible={transferMenuVisible}
            onDismiss={closeTransferMenu}
            anchor={
              <SegmentedButtons
                value={selectedTransferTarget ? String(selectedTransferTarget.id) : 'UNSET'}
                onValueChange={openTransferMenu}
                buttons={transferButtons}
              />
            }>
            {transferTargetOptions.map(item => (
              <Menu.Item
                key={item.id}
                title={`${item.name} · ${
                  accountTypeOptions.find(option => option.value === item.type)?.label ?? item.type
                }`}
                onPress={() => handleTransferTargetSelect(item.id)}
              />
            ))}
          </Menu>
        </View>
      ) : null}

      {billMode === 'NORMAL' ? (
        <View style={{gap: 8}}>
          <AppInput
            label="商户（可选）"
            value={merchant}
            onChangeText={value => setMerchant(value.slice(0, 32))}
            placeholder="例如：瑞幸咖啡 / 京东 / 滴滴出行"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <AppInput
            label="标签（可选）"
            value={tagInput}
            onChangeText={value => setTagInput(value.slice(0, 80))}
            placeholder="例如：工作餐, 通勤, 报销"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text variant="bodySmall" style={{opacity: 0.72}}>
            多个标签请用英文逗号分隔，最多保留 8 个标签。
          </Text>
        </View>
      ) : null}

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
            <DateTimePickerField
              label="日期"
              value={billDate}
              placeholder="请选择日期"
              onPress={openDatePicker}
              disabled={loading}
            />
          </View>
          <View style={{flex: 1}}>
            <DateTimePickerField
              label="时间"
              value={billClock}
              placeholder="请选择时间"
              onPress={openTimePicker}
              disabled={loading}
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
      <AppButton
        onPress={handleSubmit}
        loading={loading}
        disabled={loading || submitDisabled}>
        {submitLabel}
      </AppButton>
      <DateTimePickerModal
        visible={pickerVisible}
        mode={pickerMode}
        initialValue={pickerInitialValue}
        onCancel={closePicker}
        onConfirm={handlePickerConfirm}
      />
    </ScrollView>
  );
}
