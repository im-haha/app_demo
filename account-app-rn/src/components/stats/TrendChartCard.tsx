import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  StyleSheet,
  View,
} from 'react-native';
import {Card, Text} from 'react-native-paper';
import SvgChart, {SVGRenderer} from '@wuba/react-native-echarts/svgChart';
import * as echarts from 'echarts/core';
import {LineChart} from 'echarts/charts';
import {GridComponent, TooltipComponent} from 'echarts/components';
import {TrendPoint} from '@/types/bill';
import {useResolvedThemeMode, useThemeColors} from '@/theme';

type StatsType = 'INCOME' | 'EXPENSE';

interface Props {
  title: string;
  data: TrendPoint[];
  type: StatsType;
  rangeDays: 7 | 30;
  previousTotal?: number;
}

interface SemanticChartTokens {
  lineColor: string;
  pointColor: string;
  areaTopColor: string;
  areaBottomColor: string;
  tooltipBackground: string;
  tooltipBorder: string;
  summaryColor: string;
}

echarts.use([SVGRenderer, LineChart, GridComponent, TooltipComponent]);

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map(char => `${char}${char}`)
          .join('')
      : normalized;

  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}

function formatAxisValue(value: number): string {
  if (value >= 10000) {
    const wan = value / 10000;
    return `¥${wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1)}万`;
  }
  return `¥${Math.round(value)}`;
}

function buildVisibleLabelIndexes(length: number): Set<number> {
  const indexes = new Set<number>();
  if (length <= 0) {
    return indexes;
  }
  if (length <= 4) {
    return new Set(Array.from({length}, (_, index) => index));
  }

  const labelTarget = length <= 8 ? 4 : 5;
  const step = (length - 1) / (labelTarget - 1);
  for (let i = 0; i < labelTarget; i += 1) {
    indexes.add(Math.round(i * step));
  }
  indexes.add(0);
  indexes.add(length - 1);
  return indexes;
}

function computeYAxisMax(maxValue: number): number {
  if (maxValue <= 0) {
    return 100;
  }
  const padded = maxValue * 1.15;
  const step =
    padded <= 1000
      ? 100
      : padded <= 5000
        ? 500
        : padded <= 20000
          ? 1000
          : 5000;
  return Math.ceil(padded / step) * step;
}

function getSemanticTokens(
  type: StatsType,
  isDark: boolean,
): SemanticChartTokens {
  if (type === 'EXPENSE') {
    const base = isDark ? '#F28A62' : '#E06A3A';
    return {
      lineColor: base,
      pointColor: isDark ? '#FFBC9F' : '#C8562A',
      areaTopColor: hexToRgba(base, isDark ? 0.22 : 0.16),
      areaBottomColor: hexToRgba(base, isDark ? 0.05 : 0.03),
      tooltipBackground: isDark ? '#2A1F1A' : '#FFF7F2',
      tooltipBorder: isDark
        ? 'rgba(242,138,98,0.35)'
        : 'rgba(224,106,58,0.18)',
      summaryColor: isDark ? '#FFC9B4' : '#A34A29',
    };
  }

  const base = isDark ? '#4BC495' : '#2D9C74';
  return {
    lineColor: base,
    pointColor: isDark ? '#8CE5C5' : '#227B5B',
    areaTopColor: hexToRgba(base, isDark ? 0.22 : 0.16),
    areaBottomColor: hexToRgba(base, isDark ? 0.05 : 0.03),
    tooltipBackground: isDark ? '#1B2A24' : '#F4FBF8',
    tooltipBorder: isDark ? 'rgba(75,196,149,0.35)' : 'rgba(45,156,116,0.18)',
    summaryColor: isDark ? '#BBF4DF' : '#1E6D50',
  };
}

