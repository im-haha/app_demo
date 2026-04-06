import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import dayjs from 'dayjs';
import {Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import CashflowTrendCard from '@/components/stats/CashflowTrendCard';
import CashflowTrendXLCard from '@/components/stats/xl/CashflowTrendXLCard';
import CategoryDonutCard from '@/components/stats/CategoryDonutCard';
import CompareBarCard from '@/components/stats/CompareBarCard';
import StatsSummaryStrip from '@/components/stats/StatsSummaryStrip';
import {
  AccountFilterMenu,
  CategoryFilterMenu,
  DateRangeFields,
  FilterSummaryChips,
  TimePresetBar,
} from '@/components/filters';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';
import {getStatsChartTheme} from '@/components/stats/chart/statsChartTheme';
import {segmentedSwitchHaptic} from '@/utils/haptics';
import {CommonTimePreset, resolveTimeRange, statsTimePresetOptions} from '@/utils/timeRange';

type StatsType = 'INCOME' | 'EXPENSE';

export default function StatsScreen(): React.JSX.Element {
  const useXLChart = true;
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const chartTheme = getStatsChartTheme(resolvedThemeMode);
  const [type, setType] = useState<StatsType>('EXPENSE');
  const [timePreset, setTimePreset] = useState<CommonTimePreset>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState(
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  );
  const [customEndDate, setCustomEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | 'ALL'>('ALL');
  const [includeTransfers, setIncludeTransfers] = useState(false);
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [primaryDimension, setPrimaryDimension] = useState<'CATEGORY' | 'ACCOUNT'>('CATEGORY');
  const [switchWidth, setSwitchWidth] = useState(0);
  const typeSwitchAnim = useRef(
    new Animated.Value(type === 'EXPENSE' ? 0 : 1),
  ).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const accounts = useAppStore(state => state.accounts);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const getTrendByRange = useAppStore(state => state.getTrendByRange);
  const getCategoryBreakdownByRange = useAppStore(state => state.getCategoryBreakdownByRange);
  const getPreviousPeriodTotalByRange = useAppStore(state => state.getPreviousPeriodTotalByRange);
  const getIncomeExpenseTotalsByRange = useAppStore(state => state.getIncomeExpenseTotalsByRange);
  const visibleCategories = useMemo(
    () =>
      categories
        .filter(category => category.userId === null || category.userId === currentUserId)
        .sort((left, right) => left.sortNum - right.sortNum),
    [categories, currentUserId],
  );
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
  const scopedFilters = useMemo(
    () => ({
      categoryId: selectedCategoryId,
      accountId: selectedAccountId === 'ALL' ? undefined : selectedAccountId,
      includeTransfers,
    }),
    [includeTransfers, selectedAccountId, selectedCategoryId],
  );
  const categoryStats = getCategoryBreakdownByRange(
    timeRange.startDate,
    timeRange.endDate,
    type,
    scopedFilters,
  );
  const trendStats = getTrendByRange(
    timeRange.startDate,
    timeRange.endDate,
    type,
    scopedFilters,
  );
  const previousPeriodTotal = getPreviousPeriodTotalByRange(
    timeRange.startDate,
    timeRange.endDate,
    type,
    scopedFilters,
  );
  const rangeCompareStats = getIncomeExpenseTotalsByRange(
    timeRange.startDate,
    timeRange.endDate,
    scopedFilters,
  );
  const currentRangeTotal =
    type === 'INCOME' ? rangeCompareStats.incomeTotal : rangeCompareStats.expenseTotal;
  const indicatorWidth = Math.max((switchWidth - 4) / 2, 0);
  const indicatorTranslateX = typeSwitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 2 + indicatorWidth],
  });
  const switchThumbBackground =
    type === 'EXPENSE'
      ? isDark
        ? 'rgba(225,144,104,0.24)'
        : 'rgba(197,106,60,0.15)'
      : isDark
        ? 'rgba(89,196,160,0.26)'
        : 'rgba(29,138,108,0.16)';
  const switchTrackBackground = chartTheme.panelMutedFill;
  const switchBorderColor = chartTheme.panelBorder;
  const selectedExpenseTextColor = isDark ? '#FFCAAF' : '#8D4A2E';
  const selectedIncomeTextColor = isDark ? '#BBEED9' : '#1E6E54';
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

  useEffect(() => {
    Animated.spring(typeSwitchAnim, {
      toValue: type === 'EXPENSE' ? 0 : 1,
      damping: 18,
      stiffness: 210,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [type, typeSwitchAnim]);

  useEffect(() => {
    contentOpacity.setValue(0.76);
    contentTranslateY.setValue(14);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        damping: 16,
        stiffness: 165,
        mass: 1.02,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    contentOpacity,
    contentTranslateY,
    selectedAccountId,
    selectedCategoryId,
    includeTransfers,
    timePreset,
    type,
    customStartDate,
    customEndDate,
    bills,
  ]);

  function handleTypeChange(nextType: StatsType) {
    if (nextType === type) {
      return;
    }
    segmentedSwitchHaptic();
    setType(nextType);
  }

  function getSegmentTextColor(segmentType: StatsType): string {
    const isSelected = segmentType === type;
    if (!isSelected) {
      return colors.muted;
    }
    return segmentType === 'EXPENSE' ? selectedExpenseTextColor : selectedIncomeTextColor;
  }

  function clearFilters(): void {
    setTimePreset('THIS_MONTH');
    setCustomStartDate(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
    setCustomEndDate(dayjs().format('YYYY-MM-DD'));
    setSelectedCategoryId(null);
    setSelectedAccountId('ALL');
    setIncludeTransfers(false);
    setAdvancedVisible(false);
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <View style={{flex: 1}}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 8,
            gap: 10,
          }}>
          <View style={styles.headerRow}>
            <View style={{gap: 4}}>
              <Text variant="headlineSmall" style={{fontWeight: '800', color: colors.text}}>
                统计分析
              </Text>
              <Text variant="bodyMedium" style={{color: colors.muted}}>
                趋势、分类与收支对比共用同一组筛选条件
              </Text>
            </View>
          </View>

          <View style={{flexDirection: 'row', gap: 8}}>
            <TimePresetBar<CommonTimePreset>
              value={timePreset}
              options={statsTimePresetOptions}
              onChange={setTimePreset}
              containerStyle={{flex: 1, minWidth: 0}}
              chipStyle={[
                styles.filterChip,
                {
                  borderColor: chartTheme.panelBorder,
                  backgroundColor: chartTheme.panelMutedFill,
                },
              ]}
              textStyle={{fontWeight: '600', color: colors.text}}
            />
            {primaryDimension === 'CATEGORY' ? (
              <CategoryFilterMenu
                selectedCategoryId={selectedCategoryId}
                categories={visibleCategories}
                onChange={setSelectedCategoryId}
                containerStyle={{flex: 1, minWidth: 0}}
                chipStyle={[
                  styles.filterChip,
                  {
                    borderColor: chartTheme.panelBorder,
                    backgroundColor: chartTheme.panelMutedFill,
                  },
                ]}
                textStyle={{fontWeight: '600', color: colors.text}}
              />
            ) : (
              <AccountFilterMenu
                accounts={visibleAccounts}
                selectedAccountId={selectedAccountId}
                onChange={setSelectedAccountId}
                containerStyle={{flex: 1, minWidth: 0}}
                chipStyle={[
                  styles.filterChip,
                  {
                    borderColor: chartTheme.panelBorder,
                    backgroundColor: chartTheme.panelMutedFill,
                  },
                ]}
                textStyle={{fontWeight: '600', color: colors.text}}
              />
            )}
          </View>
          <View style={{flexDirection: 'row', gap: 8}}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={primaryDimension === 'CATEGORY' ? '切换到账户筛选' : '切换到分类筛选'}
              onPress={() =>
                setPrimaryDimension(current => (current === 'CATEGORY' ? 'ACCOUNT' : 'CATEGORY'))
              }
              style={({pressed}) => ({
                minHeight: tokens.size.touchMin,
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderColor: chartTheme.panelBorder,
                backgroundColor: pressed ? tokens.interactive.pressed : chartTheme.panelMutedFill,
                paddingHorizontal: 12,
                justifyContent: 'center',
                flex: 1,
              })}>
              <Text variant="labelLarge" style={{fontWeight: '700', color: colors.text}}>
                {primaryDimension === 'CATEGORY' ? '切换到账户筛选' : '切换到分类筛选'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={advancedVisible ? '收起更多筛选' : '展开更多筛选'}
              accessibilityState={{expanded: advancedVisible}}
              onPress={() => setAdvancedVisible(current => !current)}
              style={({pressed}) => ({
                minHeight: tokens.size.touchMin,
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderColor: chartTheme.panelBorder,
                backgroundColor: pressed ? tokens.interactive.pressed : chartTheme.panelMutedFill,
                paddingHorizontal: 12,
                justifyContent: 'center',
                flex: 1,
              })}>
              <Text variant="labelLarge" style={{fontWeight: '700', color: colors.text}}>
                {advancedVisible ? '收起更多筛选' : '展开更多筛选'}
              </Text>
            </Pressable>
          </View>

          {advancedVisible ? (
            <View
              style={{
                borderRadius: tokens.radius.lg,
                borderWidth: 1,
                borderColor: chartTheme.panelBorder,
                backgroundColor: chartTheme.panelMutedFill,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 10,
              }}>
              {primaryDimension === 'CATEGORY' ? (
                <AccountFilterMenu
                  accounts={visibleAccounts}
                  selectedAccountId={selectedAccountId}
                  onChange={setSelectedAccountId}
                  containerStyle={{width: '100%', minWidth: 0}}
                  chipStyle={[
                    styles.filterChip,
                    {
                      borderColor: chartTheme.panelBorder,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  textStyle={{fontWeight: '600', color: colors.text}}
                />
              ) : (
                <CategoryFilterMenu
                  selectedCategoryId={selectedCategoryId}
                  categories={visibleCategories}
                  onChange={setSelectedCategoryId}
                  containerStyle={{width: '100%', minWidth: 0}}
                  chipStyle={[
                    styles.filterChip,
                    {
                      borderColor: chartTheme.panelBorder,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  textStyle={{fontWeight: '600', color: colors.text}}
                />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="切换是否计入转账"
                accessibilityState={{selected: includeTransfers}}
                onPress={() => setIncludeTransfers(current => !current)}
                style={[
                  styles.filterChip,
                  {
                    borderColor: chartTheme.panelBorder,
                    backgroundColor: includeTransfers
                      ? isDark
                        ? 'rgba(73,116,98,0.32)'
                        : 'rgba(29,138,108,0.14)'
                      : colors.surface,
                    alignSelf: 'flex-start',
                    flex: undefined,
                    minWidth: 132,
                  },
                ]}>
                <Text variant="labelLarge" style={{fontWeight: '700', color: colors.text}}>
                  {includeTransfers ? '已计入转账' : '默认排除转账'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {timePreset === 'CUSTOM' ? (
            <DateRangeFields
              startDate={customStartDate}
              endDate={customEndDate}
              onStartDateChange={setCustomStartDate}
              onEndDateChange={setCustomEndDate}
            />
          ) : null}

          <View
            onLayout={event => setSwitchWidth(event.nativeEvent.layout.width)}
            style={{
              height: 56,
              backgroundColor: switchTrackBackground,
              borderRadius: 28,
              padding: 2,
              borderWidth: 1,
              borderColor: switchBorderColor,
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
                backgroundColor: switchThumbBackground,
                transform: [{translateX: indicatorTranslateX}],
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="切换为支出视角"
              accessibilityState={{selected: type === 'EXPENSE'}}
              style={({pressed}) => ({
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                opacity: pressed ? 0.88 : 1,
              })}
              onPress={() => handleTypeChange('EXPENSE')}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: '700',
                  color: getSegmentTextColor('EXPENSE'),
                }}>
                支出
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="切换为收入视角"
              accessibilityState={{selected: type === 'INCOME'}}
              style={({pressed}) => ({
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                opacity: pressed ? 0.88 : 1,
              })}
              onPress={() => handleTypeChange('INCOME')}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: '700',
                  color: getSegmentTextColor('INCOME'),
                }}>
                收入
              </Text>
            </Pressable>
          </View>

          <FilterSummaryChips
            summaryText={`${timeRange.label} · ${selectedCategoryName} · ${selectedAccountName} · ${
              includeTransfers ? '计入转账' : '排除转账'
            }`}
            onClear={clearFilters}
            clearLabel="清空筛选"
            summaryTextStyle={{color: colors.muted}}
            clearTextStyle={{color: colors.primary}}
          />
        </View>
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 20,
            paddingTop: 10,
          }}>
          <Animated.View
            style={{
              gap: 14,
              opacity: contentOpacity,
              transform: [{translateY: contentTranslateY}],
            }}>
            <StatsSummaryStrip
              type={type}
              rangeDays={timeRange.days}
              rangeLabel={timeRange.label}
              totalAmount={currentRangeTotal}
              previousTotal={previousPeriodTotal}
            />
            {useXLChart ? (
              <CashflowTrendXLCard
                data={trendStats}
                type={type}
                rangeDays={timeRange.days}
                rangeLabel={timeRange.label}
                previousTotal={previousPeriodTotal}
              />
            ) : (
              <CashflowTrendCard
                data={trendStats}
                type={type}
                rangeDays={timeRange.days}
                rangeLabel={timeRange.label}
                previousTotal={previousPeriodTotal}
              />
            )}
            <CategoryDonutCard title={`${timeRange.label} 分类结构`} data={categoryStats} type={type} />
            <CompareBarCard
              rangeDays={timeRange.days}
              rangeLabel={timeRange.label}
              incomeTotal={rangeCompareStats.incomeTotal}
              expenseTotal={rangeCompareStats.expenseTotal}
            />
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  filterChip: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
  },
});
