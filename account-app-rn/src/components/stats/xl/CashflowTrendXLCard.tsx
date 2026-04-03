import React, {useEffect, useMemo, useState} from 'react';
import {LayoutChangeEvent, Pressable, StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {
  Area,
  Bar,
  CartesianChart,
  Line,
  Scatter,
  useChartPressState,
} from 'victory-native';
import {DashPathEffect, Line as SkiaLine, matchFont, vec} from '@shopify/react-native-skia';
import {runOnJS, useAnimatedReaction} from 'react-native-reanimated';
import {TrendPoint} from '@/types/bill';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {getStatsChartTheme} from '@/components/stats/chart/statsChartTheme';
import {
  buildVisibleLabelIndexes,
  buildYAxisTicks,
  computeYAxisMax,
  countLeadingZeroDays,
} from '@/components/stats/chart/statsChartUtils';
import {
  formatAxisCurrency,
  formatCurrency,
} from '@/components/stats/chart/statsChartFormat';

type StatsType = 'INCOME' | 'EXPENSE';

interface Props {
  data: TrendPoint[];
  type: StatsType;
  rangeDays: 7 | 30;
  previousTotal?: number;
}

interface TrendDatum {
  x: number;
  dailyAmount: number;
  rawDailyAmount: number;
  cumulativeAmount: number;
  rawCumulativeAmount: number;
  axisLabel: string;
  date: string;
}

const MAIN_CHART_HEIGHT = 184;
const SUB_CHART_HEIGHT_30 = 86;
const SUB_CHART_HEIGHT_7 = 72;
const MAIN_CHART_PADDING = {top: 18, right: 22, bottom: 14, left: 58};
const SUB_CHART_PADDING = {top: 8, right: 22, bottom: 30, left: 58};
const TOOLTIP_WIDTH = 196;

export default function CashflowTrendXLCard({
  data,
  type,
  rangeDays,
  previousTotal,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const mode = useResolvedThemeMode();
  const chartTheme = getStatsChartTheme(mode);
  const axisFont = useMemo(
    () =>
      matchFont({
        fontFamily: 'System',
        fontSize: 11,
        fontStyle: 'normal',
        fontWeight: '500',
      }),
    [],
  );
  const lineColor = type === 'EXPENSE' ? chartTheme.expenseLine : chartTheme.incomeLine;
  const fillColor = type === 'EXPENSE' ? chartTheme.expenseFill : chartTheme.incomeFill;
  const summaryColor = type === 'EXPENSE' ? colors.expense : colors.income;
  const summaryNoun = type === 'EXPENSE' ? '支出' : '收入';

  const baseDailyData = useMemo(
    () =>
      data.map((item, index) => ({
        x: index + 1,
        rawDailyAmount: item.amount,
        axisLabel: item.axisLabel,
        date: item.date,
      })),
    [data],
  );
  const rawTotalAmount = useMemo(
    () => baseDailyData.reduce((sum, item) => sum + item.rawDailyAmount, 0),
    [baseDailyData],
  );

  const dailyFloorValue = useMemo(() => {
    const maxRaw = Math.max(...baseDailyData.map(item => item.rawDailyAmount), 0);
    if (maxRaw <= 0) {
      return 0.01;
    }
    return Math.max(0.01, Math.min(50, maxRaw * 0.01));
  }, [baseDailyData]);

  const cumulativeFloorValue = useMemo(() => {
    let running = 0;
    let maxRunning = 0;
    for (const item of baseDailyData) {
      running += item.rawDailyAmount;
      maxRunning = Math.max(maxRunning, running);
    }
    if (maxRunning <= 0) {
      return dailyFloorValue;
    }
    return Math.max(dailyFloorValue, Math.min(50, maxRunning * 0.005));
  }, [baseDailyData, dailyFloorValue]);

  const chartData = useMemo<TrendDatum[]>(() => {
    let runningRaw = 0;
    return baseDailyData.map(item => {
      runningRaw += item.rawDailyAmount;
      const dailyAmount = item.rawDailyAmount <= 0 ? dailyFloorValue : item.rawDailyAmount;
      const rawCumulativeAmount = runningRaw;
      const cumulativeAmount =
        rawCumulativeAmount <= 0 ? cumulativeFloorValue : rawCumulativeAmount;

      return {
        x: item.x,
        dailyAmount,
        rawDailyAmount: item.rawDailyAmount,
        cumulativeAmount,
        rawCumulativeAmount,
        axisLabel: item.axisLabel,
        date: item.date,
      };
    });
  }, [baseDailyData, cumulativeFloorValue, dailyFloorValue]);

  const totalAmount = rawTotalAmount;
  const dailyAverage = useMemo(
    () => (rangeDays > 0 ? totalAmount / rangeDays : 0),
    [rangeDays, totalAmount],
  );
  const hasAnyData = chartData.length > 0;
  const hasRealData = chartData.some(item => item.rawDailyAmount > 0);
  const leadingZeroDays = useMemo(() => countLeadingZeroDays(data), [data]);
  const shouldEnableEffectiveWindow =
    hasRealData && rangeDays === 30 && leadingZeroDays >= 8;
  const [zoomMode, setZoomMode] = useState<'full' | 'effective'>('full');

  useEffect(() => {
    if (!shouldEnableEffectiveWindow && zoomMode !== 'full') {
      setZoomMode('full');
    }
  }, [shouldEnableEffectiveWindow, zoomMode]);

  const displaySource = useMemo(() => {
    if (!shouldEnableEffectiveWindow || zoomMode === 'full') {
      return chartData;
    }
    const startIndex = Math.max(leadingZeroDays - 1, 0);
    return chartData.slice(startIndex);
  }, [chartData, leadingZeroDays, shouldEnableEffectiveWindow, zoomMode]);

  const displayData = useMemo(
    () =>
      displaySource.map((item, index) => ({
        ...item,
        x: index + 1,
      })),
    [displaySource],
  );

  const mainMaxValue = useMemo(
    () =>
      displayData.length > 0
        ? Math.max(...displayData.map(item => item.cumulativeAmount))
        : 0,
    [displayData],
  );
  const mainYAxisMax = useMemo(
    () => computeYAxisMax(mainMaxValue, 3),
    [mainMaxValue],
  );
  const mainYAxisTicks = useMemo(
    () => buildYAxisTicks(mainYAxisMax, 3),
    [mainYAxisMax],
  );

  const subMaxValue = useMemo(
    () =>
      displayData.length > 0
        ? Math.max(...displayData.map(item => item.dailyAmount))
        : 0,
    [displayData],
  );
  const subYAxisMax = useMemo(
    () => computeYAxisMax(subMaxValue, 2),
    [subMaxValue],
  );

  const visibleLabelIndexes = useMemo(
    () => buildVisibleLabelIndexes(displayData.length),
    [displayData.length],
  );
  const axisTickValues = useMemo(
    () =>
      Array.from(visibleLabelIndexes)
        .sort((left, right) => left - right)
        .map(index => index + 1),
    [visibleLabelIndexes],
  );

  const [chartWidth, setChartWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeXPosition, setActiveXPosition] = useState(0);
  const {state: chartPressState} = useChartPressState({
    x: 0,
    y: {
      cumulativeAmount: 0,
      dailyAmount: 0,
    },
  });

  useAnimatedReaction(
    () => ({
      active: chartPressState.isActive.value,
      index: chartPressState.matchedIndex.value,
      x: chartPressState.x.position.value,
    }),
    payload => {
      if (!payload.active || payload.index < 0) {
        runOnJS(setActiveIndex)(null);
        return;
      }
      runOnJS(setActiveIndex)(payload.index);
      runOnJS(setActiveXPosition)(payload.x);
    },
    [chartPressState],
  );

  useEffect(() => {
    setActiveIndex(null);
  }, [zoomMode, displayData.length]);

  const activePoint =
    activeIndex === null ? null : displayData[activeIndex] ?? null;

  const tooltipLeft = useMemo(() => {
    if (activeIndex === null || chartWidth <= 0 || displayData.length <= 0) {
      return 8;
    }
    const rawLeft = activeXPosition - TOOLTIP_WIDTH / 2;
    return Math.max(8, Math.min(rawLeft, chartWidth - TOOLTIP_WIDTH - 8));
  }, [activeIndex, activeXPosition, chartWidth, displayData.length]);

  const comparisonText = useMemo(() => {
    if (previousTotal === undefined) {
      return '';
    }
    if (previousTotal <= 0) {
      return `前${rangeDays}天暂无可比数据`;
    }
    const deltaRate = (totalAmount - previousTotal) / previousTotal;
    const symbol = deltaRate >= 0 ? '+' : '-';
    return `较前${rangeDays}天 ${symbol}${Math.abs(deltaRate * 100).toFixed(1)}%`;
  }, [previousTotal, rangeDays, totalAmount]);

  const comparisonColor = useMemo(() => {
    if (previousTotal === undefined || previousTotal <= 0) {
      return colors.muted;
    }
    const delta = totalAmount - previousTotal;
    if (type === 'INCOME') {
      return delta >= 0 ? chartTheme.positive : chartTheme.negative;
    }
    return delta <= 0 ? chartTheme.positive : chartTheme.negative;
  }, [
    chartTheme.negative,
    chartTheme.positive,
    colors.muted,
    previousTotal,
    totalAmount,
    type,
  ]);

  const leadingZeroNotice = useMemo(() => {
    if (!shouldEnableEffectiveWindow) {
      return '';
    }
    if (zoomMode === 'effective') {
      return `已切换有效区间，前${leadingZeroDays}天无${summaryNoun}记录`;
    }
    return `前${leadingZeroDays}天无${summaryNoun}记录，可切换查看有效区间`;
  }, [leadingZeroDays, shouldEnableEffectiveWindow, summaryNoun, zoomMode]);

  function handleMainChartLayout(event: LayoutChangeEvent): void {
    setChartWidth(event.nativeEvent.layout.width);
  }

  const cardTitle = `${rangeDays} 天累计${summaryNoun}走势`;
  const cardSubtitle = `累计${summaryNoun}与每日${summaryNoun}分布`;
  const emptyText = `最近${rangeDays}天暂无${summaryNoun}记录`;
  const subChartHeight = rangeDays === 30 ? SUB_CHART_HEIGHT_30 : SUB_CHART_HEIGHT_7;
  const barWidth = rangeDays === 30 ? 6 : 9;

  return (
    <Card
      mode="contained"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: chartTheme.panelBorder,
        },
      ]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.title}>
              {cardTitle}
            </Text>
            <Text variant="bodySmall" style={{color: colors.muted}}>
              {cardSubtitle}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text variant="headlineSmall" style={{color: summaryColor, fontWeight: '800'}}>
              {formatCurrency(totalAmount)}
            </Text>
            <Text variant="bodySmall" style={{color: colors.muted}}>
              日均 {formatCurrency(dailyAverage)}
            </Text>
            {comparisonText ? (
              <Text variant="labelMedium" style={{color: comparisonColor}}>
                {comparisonText}
              </Text>
            ) : null}
          </View>
        </View>

        {hasAnyData ? (
          <View style={styles.chartBlock}>
            <View style={styles.mainChartFrame} onLayout={handleMainChartLayout}>
              <CartesianChart
                data={displayData}
                xKey="x"
                yKeys={['cumulativeAmount']}
                domain={{y: [0, mainYAxisMax]}}
                domainPadding={{left: 12, right: 12}}
                padding={MAIN_CHART_PADDING}
                chartPressState={chartPressState as any}
                chartPressConfig={{
                  pan: {
                    activateAfterLongPress: 0,
                  },
                }}
                frame={{lineWidth: 0}}
                yAxis={[
                  {
                    yKeys: ['cumulativeAmount'],
                    font: axisFont,
                    tickValues: mainYAxisTicks,
                    lineColor: chartTheme.axisGrid,
                    lineWidth: 1,
                    labelColor: chartTheme.axisText,
                    labelOffset: 6,
                    formatYLabel: value => formatAxisCurrency(Number(value)),
                  },
                ]}>
                {({chartBounds, points}) => {
                  const mainPoints = points.cumulativeAmount;
                  const activeMainPoint =
                    activeIndex === null ? null : mainPoints[activeIndex] ?? null;

                  return (
                    <>
                      <Area
                        points={mainPoints}
                        y0={chartBounds.bottom}
                        color={fillColor}
                        opacity={0.55}
                        curveType="linear"
                      />
                      <Line
                        points={mainPoints}
                        curveType="linear"
                        color={lineColor}
                        strokeWidth={2.2}
                        strokeCap="round"
                      />
                      {activeMainPoint ? (
                        <>
                          <SkiaLine
                            p1={vec(activeMainPoint.x, chartBounds.bottom)}
                            p2={vec(activeMainPoint.x, chartBounds.top)}
                            color={chartTheme.neutralLine}
                            strokeWidth={1}
                            opacity={0.45}>
                            <DashPathEffect intervals={[4, 6]} />
                          </SkiaLine>
                          <Scatter
                            points={[activeMainPoint]}
                            radius={4.8}
                            color={colors.surface}
                          />
                          <Scatter
                            points={[activeMainPoint]}
                            radius={3.1}
                            color={lineColor}
                          />
                        </>
                      ) : null}
                    </>
                  );
                }}
              </CartesianChart>
              {activePoint ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.tooltipFloat,
                    {
                      left: tooltipLeft,
                      backgroundColor: chartTheme.tooltipBackground,
                      borderColor: chartTheme.tooltipBorder,
                    },
                  ]}>
                  <Text variant="labelMedium" style={{color: colors.text, fontWeight: '700'}}>
                    {activePoint.axisLabel}
                  </Text>
                  <Text variant="bodySmall" style={{color: colors.muted}}>
                    当日{summaryNoun} {formatCurrency(activePoint.rawDailyAmount)}
                  </Text>
                  <Text variant="bodySmall" style={{color: colors.muted}}>
                    累计{summaryNoun} {formatCurrency(activePoint.rawCumulativeAmount)}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.subChartFrame, {height: subChartHeight}]}>
              <Text variant="bodySmall" style={{color: colors.muted}}>
                每日{summaryNoun}
              </Text>
              <View style={styles.subChartInner}>
                <CartesianChart
                  data={displayData}
                  xKey="x"
                  yKeys={['dailyAmount']}
                  domain={{y: [0, subYAxisMax]}}
                  domainPadding={{left: 8, right: 8}}
                  padding={SUB_CHART_PADDING}
                  chartPressState={chartPressState as any}
                  chartPressConfig={{
                    pan: {
                      activateAfterLongPress: 0,
                    },
                  }}
                  frame={{lineWidth: 0}}
                  xAxis={{
                    font: axisFont,
                    lineWidth: 0,
                    labelColor: chartTheme.axisText,
                    labelOffset: 8,
                    tickValues: axisTickValues,
                    formatXLabel: label => {
                      const index = Number(label) - 1;
                      return displayData[index]?.axisLabel ?? '';
                    },
                  }}>
                  {({chartBounds, points}) => {
                    const dailyPoints = points.dailyAmount;
                    const activeDailyPoint =
                      activeIndex === null ? null : dailyPoints[activeIndex] ?? null;

                    return (
                      <>
                        <Bar
                          points={dailyPoints}
                          chartBounds={chartBounds}
                          barWidth={barWidth}
                          roundedCorners={{topLeft: 4, topRight: 4}}
                          color={lineColor}
                          opacity={0.58}
                        />
                        {activeDailyPoint ? (
                          <Bar
                            points={[activeDailyPoint]}
                            chartBounds={chartBounds}
                            barWidth={barWidth}
                            roundedCorners={{topLeft: 4, topRight: 4}}
                            color={lineColor}
                            opacity={0.95}
                          />
                        ) : null}
                      </>
                    );
                  }}
                </CartesianChart>
              </View>
            </View>

            {leadingZeroNotice ? (
              <Text variant="bodySmall" style={{color: colors.muted}}>
                {leadingZeroNotice}
              </Text>
            ) : null}
            {shouldEnableEffectiveWindow ? (
              <View style={styles.zoomSwitch}>
                <Pressable
                  onPress={() => setZoomMode('full')}
                  style={[
                    styles.zoomButton,
                    {
                      backgroundColor:
                        zoomMode === 'full' ? colors.surface : chartTheme.panelMutedFill,
                      borderColor: chartTheme.panelBorder,
                    },
                  ]}>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: zoomMode === 'full' ? colors.text : colors.muted,
                      fontWeight: zoomMode === 'full' ? '700' : '500',
                    }}>
                    全量30天
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setZoomMode('effective')}
                  style={[
                    styles.zoomButton,
                    {
                      backgroundColor:
                        zoomMode === 'effective'
                          ? colors.surface
                          : chartTheme.panelMutedFill,
                      borderColor: chartTheme.panelBorder,
                    },
                  ]}>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: zoomMode === 'effective' ? colors.text : colors.muted,
                      fontWeight: zoomMode === 'effective' ? '700' : '500',
                    }}>
                    有效区间
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <View
            style={[
              styles.emptyContainer,
              {
                borderColor: chartTheme.panelBorder,
                backgroundColor: chartTheme.panelMutedFill,
              },
            ]}>
            <Text variant="titleSmall" style={{color: colors.muted}}>
              {emptyText}
            </Text>
            <Text variant="bodySmall" style={{color: colors.muted}}>
              记一笔后，这里会展示趋势变化。
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
  },
  content: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  title: {
    fontWeight: '700',
  },
  chartBlock: {
    gap: 10,
  },
  zoomSwitch: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mainChartFrame: {
    height: MAIN_CHART_HEIGHT,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  subChartFrame: {
    borderRadius: 12,
    overflow: 'hidden',
    gap: 2,
  },
  subChartInner: {
    flex: 1,
  },
  tooltipFloat: {
    position: 'absolute',
    top: 8,
    width: TOOLTIP_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    zIndex: 2,
  },
  emptyContainer: {
    height: MAIN_CHART_HEIGHT + SUB_CHART_HEIGHT_30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