export default function TrendChartCard({
  title,
  data,
  type,
  rangeDays,
  previousTotal,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const chartRef = useRef<any>(null);
  const chartInstanceRef = useRef<any>(null);
  const chartIntroOpacity = useRef(new Animated.Value(1)).current;
  const chartIntroTranslate = useRef(new Animated.Value(0)).current;
  const hasMountedRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressingRef = useRef(false);
  const [chartWidth, setChartWidth] = useState(0);
  const [chartHostReady, setChartHostReady] = useState(false);
  const chartHeight = 228;

  const isDark = resolvedThemeMode === 'dark';
  const semanticTokens = useMemo(
    () => getSemanticTokens(type, isDark),
    [isDark, type],
  );
  const summaryNoun = type === 'EXPENSE' ? '支出' : '收入';

  const chartValues = useMemo(() => data.map(item => item.amount), [data]);
  const totalAmount = useMemo(
    () => chartValues.reduce((sum, amount) => sum + amount, 0),
    [chartValues],
  );
  const dailyAverage = useMemo(
    () => (data.length > 0 ? totalAmount / data.length : 0),
    [data.length, totalAmount],
  );
  const hasAnyData = chartValues.some(amount => amount > 0);
  const maxValue = useMemo(
    () => (hasAnyData ? Math.max(...chartValues) : 0),
    [chartValues, hasAnyData],
  );
  const yAxisMax = useMemo(() => computeYAxisMax(maxValue), [maxValue]);
  const peakIndex = useMemo(
    () => (hasAnyData ? chartValues.findIndex(value => value === maxValue) : -1),
    [chartValues, hasAnyData, maxValue],
  );
  const visibleLabelIndexes = useMemo(
    () => buildVisibleLabelIndexes(data.length),
    [data.length],
  );

  const comparisonText = useMemo(() => {
    if (previousTotal === undefined) {
      return '';
    }
    if (previousTotal <= 0) {
      return `暂无前${rangeDays}天可比数据`;
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
      return delta >= 0 ? semanticTokens.summaryColor : colors.expense;
    }
    return delta <= 0 ? colors.income : semanticTokens.summaryColor;
  }, [
    colors.expense,
    colors.income,
    colors.muted,
    previousTotal,
    semanticTokens.summaryColor,
    totalAmount,
    type,
  ]);

  const chartOption = useMemo(() => {
    const yAxisTextColor = isDark ? '#96A8A1' : '#8E948F';
    const gridLineColor = isDark
      ? 'rgba(190,204,198,0.14)'
      : 'rgba(26,32,44,0.06)';

    return {
      animation: true,
      animationDuration: 320,
      animationDurationUpdate: 760,
      animationEasing: 'cubicOut' as const,
      animationEasingUpdate: 'elasticOut' as const,
      animationDelayUpdate: 30,
      grid: {
        left: 6,
        right: 8,
        top: 14,
        bottom: 18,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        triggerOn: 'none',
        confine: true,
        backgroundColor: semanticTokens.tooltipBackground,
        borderWidth: 1,
        borderColor: semanticTokens.tooltipBorder,
        padding: [8, 10],
        textStyle: {
          color: colors.text,
          fontSize: 12,
        },
        axisPointer: {
          type: 'line',
          snap: true,
          lineStyle: {
            color: hexToRgba(semanticTokens.lineColor, isDark ? 0.66 : 0.55),
            width: 1,
          },
        },
        formatter: (params: any[]) => {
          const current = params?.[0];
          const value = Number(current?.value ?? 0);
          return `${current?.axisValueLabel ?? ''}\n${summaryNoun} ${formatCurrency(value)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.label),
        boundaryGap: false,
        axisLine: {show: false},
        axisTick: {show: false},
        splitLine: {show: false},
        axisLabel: {
          color: yAxisTextColor,
          fontSize: 11,
          margin: 12,
          formatter: (_value: string, index: number) =>
            visibleLabelIndexes.has(index) ? data[index]?.label ?? '' : '',
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: yAxisMax,
        splitNumber: 2,
        axisLine: {show: false},
        axisTick: {show: false},
        axisLabel: {
          color: yAxisTextColor,
          fontSize: 11,
          margin: 10,
          formatter: (value: number) => formatAxisValue(value),
        },
        splitLine: {
          lineStyle: {
            color: gridLineColor,
            width: 1,
          },
        },
      },
      series: [
        {
          name: summaryNoun,
          type: 'line',
          universalTransition: true,
          smooth: 0.28,
          showSymbol: false,
          animationDuration: 320,
          animationDurationUpdate: 760,
          animationEasing: 'cubicOut',
          animationEasingUpdate: 'elasticOut',
          data: chartValues,
          lineStyle: {
            color: semanticTokens.lineColor,
            width: 3,
          },
          itemStyle: {
            color: semanticTokens.pointColor,
            borderColor: isDark ? '#0F171B' : '#FFFFFF',
            borderWidth: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: semanticTokens.areaTopColor},
              {offset: 1, color: semanticTokens.areaBottomColor},
            ]),
          },
          markPoint:
            hasAnyData && peakIndex >= 0
              ? {
                  symbol: 'circle',
                  symbolSize: 10,
                  data: [{xAxis: peakIndex, yAxis: maxValue}],
                  label: {show: false},
                  itemStyle: {
                    color: semanticTokens.pointColor,
                    borderColor: isDark ? '#0F171B' : '#FFFFFF',
                    borderWidth: 2,
                    shadowBlur: 8,
                    shadowColor: hexToRgba(
                      semanticTokens.lineColor,
                      isDark ? 0.46 : 0.22,
                    ),
                  },
                }
              : undefined,
          z: 3,
        },
      ],
    };
  }, [
    chartValues,
    colors.text,
    data,
    hasAnyData,
    isDark,
    maxValue,
    peakIndex,
    semanticTokens.areaBottomColor,
    semanticTokens.areaTopColor,
    semanticTokens.lineColor,
    semanticTokens.pointColor,
    semanticTokens.tooltipBackground,
    semanticTokens.tooltipBorder,
    summaryNoun,
    visibleLabelIndexes,
    yAxisMax,
  ]);

  useEffect(() => {
    if (isAnyChartEmptyState(hasAnyData, chartWidth, chartHostReady)) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
      return;
    }

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, 'light', {
        renderer: 'svg',
        width: chartWidth,
        height: chartHeight,
      });
    }

    chartInstanceRef.current.resize({
      width: chartWidth,
      height: chartHeight,
    });
    chartInstanceRef.current.setOption(chartOption, {
      notMerge: false,
      lazyUpdate: true,
    });
  }, [chartHeight, chartHostReady, chartOption, chartWidth, hasAnyData]);

  useEffect(() => {
    if (!chartHostReady || !hasAnyData || !chartInstanceRef.current) {
      return;
    }

    chartInstanceRef.current.setOption(chartOption, {
      notMerge: false,
      lazyUpdate: true,
    });

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    chartIntroOpacity.setValue(0.82);
    chartIntroTranslate.setValue(10);
    Animated.parallel([
      Animated.timing(chartIntroOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(chartIntroTranslate, {
        toValue: 0,
        damping: 13,
        stiffness: 152,
        mass: 1.05,
        useNativeDriver: true,
      }),
    ]).start();
  }, [chartHostReady, chartIntroOpacity, chartIntroTranslate, chartOption, hasAnyData]);

  useEffect(
    () => () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    },
    [],
  );

  function resolveDataIndexByX(locationX: number): number {
    if (data.length <= 1 || chartWidth <= 0) {
      return 0;
    }
    const ratio = Math.min(Math.max(locationX / chartWidth, 0), 1);
    return Math.round(ratio * (data.length - 1));
  }

  function showTipByX(locationX: number): void {
    if (!chartInstanceRef.current || !hasAnyData || data.length === 0) {
      return;
    }
    const dataIndex = resolveDataIndexByX(locationX);
    chartInstanceRef.current.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex,
    });
  }

  function hideTip(): void {
    if (!chartInstanceRef.current) {
      return;
    }
    chartInstanceRef.current.dispatchAction({type: 'hideTip'});
  }

  function clearLongPressTimer(): void {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleTouchStart(event: GestureResponderEvent): void {
    if (!hasAnyData) {
      return;
    }
    clearLongPressTimer();
    isLongPressingRef.current = false;
    const startX = event.nativeEvent.locationX;

    longPressTimerRef.current = setTimeout(() => {
      isLongPressingRef.current = true;
      showTipByX(startX);
    }, 320);
  }

  function handleTouchMove(event: GestureResponderEvent): void {
    if (!isLongPressingRef.current) {
      return;
    }
    showTipByX(event.nativeEvent.locationX);
  }

  function handleTouchEnd(): void {
    clearLongPressTimer();
    if (!isLongPressingRef.current) {
      return;
    }
    isLongPressingRef.current = false;
    hideTip();
  }

  const emptyText =
    type === 'EXPENSE'
      ? `最近${rangeDays}天暂无支出记录`
      : `最近${rangeDays}天暂无收入记录`;

  return (
    <Card
      mode="contained"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(142,148,143,0.16)' : 'transparent',
        },
      ]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium">{title}</Text>
            <Text variant="bodySmall" style={{color: colors.muted}}>
              近{rangeDays}天累计{summaryNoun}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text
              variant="titleLarge"
              style={{color: semanticTokens.summaryColor, fontWeight: '800'}}>
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
          <View style={styles.chartFrame}>
            <Animated.View
              style={[
                styles.chartContainer,
                {
                  opacity: chartIntroOpacity,
                  transform: [{translateY: chartIntroTranslate}],
                },
              ]}
              onLayout={event => setChartWidth(event.nativeEvent.layout.width)}>
              {chartWidth > 0 ? (
                <SvgChart
                  ref={node => {
                    chartRef.current = node;
                    setChartHostReady(Boolean(node));
                  }}
                  style={{width: chartWidth, height: chartHeight}}
                />
              ) : null}
            </Animated.View>
            <View
              style={styles.chartGestureLayer}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            />
          </View>
        ) : (
          <View
            style={[
              styles.emptyContainer,
              {
                borderColor: hexToRgba(colors.border, isDark ? 0.62 : 0.8),
                backgroundColor: hexToRgba(colors.background, isDark ? 0.25 : 0.82),
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

function isAnyChartEmptyState(
  hasAnyData: boolean,
  chartWidth: number,
  chartHostReady: boolean,
): boolean {
  return !hasAnyData || chartWidth <= 0 || !chartHostReady;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
  },
  content: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  chartContainer: {
    height: 228,
    width: '100%',
  },
  chartFrame: {
    position: 'relative',
    width: '100%',
    height: 228,
  },
  chartGestureLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  emptyContainer: {
    height: 228,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
