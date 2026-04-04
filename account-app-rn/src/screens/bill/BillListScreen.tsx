import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, Pressable, SectionList, TextInput, View} from 'react-native';
import dayjs from 'dayjs';
import {Text} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import BillCard from '@/components/bill/BillCard';
import SwipeableBillRow from '@/components/bill/SwipeableBillRow';
import EmptyState from '@/components/common/EmptyState';
import AppInput from '@/components/common/AppInput';
import SearchLineIcon from '@/components/common/icons/SearchLineIcon';
import PlusLineIcon from '@/components/common/icons/PlusLineIcon';
import DraggableFab from '@/components/common/DraggableFab';
import {
  AccountFilterMenu,
  CategoryFilterMenu,
  DateRangeFields,
  FilterSummaryChips,
  TimePresetBar,
} from '@/components/filters';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';
import {filterTypeOptions} from '@/utils/constants';
import {segmentedSwitchHaptic} from '@/utils/haptics';
import {useBillSections} from '@/store/selectors/billSelectors';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {formatCurrency} from '@/utils/format';
import {BillFilters, BillListSection} from '@/types/bill';
import {BillTimePreset, billTimePresetOptions, resolveTimeRange} from '@/utils/timeRange';
import {useMainTabNavigation} from '@/navigation/hooks';
import {deleteBill} from '@/api/bill';

function sanitizeAmountFilterInput(input: string): string {
  const normalized = input.replace(/[^\d.]/g, '');
  const [integerPart = '', decimalRaw = ''] = normalized.split('.');
  const decimalPart = decimalRaw.slice(0, 2);
  if (normalized.includes('.')) {
    return `${integerPart}.${decimalPart}`;
  }
  return integerPart;
}

function parseAmountFilterValue(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return Number(parsed.toFixed(2));
}

