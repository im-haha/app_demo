import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing} from 'react-native';
import {Card, Text} from 'react-native-paper';
import SvgChart, {SVGRenderer} from '@wuba/react-native-echarts/svgChart';
import * as echarts from 'echarts/core';
import {BarChart, LineChart} from 'echarts/charts';
import {GridComponent, TooltipComponent} from 'echarts/components';
import {TrendPoint} from '@/types/bill';
import {colors} from '@/theme';

interface Props {
  title: string;
  data: TrendPoint[];
}

echarts.use([SVGRenderer, BarChart, LineChart, GridComponent, TooltipComponent]);

export default function TrendChartCard({title, data}: Props): React.JSX.Element {
  const chartRef = useRef<any>(null);
  const chartInstanceRef = useRef<any>(null);
  const chartIntroOpacity = useRef(new Animated.Value(1)).current;
  const chartIntroTranslate = useRef(new Animated.Value(0)).current;
  const hasMountedRef = useRef(false);
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 236;

  const chartOption = useMemo(
    () => ({
      animation: true,
      animationDuration: 560,
      animationDurationUpdate: 680,
      animationEasing: 'cubicOut' as const,
      animationEasingUpdate: 'cubicInOut' as const,
      grid: {
        left: 14,
        right: 14,
        top: 18,
        bottom: 34,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {type: 'line'},
        backgroundColor: '#253A3B',
        borderWidth: 0,
        textStyle: {color: '#FFFFFF', fontSize: 12},
        formatter: (params: any[]) => {
          const current = params[0];
          const value = Number(current?.value ?? 0);
          return `${current?.axisValueLabel ?? ''}<br/>金额: ¥${value.toFixed(2)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.label),
        axisTick: {show: false},
        axisLine: {lineStyle: {color: '#D6D0C6'}},
        axisLabel: {color: colors.muted, fontSize: 12},
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        axisLabel: {
          color: colors.muted,
          fontSize: 11,
          formatter: (value: number) => `¥${Math.round(value)}`,
        },
        splitLine: {lineStyle: {color: '#ECE4D8'}},
      },
      series: [
        {
          name: '金额',
          type: 'bar',
          data: data.map(item => item.amount),
          barWidth: 14,
          itemStyle: {
            color: '#A5C8C4',
            borderRadius: [6, 6, 2, 2],
          },
          animationDurationUpdate: 640,
          animationEasingUpdate: 'cubicOut' as const,
          z: 1,
        },
        {
          name: '趋势',
          type: 'line',
          data: data.map(item => item.amount),
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: {
            color: colors.primary,
            width: 2.6,
          },
          itemStyle: {
            color: colors.primary,
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
          areaStyle: {
            color: 'rgba(29, 77, 79, 0.12)',
          },
          animationDurationUpdate: 680,
          animationEasingUpdate: 'cubicOut' as const,
          z: 3,
        },
      ],
    }),
    [data],
  );

  useEffect(() => {
    if (!chartRef.current || chartWidth <= 0) {
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
  }, [chartHeight, chartOption, chartWidth]);

  useEffect(() => {
    if (!chartInstanceRef.current) {
      return;
    }

    chartInstanceRef.current.setOption(chartOption, true);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    chartIntroOpacity.setValue(0.35);
    chartIntroTranslate.setValue(8);
    Animated.parallel([
      Animated.timing(chartIntroOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(chartIntroTranslate, {
        toValue: 0,
        damping: 14,
        stiffness: 170,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [chartOption, chartIntroOpacity, chartIntroTranslate]);

  return (
    <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
      <Card.Content style={{gap: 16}}>
        <Text variant="titleMedium">{title}</Text>
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
      </Card.Content>
    </Card>
  );
}
