import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, View} from 'react-native';
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

export default function TrendChartCard({
  title,
  data,
  type,
  rangeDays,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const chartRef = useRef<any>(null);
  const chartInstanceRef = useRef<any>(null);
  const chartIntroOpacity = useRef(new Animated.Value(1)).current;
  const chartIntroTranslate = useRef(new Animated.Value(0)).current;
  const hasMountedRef = useRef(false);
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 220;

  const isDark = resolvedThemeMode === 'dark';
  const semanticColor = type === 'EXPENSE' ? colors.expense : colors.income;
  const totalAmount = useMemo(
    () => data.reduce((sum, point) => sum + point.amount, 0),
    [data],
  );
  const hasAnyData = data.some(point => point.amount > 0);

  const chartOption = useMemo(() => {
    const xLabelInterval =
      data.length <= 8 ? 0 : Math.max(Math.floor(data.length / 6) - 1, 0);

    return {
      animation: true,
      animationDuration: 520,
      animationDurationUpdate: 620,
      animationEasing: 'cubicOut' as const,
      animationEasingUpdate: 'cubicInOut' as const,
      grid: {
        left: 12,
        right: 12,
        top: 18,
        bottom: 28,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: hexToRgba(semanticColor, isDark ? 0.65 : 0.55),
            width: 1,
          },
        },
        backgroundColor: isDark ? '#1C272B' : '#FFFFFF',
        borderWidth: 1,
        borderColor: hexToRgba(colors.border, isDark ? 0.7 : 0.85),
        textStyle: {
          color: colors.text,
          fontSize: 12,
        },
        formatter: (params: any[]) => {
          const current = params[0];
          const value = Number(current?.value ?? 0);
          const summaryPrefix = type === 'EXPENSE' ? '支出' : '收入';

          return `${current?.axisValueLabel ?? ''}<br/>${summaryPrefix}: ¥${value.toFixed(2)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.label),
        axisTick: {show: false},
        axisLine: {
          lineStyle: {
            color: hexToRgba(colors.border, isDark ? 0.55 : 0.75),
          },
        },
        axisLabel: {
          color: colors.muted,
          fontSize: 11,
          interval: xLabelInterval,
        },
      },
      yAxis: {
        type: 'value',
        splitNumber: 3,
        axisLine: {show: false},
        axisTick: {show: false},
        axisLabel: {
          color: colors.muted,
          fontSize: 11,
          formatter: (value: number) => `¥${Math.round(value)}`,
        },
        splitLine: {
          lineStyle: {
            color: hexToRgba(colors.border, isDark ? 0.42 : 0.58),
            width: 1,
          },
        },
      },
      series: [
        {
          name: type === 'EXPENSE' ? '支出' : '收入',
          type: 'line',
          data: data.map(item => item.amount),
          smooth: 0.36,
          symbol: 'circle',
          symbolSize: (_value: number, params: any) =>
            params.dataIndex === data.length - 1 ? 8 : 4,
          lineStyle: {
            color: semanticColor,
            width: 3,
          },
          itemStyle: {
            color: semanticColor,
            borderColor: colors.surface,
            borderWidth: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: hexToRgba(semanticColor, isDark ? 0.24 : 0.16),
              },
              {
                offset: 1,
                color: hexToRgba(semanticColor, isDark ? 0.04 : 0.01),
              },
            ]),
          },
          z: 3,
        },
      ],
    };
  }, [colors.border, colors.muted, colors.surface, colors.text, data, isDark, semanticColor, type]);

  useEffect(() => {
    if (isAnyChartEmptyState(hasAnyData, chartWidth, chartRef.current)) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
      return;
    }

    const chart = echarts.init(chartRef.current, 'light', {
      renderer: 'svg',
      width: chartWidth,
      height: chartHeight,
    });
    chartInstanceRef.current = chart;
    chart.setOption(chartOption);

    return () => {
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, [chartHeight, chartOption, chartWidth, hasAnyData]);

  useEffect(() => {
    if (!chartInstanceRef.current) {
      return;
    }

    chartInstanceRef.current.setOption(chartOption, true);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    chartIntroOpacity.setValue(0.45);
    chartIntroTranslate.setValue(10);
    Animated.parallel([
      Animated.timing(chartIntroOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(chartIntroTranslate, {
        toValue: 0,
        damping: 16,
        stiffness: 170,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [chartOption, chartIntroOpacity, chartIntroTranslate]);

  const summaryPrefix = type === 'EXPENSE' ? '总支出' : '总收入';
  const emptyText =
    type === 'EXPENSE'
      ? `最近${rangeDays}天暂无支出记录`
      : `最近${rangeDays}天暂无收入记录`;

  return (
    <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
      <Card.Content style={{gap: 14}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text variant="titleMedium">{title}</Text>
          <Text variant="labelLarge" style={{color: colors.muted}}>
            近{rangeDays}天{summaryPrefix} ¥{totalAmount.toFixed(2)}
          </Text>
        </View>

        {hasAnyData ? (
          <Animated.View
            style={[
              {height: chartHeight, width: '100%'},
              {
                opacity: chartIntroOpacity,
                transform: [{translateY: chartIntroTranslate}],
              },
            ]}
            onLayout={event => setChartWidth(event.nativeEvent.layout.width)}>
            {chartWidth > 0 ? (
              <SvgChart ref={chartRef} style={{width: chartWidth, height: chartHeight}} />
            ) : null}
          </Animated.View>
        ) : (
          <View
            style={{
              height: chartHeight,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: hexToRgba(colors.border, isDark ? 0.68 : 0.9),
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: hexToRgba(colors.background, isDark ? 0.2 : 0.8),
            }}>
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
  chartRef: unknown,
): boolean {
  return !hasAnyData || chartWidth <= 0 || !chartRef;
}