function useDebouncedText(value: string, delayMs = 220): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (!value) {
      setDebouncedValue('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debouncedValue;
}

export default function BillListScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const navigation = useMainTabNavigation<'Bills'>();
  const insets = useSafeAreaInsets();
  const fabBottom = 24 + Math.max(insets.bottom, 8);
  const listBottomPadding = fabBottom + 88;
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [timePreset, setTimePreset] = useState<BillTimePreset>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState(
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  );
  const [customEndDate, setCustomEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | 'ALL'>('ALL');
  const [merchantKeyword, setMerchantKeyword] = useState('');
  const [tagKeyword, setTagKeyword] = useState('');
  const [minAmountText, setMinAmountText] = useState('');
  const [maxAmountText, setMaxAmountText] = useState('');
  const [includeTransfers, setIncludeTransfers] = useState(true);
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [isAccountPerspectiveEnabled, setIsAccountPerspectiveEnabled] = useState(false);
  const [activeSwipeRowKey, setActiveSwipeRowKey] = useState<number | null>(null);
  const [filterSwitchWidth, setFilterSwitchWidth] = useState(0);
  const typeIndex = useMemo(
    () => filterTypeOptions.findIndex(item => item.value === type),
    [type],
  );
  const filterAnim = useRef(new Animated.Value(typeIndex < 0 ? 0 : typeIndex)).current;
  const categories = useAppStore(state => state.categories);
  const accounts = useAppStore(state => state.accounts);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const visibleCategories = useMemo(
    () =>
      categories
        .filter(category => category.userId === null || category.userId === currentUserId)
        .sort((left, right) => left.sortNum - right.sortNum),
    [categories, currentUserId],
  );
  const categoryMap = useMemo(() => {
    const map = new Map<number, (typeof categories)[number]>();
    categories.forEach(category => {
      map.set(category.id, category);
    });
    return map;
  }, [categories]);
  const accountNameMap = useMemo(() => {
    const map = new Map<number, string>();
    accounts
      .filter(account => account.userId === currentUserId)
      .forEach(account => {
        map.set(account.id, account.name);
      });
    return map;
  }, [accounts, currentUserId]);
  const visibleAccounts = useMemo(
    () =>
      accounts
        .filter(account => account.userId === currentUserId && !account.isArchived)
        .sort((left, right) => {
          if (left.sortNum !== right.sortNum) {
            return left.sortNum - right.sortNum;
          }
          return left.createdAt.localeCompare(right.createdAt);
        }),
    [accounts, currentUserId],
  );
  const timeRange = useMemo(
    () => resolveTimeRange(timePreset, customStartDate, customEndDate),
    [timePreset, customStartDate, customEndDate],
  );
  const debouncedMerchantKeyword = useDebouncedText(merchantKeyword);
  const debouncedTagKeyword = useDebouncedText(tagKeyword);
  const debouncedMinAmountText = useDebouncedText(minAmountText);
  const debouncedMaxAmountText = useDebouncedText(maxAmountText);
  const canUseAccountPerspective = selectedAccountId !== 'ALL';
  const minAmount = useMemo(
    () => parseAmountFilterValue(debouncedMinAmountText),
    [debouncedMinAmountText],
  );
  const maxAmount = useMemo(
    () => parseAmountFilterValue(debouncedMaxAmountText),
    [debouncedMaxAmountText],
  );
  const billFilters = useMemo<BillFilters>(
    () => ({
      type,
      keyword,
      categoryId: selectedCategoryId,
      merchantKeyword: debouncedMerchantKeyword.trim() || undefined,
      tagKeyword: debouncedTagKeyword.trim() || undefined,
      minAmount,
      maxAmount,
      includeTransfers,
      accountId:
        isAccountPerspectiveEnabled || selectedAccountId === 'ALL'
          ? undefined
          : selectedAccountId,
      accountPerspectiveAccountId:
        isAccountPerspectiveEnabled && selectedAccountId !== 'ALL'
          ? selectedAccountId
          : undefined,
      ...(timePreset === 'THIS_MONTH'
        ? {month: dayjs().format('YYYY-MM')}
        : {
            startDate: timeRange.startDate,
            endDate: timeRange.endDate,
          }),
    }),
    [
      type,
      keyword,
      selectedCategoryId,
      selectedAccountId,
      debouncedMerchantKeyword,
      debouncedTagKeyword,
      minAmount,
      maxAmount,
      includeTransfers,
      isAccountPerspectiveEnabled,
      timePreset,
      timeRange.endDate,
      timeRange.startDate,
    ],
  );
  const sections = useBillSections(billFilters);
  const indicatorWidth = Math.max((filterSwitchWidth - 4) / 3, 0);
  const indicatorTranslateX = filterAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [2, 2 + indicatorWidth, 2 + indicatorWidth * 2],
  });
  const hasSearchText = keywordInput.trim().length > 0;
  const selectedCategoryName =
    selectedCategoryId === null
      ? '全部分类'
      : visibleCategories.find(category => category.id === selectedCategoryId)?.name ??
        '全部分类';
  const selectedAccountName =
    selectedAccountId === 'ALL'
      ? '全部账户'
      : visibleAccounts.find(account => account.id === selectedAccountId)?.name ??
        '全部账户';
  const activeFilterSummary = useMemo(() => {
    const summaryParts = [timeRange.label];
    if (selectedCategoryId !== null) {
      summaryParts.push(selectedCategoryName);
    }
    if (selectedAccountId !== 'ALL') {
      summaryParts.push(selectedAccountName);
    }
    if (isAccountPerspectiveEnabled && selectedAccountId !== 'ALL') {
      summaryParts.push('账户视角: 转入/转出');
    }
    if (keyword.trim()) {
      summaryParts.push(`关键词: ${keyword.trim()}`);
    }
    if (debouncedMerchantKeyword.trim()) {
      summaryParts.push(`商户: ${debouncedMerchantKeyword.trim()}`);
    }
    if (debouncedTagKeyword.trim()) {
      summaryParts.push(`标签: ${debouncedTagKeyword.trim()}`);
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      summaryParts.push(
        `金额: ${formatCurrency(minAmount ?? 0)} ~ ${
          maxAmount !== undefined ? formatCurrency(maxAmount) : '不限'
        }`,
      );
    }
    if (!includeTransfers) {
      summaryParts.push('排除转账');
    }
    return summaryParts.join(' · ');
  }, [
    keyword,
    debouncedMerchantKeyword,
    debouncedTagKeyword,
    minAmount,
    maxAmount,
    includeTransfers,
    selectedAccountName,
    selectedAccountId,
    selectedCategoryId,
    selectedCategoryName,
    isAccountPerspectiveEnabled,
    timeRange.label,
  ]);

  useEffect(() => {
    Animated.spring(filterAnim, {
      toValue: typeIndex < 0 ? 0 : typeIndex,
      damping: 17,
      stiffness: 205,
      mass: 0.92,
      useNativeDriver: true,
    }).start();
  }, [filterAnim, typeIndex]);

  useEffect(() => {
    if (!keywordInput.trim()) {
      setKeyword('');
      return;
    }

    const timer = setTimeout(() => {
      setKeyword(keywordInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    if (!canUseAccountPerspective && isAccountPerspectiveEnabled) {
      setIsAccountPerspectiveEnabled(false);
    }
  }, [canUseAccountPerspective, isAccountPerspectiveEnabled]);

  function handleTypeChange(nextType: 'ALL' | 'INCOME' | 'EXPENSE'): void {
    if (nextType === type) {
      return;
    }
    segmentedSwitchHaptic();
    setType(nextType);
  }

  function handleClearSearch(): void {
    setKeywordInput('');
    setKeyword('');
  }

  function clearAllFilters(): void {
    setKeywordInput('');
    setKeyword('');
    setType('ALL');
    setTimePreset('THIS_MONTH');
    setCustomStartDate(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
    setCustomEndDate(dayjs().format('YYYY-MM-DD'));
    setSelectedCategoryId(null);
    setSelectedAccountId('ALL');
    setMerchantKeyword('');
    setTagKeyword('');
    setMinAmountText('');
    setMaxAmountText('');
    setIncludeTransfers(true);
    setAdvancedVisible(false);
    setIsAccountPerspectiveEnabled(false);
  }

  function handleAccountPerspectiveToggle(enabled: boolean): void {
    if (enabled && !canUseAccountPerspective) {
      return;
    }
    if (enabled === isAccountPerspectiveEnabled) {
      return;
    }
    segmentedSwitchHaptic();
    setIsAccountPerspectiveEnabled(enabled);
  }

  const handleDeleteBill = useCallback((billId: number) => {
    Alert.alert('删除账单', '删除后不可恢复，是否继续？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(billId);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '请稍后重试';
            Alert.alert('删除失败', message);
          }
        },
      },
    ]);
  }, []);

  function getFilterTextColor(itemType: 'ALL' | 'INCOME' | 'EXPENSE'): string {
    if (type !== itemType) {
      return colors.muted;
    }
    if (itemType === 'EXPENSE') {
      return isDark ? '#FFD8CB' : '#8A3E22';
    }
    if (itemType === 'INCOME') {
      return isDark ? '#CBF3E4' : '#216B4E';
    }
    return isDark ? '#EAF2F0' : '#1F4346';
  }

  function renderSectionHeader({
    section,
  }: {
    section: BillListSection;
  }): React.JSX.Element {
    return (
      <View
        style={{
          marginTop: 4,
          marginBottom: 8,
          paddingHorizontal: 4,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text variant="titleSmall" style={{fontWeight: '700', color: colors.text}}>
          {section.title}
        </Text>
        <Text variant="bodySmall" style={{color: colors.muted}}>
          收 {formatCurrency(section.dayIncome)} / 支 {formatCurrency(section.dayExpense)}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <View style={{flex: 1}}>
        <SectionList
          sections={sections}
          onScrollBeginDrag={() => setActiveSwipeRowKey(null)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          keyExtractor={item => String(item.id)}
          renderSectionHeader={renderSectionHeader}
          renderItem={({item}) => (
            <View style={{marginBottom: 10}}>
              <SwipeableBillRow
                rowKey={item.id}
                activeRowKey={activeSwipeRowKey}
                onRowOpen={setActiveSwipeRowKey}
                onRowClose={rowKey =>
                  setActiveSwipeRowKey(current =>
                    current === rowKey ? null : current,
                  )
                }
                onPress={() =>
                  navigation.navigate('BillDetail', {
                    billId: item.id,
                  })
                }
                onEdit={() =>
                  navigation.navigate('BillEdit', {
                    billId: item.id,
                  })
                }
                onDelete={() => handleDeleteBill(item.id)}>
                <BillCard
                  bill={item}
                  category={categoryMap.get(item.categoryId)}
                  sourceAccountName={item.accountId ? accountNameMap.get(item.accountId) : undefined}
                  transferTargetAccountName={
                    item.transferTargetAccountId
                      ? accountNameMap.get(item.transferTargetAccountId)
                      : undefined
                  }
                  accountPerspectiveAccountId={
                    isAccountPerspectiveEnabled && selectedAccountId !== 'ALL'
                      ? selectedAccountId
                      : undefined
                  }
                />
              </SwipeableBillRow>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View
              style={{
                paddingTop: 12,
                paddingBottom: 10,
                gap: 10,
              }}>
              <View style={{gap: 8}}>
                <Text variant="headlineSmall" style={{fontWeight: '800'}}>
                  全部账单
                </Text>
                <View
                  style={{
                    borderRadius: tokens.radius.xl,
                    backgroundColor: tokens.surface.accent,
                    borderWidth: 1,
                    borderColor: tokens.borderTone.strong,
                    minHeight: tokens.size.controlHeight,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                  }}>
                  <SearchLineIcon />
                  <TextInput
                    value={keywordInput}
                    onChangeText={setKeywordInput}
                    placeholder="搜索备注/分类/商户/标签/金额/账户/日期"
                    placeholderTextColor={isDark ? '#95A4AA' : '#7A837D'}
                    style={{
                      flex: 1,
                      marginLeft: 10,
                      marginRight: hasSearchText ? 8 : 0,
                      color: colors.text,
                      fontWeight: '600',
                      fontSize: 16,
                      paddingVertical: 0,
                    }}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                  {hasSearchText ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="清空搜索关键词"
                      onPress={handleClearSearch}
                      hitSlop={6}
                      style={({pressed}) => ({
                        width: 24,
                        height: 24,
                        borderRadius: tokens.radius.pill,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: pressed
                          ? tokens.interactive.selected
                          : isDark
                            ? 'rgba(255,255,255,0.12)'
                            : 'rgba(0,0,0,0.12)',
                      })}>
                      <Text
                        style={{
                          color: isDark ? '#EAF2F0' : '#4A4F52',
                          fontSize: 16,
                          lineHeight: 18,
                          fontWeight: '700',
                        }}>
                        ×
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={{gap: 8}}>
                <Pressable
                  onPress={() => setAdvancedVisible(current => !current)}
                  accessibilityRole="button"
                  accessibilityLabel={advancedVisible ? '收起更多筛选' : '展开更多筛选'}
                  accessibilityState={{expanded: advancedVisible}}
                  style={({pressed}) => ({
                    minHeight: tokens.size.touchMin,
                    borderRadius: tokens.radius.md,
                    backgroundColor: pressed ? tokens.interactive.pressed : tokens.surface.muted,
                    borderWidth: 1,
                    borderColor: tokens.borderTone.strong,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  })}>
                  <Text variant="labelLarge" style={{fontWeight: '700', color: colors.text}}>
                    更多筛选
                  </Text>
                  <Text variant="labelMedium" style={{color: colors.muted}}>
                    {advancedVisible ? '收起' : '展开'}
                  </Text>
                </Pressable>
                {advancedVisible ? (
                  <View
                    style={{
                      borderRadius: tokens.radius.lg,
                      backgroundColor: tokens.surface.muted,
                      borderWidth: 1,
                      borderColor: tokens.borderTone.strong,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      gap: 10,
                    }}>
                    <AccountFilterMenu
                      accounts={visibleAccounts}
                      selectedAccountId={selectedAccountId}
                      onChange={setSelectedAccountId}
                      containerStyle={{width: '100%', minWidth: 0}}
                      chipStyle={{
                        minHeight: tokens.size.chipHeight,
                        borderRadius: tokens.radius.pill,
                        justifyContent: 'center',
                        paddingHorizontal: 12,
                        borderWidth: 1,
                        borderColor: tokens.borderTone.strong,
                        backgroundColor: colors.surface,
                      }}
                      textStyle={{fontWeight: '600', color: colors.text}}
                    />
                    <AppInput
                      label="商户关键词"
                      placeholder="例如：京东 / 瑞幸 / 滴滴"
                      value={merchantKeyword}
                      onChangeText={setMerchantKeyword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <AppInput
                      label="标签关键词"
                      placeholder="例如：报销 / 通勤 / 工作餐"
                      value={tagKeyword}
                      onChangeText={setTagKeyword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={{flexDirection: 'row', gap: 8}}>
                      <View style={{flex: 1}}>
                        <AppInput
                          label="最低金额"
                          placeholder="0"
                          value={minAmountText}
                          onChangeText={value =>
                            setMinAmountText(sanitizeAmountFilterInput(value))
                          }
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={{flex: 1}}>
                        <AppInput
                          label="最高金额"
                          placeholder="不限"
                          value={maxAmountText}
                          onChangeText={value =>
                            setMaxAmountText(sanitizeAmountFilterInput(value))
                          }
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                    <View style={{gap: 8}}>
                      <Text variant="labelLarge" style={{fontWeight: '700', color: colors.text}}>
                        转账口径
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          borderRadius: tokens.radius.pill,
                          padding: 2,
                          backgroundColor: tokens.surface.accent,
                          alignSelf: 'flex-start',
                        }}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="包含转账"
                          accessibilityState={{selected: includeTransfers}}
                          onPress={() => setIncludeTransfers(true)}
                          style={({pressed}) => ({
                            minWidth: 86,
                            minHeight: tokens.size.touchMin,
                            borderRadius: tokens.radius.pill,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: includeTransfers
                              ? isDark
                                ? '#2A3544'
                                : '#DFD2FF'
                              : pressed
                                ? tokens.interactive.pressed
                                : 'transparent',
                          })}>
                          <Text
                            variant="labelMedium"
                            style={{
                              fontWeight: '700',
                              color: includeTransfers
                                ? isDark
                                  ? '#EAF2F0'
                                  : '#213042'
                                : colors.muted,
                            }}>
                            包含转账
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="排除转账"
                          accessibilityState={{selected: !includeTransfers}}
                          onPress={() => setIncludeTransfers(false)}
                          style={({pressed}) => ({
                            minWidth: 86,
                            minHeight: tokens.size.touchMin,
                            borderRadius: tokens.radius.pill,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: includeTransfers
                              ? pressed
                                ? tokens.interactive.pressed
                                : 'transparent'
                              : isDark
                                ? '#2A3544'
                                : '#DFD2FF',
                          })}>
                          <Text
                            variant="labelMedium"
                            style={{
                              fontWeight: '700',
                              color: includeTransfers
                                ? colors.muted
                                : isDark
                                  ? '#EAF2F0'
                                  : '#213042',
                            }}>
                            排除转账
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    <View style={{gap: 8}}>
                      <Text variant="labelLarge" style={{fontWeight: '700', color: colors.text}}>
                        转账视角
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          borderRadius: tokens.radius.pill,
                          padding: 2,
                          backgroundColor: tokens.surface.accent,
                          alignSelf: 'flex-start',
                        }}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="默认视角"
                          accessibilityState={{selected: !isAccountPerspectiveEnabled}}
                          onPress={() => handleAccountPerspectiveToggle(false)}
                          style={({pressed}) => ({
                            minWidth: 72,
                            minHeight: tokens.size.touchMin,
                            borderRadius: tokens.radius.pill,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isAccountPerspectiveEnabled
                              ? pressed
                                ? tokens.interactive.pressed
                                : 'transparent'
                              : isDark
                                ? '#2A3544'
                                : '#DFD2FF',
                          })}>
                          <Text
                            variant="labelMedium"
                            style={{
                              fontWeight: '700',
                              color: isAccountPerspectiveEnabled
                                ? colors.muted
                                : isDark
                                  ? '#EAF2F0'
                                  : '#213042',
                            }}>
                            默认
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="账户视角"
                          accessibilityState={{
                            selected: isAccountPerspectiveEnabled,
                            disabled: !canUseAccountPerspective,
                          }}
                          disabled={!canUseAccountPerspective}
                          onPress={() => handleAccountPerspectiveToggle(true)}
                          style={({pressed}) => ({
                            minWidth: 92,
                            minHeight: tokens.size.touchMin,
                            borderRadius: tokens.radius.pill,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isAccountPerspectiveEnabled
                              ? isDark
                                ? '#2A3544'
                                : '#DFD2FF'
                              : pressed
                                ? tokens.interactive.pressed
                                : 'transparent',
                            opacity: canUseAccountPerspective ? 1 : 0.5,
                          })}>
                          <Text
                            variant="labelMedium"
                            style={{
                              fontWeight: '700',
                              color: isAccountPerspectiveEnabled
                                ? isDark
                                  ? '#EAF2F0'
                                  : '#213042'
                                : colors.muted,
                            }}>
                            账户视角
                          </Text>
                        </Pressable>
                      </View>
                      <Text variant="bodySmall" style={{color: colors.muted}}>
                        {canUseAccountPerspective
                          ? '开启后，转账会按当前账户显示为转入(收入)/转出(支出)。'
                          : '先选择一个账户，再开启账户视角。'}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={{flexDirection: 'row', gap: 8}}>
                <TimePresetBar<BillTimePreset>
                  value={timePreset}
                  options={billTimePresetOptions}
                  onChange={setTimePreset}
                  containerStyle={{flex: 1, minWidth: 0}}
                  chipStyle={{
                    minHeight: tokens.size.chipHeight,
                    borderRadius: tokens.radius.pill,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: tokens.borderTone.strong,
                    backgroundColor: tokens.surface.muted,
                  }}
                  textStyle={{fontWeight: '600', color: colors.text}}
                />
                <CategoryFilterMenu
                  selectedCategoryId={selectedCategoryId}
                  categories={visibleCategories}
                  onChange={setSelectedCategoryId}
                  containerStyle={{flex: 1, minWidth: 0}}
                  chipStyle={{
                    minHeight: tokens.size.chipHeight,
                    borderRadius: tokens.radius.pill,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: tokens.borderTone.strong,
                    backgroundColor: tokens.surface.muted,
                  }}
                  textStyle={{fontWeight: '600', color: colors.text}}
                />
              </View>

              {timePreset === 'CUSTOM' ? (
                <DateRangeFields
                  startDate={customStartDate}
                  endDate={customEndDate}
                  onStartDateChange={setCustomStartDate}
                  onEndDateChange={setCustomEndDate}
                />
              ) : null}

              <View
                onLayout={event => setFilterSwitchWidth(event.nativeEvent.layout.width)}
                style={{
                  height: 56,
                  backgroundColor: tokens.surface.muted,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: tokens.borderTone.strong,
                  padding: 2,
                  flexDirection: 'row',
                  overflow: 'hidden',
                }}>
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 0,
                    height: 52,
                    width: indicatorWidth,
                    borderRadius: 26,
                    backgroundColor:
                      type === 'EXPENSE'
                        ? isDark
                          ? 'rgba(224,106,58,0.28)'
                          : 'rgba(224,106,58,0.16)'
                        : type === 'INCOME'
                          ? isDark
                            ? 'rgba(45,156,116,0.3)'
                            : 'rgba(45,156,116,0.18)'
                          : isDark
                            ? '#283244'
                            : '#E7E0FB',
                    transform: [{translateX: indicatorTranslateX}],
                  }}
                />
                {filterTypeOptions.map(item => (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityLabel={`筛选${item.label}`}
                    accessibilityState={{selected: type === item.value}}
                    style={({pressed}) => ({
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                      opacity: pressed ? 0.88 : 1,
                    })}
                    onPress={() => handleTypeChange(item.value)}>
                    <Text
                      variant="titleMedium"
                      style={{
                        fontWeight: '700',
                        color: getFilterTextColor(item.value),
                      }}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <FilterSummaryChips
                summaryText={activeFilterSummary}
                onClear={clearAllFilters}
                summaryTextStyle={{color: colors.muted}}
                clearTextStyle={{color: colors.primary}}
                containerStyle={{paddingHorizontal: 2}}
              />
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: listBottomPadding,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={{paddingTop: 36}}>
              <EmptyState
                title="没有匹配账单"
                description="调整筛选条件后再试试。"
                icon="wallet-outline"
              />
            </View>
          }
        />
        <DraggableFab
          bottomOffset={fabBottom}
          backgroundColor={colors.secondary}
          draggable={false}
          accessibilityLabel="新增账单"
          onPress={() => navigation.navigate('BillAdd')}>
          <PlusLineIcon />
        </DraggableFab>
      </View>
    </SafeAreaView>
  );
}
