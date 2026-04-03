import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {getStatsChartTheme} from '@/components/stats/chart/statsChartTheme';

export type MetricTone = 'default' | 'income' | 'expense' | 'positive' | 'negative';

interface Props {
  label: string;
  value: string;
  helper?: string;
  tone?: MetricTone;
}

function resolveToneColor(
  tone: MetricTone,
  colorTokens: ReturnType<typeof useThemeColors>,
  chartTheme: ReturnType<typeof getStatsChartTheme>,
): string {
  if (tone === 'income') {
    return colorTokens.income;
  }
  if (tone === 'expense') {
    return colorTokens.expense;
  }
  if (tone === 'positive') {
    return chartTheme.positive;
  }
  if (tone === 'negative') {
    return chartTheme.negative;
  }
  return colorTokens.text;
}

export default function StatsMetricPill({
  label,
  value,
  helper,
  tone = 'default',
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const mode = useResolvedThemeMode();
  const chartTheme = getStatsChartTheme(mode);
  const valueColor = resolveToneColor(tone, colors, chartTheme);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: chartTheme.panelMutedFill,
          borderColor: chartTheme.panelBorder,
        },
      ]}>
      <Text variant="labelSmall" style={{color: colors.muted}}>
        {label}
      </Text>
      <Text variant="titleMedium" style={{fontWeight: '800', color: valueColor}}>
        {value}
      </Text>
      {helper ? (
        <Text variant="bodySmall" style={{color: colors.muted}}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
});
