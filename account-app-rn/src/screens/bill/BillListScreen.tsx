import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Pressable, SectionList, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import dayjs from 'dayjs';
import {Menu, Text} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import BillCard from '@/components/bill/BillCard';
import EmptyState from '@/components/common/EmptyState';
import AppInput from '@/components/common/AppInput';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {accountTypeOptions, filterTypeOptions} from '@/utils/constants';
import SearchLineIcon from '@/components/common/icons/SearchLineIcon';
import PlusLineIcon from '@/components/common/icons/PlusLineIcon';
import DraggableFab from '@/components/common/DraggableFab';
import {segmentedSwitchHaptic} from '@/utils/haptics';
import {useBillSections} from '@/store/selectors/billSelectors';
import {useAppStore} from '@/store/appStore';
import {formatCurrency} from '@/utils/format';
import {AccountType, BillFilters, BillListSection} from '@/types/bill';

type TimePreset = 'THIS_MONTH' | 'LAST_7_DAYS' | 'CUSTOM';

interface TimeFilterResult {
  month?: string;
  startDate?: string;
  endDate?: string;
}

function isValidDateText(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return dayjs(value).format('YYYY-MM-DD') === value;
}

function resolveDateFilters(
  preset: TimePreset,
  customStartDate: string,
  customEndDate: string,
): TimeFilterResult {
  if (preset === 'THIS_MONTH') {
    return {month: dayjs().format('YYYY-MM')};
  }

  if (preset === 'LAST_7_DAYS') {
    return {
      startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    };
  }

  const validStart = isValidDateText(customStartDate);
  const validEnd = isValidDateText(customEndDate);
  if (validStart && validEnd) {
    if (dayjs(customStartDate).isAfter(dayjs(customEndDate))) {
      return {
        startDate: customEndDate,
        endDate: customStartDate,
      };
    }
    return {
      startDate: customStartDate,
      endDate: customEndDate,
    };
  }

  if (validStart && !validEnd) {
    return {
      startDate: customStartDate,
      endDate: customStartDate,
    };
  }

  if (!validStart && validEnd) {
    return {
      startDate: customEndDate,
      endDate: customEndDate,
    };
  }

  return {
    startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  };
}

