import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Pressable, ScrollView, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import dayjs from 'dayjs';
import {Text} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import BillCard from '@/components/bill/BillCard';
import EmptyState from '@/components/common/EmptyState';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {filterTypeOptions} from '@/utils/constants';
import SearchLineIcon from '@/components/common/icons/SearchLineIcon';
import PlusLineIcon from '@/components/common/icons/PlusLineIcon';
import DraggableFab from '@/components/common/DraggableFab';
import {segmentedSwitchHaptic} from '@/utils/haptics';
import {buildStatsDisplayBillMappings} from '@/utils/statsDisplayData';

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
  const [filterSwitchWidth, setFilterSwitchWidth] = useState(0);
  const typeIndex = useMemo(
    () => filterTypeOptions.findIndex(item => item.value === type),
    [type],
  );
  const filterAnim = useRef(new Animated.Value(typeIndex < 0 ? 0 : typeIndex))
    .current;
  const storeBills = useAppStore(state => state.bills);
  const currentUserId = useAppStore(state => state.currentUserId);
  const categories = useAppStore(state => state.categories);
  const sourceUserBills = useMemo(
    () =>
      storeBills
        .filter(bill => bill.userId === currentUserId && !bill.deleted)
        .sort(
          (left, right) =>
            dayjs(right.billTime).valueOf() - dayjs(left.billTime).valueOf(),
        ),
    [storeBills, currentUserId],
  );
  const statsAlignedBills = useMemo(
    () =>
      buildStatsDisplayBillMappings(
        sourceUserBills,
        categories,
        currentUserId,
        30,
      ),
    [sourceUserBills, categories, currentUserId],
  );
  const categoryNameMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(category => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);
  const bills = useMemo(
    () => {
      const keywordText = keyword.trim().toLowerCase();

      return (
      statsAlignedBills
        .filter(item =>
          type === 'ALL' ? true : item.displayBill.type === type,
        )
        .filter(item => {
          if (!keywordText) {
            return true;
          }
          const remarkText = (item.displayBill.remark ?? '').toLowerCase();
          const categoryText = (
            categoryNameMap.get(item.displayBill.categoryId) ?? ''
          ).toLowerCase();
          return (
            remarkText.includes(keywordText) ||
            categoryText.includes(keywordText)
          );
        })
        .sort(
          (left, right) =>
            dayjs(right.displayBill.billTime).valueOf() -
            dayjs(left.displayBill.billTime).valueOf(),
        )
      );
    },
    [statsAlignedBills, type, keyword, categoryNameMap],
  );
  const indicatorWidth = Math.max((filterSwitchWidth - 4) / 3, 0);
  const indicatorTranslateX = filterAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [2, 2 + indicatorWidth, 2 + indicatorWidth * 2],
  });
  const hasSearchText = keywordInput.trim().length > 0;

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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <View style={{flex: 1}}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 10,
            gap: 12,
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
                placeholder="搜索备注关键字"
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
        </View>
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: listBottomPadding,
            paddingTop: 8,
            gap: 12,
          }}>
          {bills.length === 0 ? (
            <EmptyState
              title="还没有账单"
              description="先记第一笔，后面统计和预算才有意义。"
              icon="wallet-outline"
            />
          ) : (
            bills.map(item => (
              <BillCard
                key={item.displayBill.id}
                bill={item.displayBill}
                category={categories.find(
                  category => category.id === item.displayBill.categoryId,
                )}
                onPress={
                  item.sourceBillId
                    ? () =>
                        navigation.navigate('BillDetail', {
                          billId: item.sourceBillId,
                        })
                    : undefined
                }
              />
            ))
          )}
        </ScrollView>
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
