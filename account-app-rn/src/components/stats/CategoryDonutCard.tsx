import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {Pie, PolarChart} from 'victory-native';
import {CategoryStat} from '@/types/bill';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {getStatsChartTheme} from '@/components/stats/chart/statsChartTheme';
import {mergeTopCategories} from '@/components/stats/chart/statsChartUtils';
import {
  formatCurrency,
  formatPercent,
} from '@/components/stats/chart/statsChartFormat';

type StatsType = 'INCOME' | 'EXPENSE';

interface Props {
  title: string;
  type: StatsType;
  data: CategoryStat[];
}

interface PieDatum {
  [key: string]: string | number;
  id: string;
  label: string;
  value: number;
  color: string;
}

const DONUT_SIZE = 172;

export default function CategoryDonutCard({
  title,
  type,
  data,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const mode = useResolvedThemeMode();
  const chartTheme = getStatsChartTheme(mode);

  const donutData = useMemo(
    () => mergeTopCategories(data, chartTheme.donutPalette, 5),
    [chartTheme.donutPalette, data],
  );
  const pieData = useMemo<PieDatum[]>(
    () =>
      donutData.map(item => ({
        id: item.key,
        label: item.label,
        value: item.amount,
        color: item.color,
      })),
    [donutData],
  );
  const total = useMemo(
    () => donutData.reduce((sum, item) => sum + item.amount, 0),
    [donutData],
  );
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeItem = donutData[activeIndex] ?? null;
  const activeSliceId = activeItem?.key ?? '';

  useEffect(() => {
    setActiveIndex(0);
  }, [type, donutData.length]);

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
        <Text variant="titleMedium" style={{fontWeight: '700'}}>
          {title}
        </Text>
        {donutData.length === 0 ? (
          <Text variant="bodyMedium" style={{color: colors.muted}}>
            当前没有分类结构数据
          </Text>
        ) : (
          <View style={styles.mainRow}>
            <View style={styles.chartPanel}>
              <PolarChart
                data={pieData}
                labelKey="id"
                valueKey="value"
                colorKey="color">
                <Pie.Chart innerRadius={48} size={DONUT_SIZE}>
                  {({slice}) => {
                    const selected = slice.label === activeSliceId;
                    return (
                      <Pie.Slice opacity={selected ? 1 : 0.34}>
                        <Pie.SliceAngularInset
                          angularInset={{
                            angularStrokeColor: colors.surface,
                            angularStrokeWidth: selected ? 2 : 0,
                          }}
                        />
                      </Pie.Slice>
                    );
                  }}
                </Pie.Chart>
              </PolarChart>
              <View pointerEvents="none" style={styles.chartCenter}>
                <Text variant="labelMedium" style={{color: colors.muted}}>
                  {type === 'EXPENSE' ? '总支出' : '总收入'}
                </Text>
                <Text
                  variant="titleMedium"
                  style={{fontWeight: '800', color: colors.text}}>
                  {formatCurrency(total)}
                </Text>
              </View>
            </View>

            <View style={styles.legend}>
              {donutData.map((item, index) => {
                const selected = index === activeIndex;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setActiveIndex(index)}
                    style={[
                      styles.legendItem,
                      {
                        borderColor: selected
                          ? chartTheme.panelBorder
                          : 'transparent',
                        backgroundColor: selected
                          ? chartTheme.panelMutedFill
                          : 'transparent',
                      },
                    ]}>
                    <View style={styles.legendHeader}>
                      <View
                        style={[
                          styles.legendDot,
                          {
                            backgroundColor: item.color,
                            opacity: selected ? 1 : 0.68,
                          },
                        ]}
                      />
                      <Text
                        numberOfLines={1}
                        variant="bodyMedium"
                        style={{flex: 1, color: colors.text}}>
                        {item.label}
                      </Text>
                    </View>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: selected ? colors.text : colors.muted,
                        fontWeight: selected ? '700' : '500',
                      }}>
                      {formatCurrency(item.amount)} / {formatPercent(item.percentage)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        {activeItem ? (
          <Text variant="bodySmall" style={{color: colors.muted}}>
            当前高亮: {activeItem.label} ({formatPercent(activeItem.percentage)})
          </Text>
        ) : null}
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
    gap: 12,
  },
  mainRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chartPanel: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  legend: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  legendItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 4,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
});