export default function BillListScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const fabBottom = 24 + Math.max(insets.bottom, 8);
  const listBottomPadding = fabBottom + 88;
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [timePreset, setTimePreset] = useState<TimePreset>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState(
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  );
  const [customEndDate, setCustomEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | 'ALL'>('ALL');
  const [filterSwitchWidth, setFilterSwitchWidth] = useState(0);
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const typeIndex = useMemo(
    () => filterTypeOptions.findIndex(item => item.value === type),
    [type],
  );
  const filterAnim = useRef(new Animated.Value(typeIndex < 0 ? 0 : typeIndex))
    .current;
  const categories = useAppStore(state => state.categories);
  const currentUserId = useAppStore(state => state.currentUserId);
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
  const dateFilters = useMemo(
    () => resolveDateFilters(timePreset, customStartDate, customEndDate),
    [timePreset, customStartDate, customEndDate],
  );
  const billFilters = useMemo<BillFilters>(
    () => ({
      type,
      keyword,
      categoryId: selectedCategoryId,
      accountType: selectedAccountType,
      ...dateFilters,
    }),
    [type, keyword, selectedCategoryId, selectedAccountType, dateFilters],
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
    selectedAccountType === 'ALL'
      ? '全部账户'
      : accountTypeOptions.find(item => item.value === selectedAccountType)?.label ??
        '全部账户';
  const timePresetLabel =
    timePreset === 'THIS_MONTH'
      ? '本月'
      : timePreset === 'LAST_7_DAYS'
        ? '近7天'
        : '自定义';
  const activeFilterSummary = useMemo(() => {
    const summaryParts = [timePresetLabel];
    if (selectedCategoryId !== null) {
      summaryParts.push(selectedCategoryName);
    }
    if (selectedAccountType !== 'ALL') {
      summaryParts.push(selectedAccountName);
    }
    if (keyword.trim()) {
      summaryParts.push(`关键词: ${keyword.trim()}`);
    }
    return summaryParts.join(' · ');
  }, [keyword, selectedAccountName, selectedAccountType, selectedCategoryId, selectedCategoryName, timePresetLabel]);

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
    setSelectedAccountType('ALL');
  }

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
        <View
          style={{
            paddingHorizontal: 20,
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
                borderRadius: 22,
                backgroundColor: isDark ? '#2B283A' : '#ECE4FC',
                borderWidth: 1,
                borderColor: isDark
                  ? 'rgba(142,148,143,0.26)'
                  : 'rgba(142,148,143,0.18)',
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
              }}>
              <SearchLineIcon />
              <TextInput
                value={keywordInput}
                onChangeText={setKeywordInput}
                placeholder="搜索备注/分类/金额/账户/日期"
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
                  onPress={handleClearSearch}
                  hitSlop={8}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.12)',
                  }}>
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

          <View style={{flexDirection: 'row', gap: 8}}>
            <Menu
              visible={timeMenuVisible}
              onDismiss={() => setTimeMenuVisible(false)}
              anchor={
                <Pressable
                  onPress={() => setTimeMenuVisible(true)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 999,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(142,148,143,0.28)' : 'rgba(142,148,143,0.2)',
                    backgroundColor: isDark ? '#111B22' : '#F6F0FF',
                  }}>
                  <Text numberOfLines={1} style={{fontWeight: '600', color: colors.text}}>
                    时间：{timePresetLabel}
                  </Text>
                </Pressable>
              }>
              <Menu.Item
                title="本月"
                onPress={() => {
                  setTimePreset('THIS_MONTH');
                  setTimeMenuVisible(false);
                }}
              />
              <Menu.Item
                title="近 7 天"
                onPress={() => {
                  setTimePreset('LAST_7_DAYS');
                  setTimeMenuVisible(false);
                }}
              />
              <Menu.Item
                title="自定义"
                onPress={() => {
                  setTimePreset('CUSTOM');
                  setTimeMenuVisible(false);
                }}
              />
            </Menu>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Pressable
                  onPress={() => setCategoryMenuVisible(true)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 999,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(142,148,143,0.28)' : 'rgba(142,148,143,0.2)',
                    backgroundColor: isDark ? '#111B22' : '#F6F0FF',
                  }}>
                  <Text numberOfLines={1} style={{fontWeight: '600', color: colors.text}}>
                    {selectedCategoryName}
                  </Text>
                </Pressable>
              }>
              <Menu.Item
                title="全部分类"
                onPress={() => {
                  setSelectedCategoryId(null);
                  setCategoryMenuVisible(false);
                }}
              />
              {visibleCategories.map(category => (
                <Menu.Item
                  key={category.id}
                  title={category.name}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    setCategoryMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
            <Menu
              visible={accountMenuVisible}
              onDismiss={() => setAccountMenuVisible(false)}
              anchor={
                <Pressable
                  onPress={() => setAccountMenuVisible(true)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 999,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(142,148,143,0.28)' : 'rgba(142,148,143,0.2)',
                    backgroundColor: isDark ? '#111B22' : '#F6F0FF',
                  }}>
                  <Text numberOfLines={1} style={{fontWeight: '600', color: colors.text}}>
                    {selectedAccountName}
                  </Text>
                </Pressable>
              }>
              <Menu.Item
                title="全部账户"
                onPress={() => {
                  setSelectedAccountType('ALL');
                  setAccountMenuVisible(false);
                }}
              />
              {accountTypeOptions.map(option => (
                <Menu.Item
                  key={option.value}
                  title={option.label}
                  onPress={() => {
                    setSelectedAccountType(option.value);
                    setAccountMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
          </View>

          {timePreset === 'CUSTOM' ? (
            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                <AppInput
                  label="开始日期"
                  value={customStartDate}
                  onChangeText={setCustomStartDate}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{flex: 1}}>
                <AppInput
                  label="结束日期"
                  value={customEndDate}
                  onChangeText={setCustomEndDate}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          ) : null}

          <View
            onLayout={event =>
              setFilterSwitchWidth(event.nativeEvent.layout.width)
            }
            style={{
              height: 56,
              backgroundColor: isDark ? '#111B22' : '#F6F0FF',
              borderRadius: 28,
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(142,148,143,0.28)'
                : 'rgba(142,148,143,0.2)',
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
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
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

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 2,
            }}>
            <Text variant="bodySmall" style={{color: colors.muted, flex: 1}}>
              {activeFilterSummary}
            </Text>
            <Pressable onPress={clearAllFilters} hitSlop={8}>
              <Text variant="labelLarge" style={{color: colors.primary}}>
                清空
              </Text>
            </Pressable>
          </View>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={item => String(item.id)}
          renderSectionHeader={renderSectionHeader}
          renderItem={({item}) => (
            <View style={{marginBottom: 10}}>
              <BillCard
                bill={item}
                category={categoryMap.get(item.categoryId)}
                onPress={() =>
                  navigation.navigate('BillDetail', {
                    billId: item.id,
                  })
                }
              />
            </View>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: listBottomPadding,
            paddingTop: 8,
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
          onPress={() => navigation.navigate('BillAdd')}>
          <PlusLineIcon />
        </DraggableFab>
      </View>
    </SafeAreaView>
  );
}
