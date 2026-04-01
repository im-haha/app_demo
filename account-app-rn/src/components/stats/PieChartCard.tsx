import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {CategoryStat} from '@/types/bill';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
import {formatCurrency} from '@/utils/format';

interface Props {
  title: string;
  data: CategoryStat[];
}

interface AnimatedCategoryProgressProps {
  progress: number;
  color: string;
  trackColor: string;
  delay: number;
}

function AnimatedCategoryProgress({
  progress,
  color,
  trackColor,
  delay,
}: AnimatedCategoryProgressProps): React.JSX.Element {
  const fillWidth = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const targetProgress = Math.min(Math.max(progress, 0), 1);
    if (trackWidth <= 0) {
      return;
    }

    fillWidth.stopAnimation();
    const targetWidth = trackWidth * targetProgress;
    const springAnim = Animated.spring(fillWidth, {
      toValue: targetWidth,
      damping: 16,
      stiffness: 165,
      mass: 0.95,
      useNativeDriver: false,
    });

    if (delay > 0) {
      Animated.sequence([Animated.delay(delay), springAnim]).start();
      return;
    }

    springAnim.start();
  }, [delay, fillWidth, progress, trackWidth]);

  return (
    <View
      style={[styles.progressTrack, {backgroundColor: trackColor}]}
      onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: fillWidth,
          },
        ]}
      />
    </View>
  );
}

export default function PieChartCard({title, data}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const trackColor = isDark
    ? 'rgba(173,190,184,0.14)'
    : 'rgba(26,32,44,0.06)';

  return (
    <Card
      mode="contained"
      style={{
        backgroundColor: colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(142,148,143,0.16)' : 'transparent',
      }}>
      <Card.Content style={{gap: 14}}>
        <Text variant="titleMedium">{title}</Text>
        {data.length === 0 ? (
          <Text variant="bodyMedium" style={{color: colors.muted}}>
            当前没有统计数据
          </Text>
        ) : (
          data.map((item, index) => (
            <View key={item.categoryId} style={{gap: 6}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text>{`${index + 1}. ${item.categoryName}`}</Text>
                <Text style={{color: colors.muted}}>
                  {formatCurrency(item.amount)} / {(item.percentage * 100).toFixed(0)}%
                </Text>
              </View>
              <AnimatedCategoryProgress
                progress={item.percentage}
                color={item.color}
                trackColor={trackColor}
                delay={index * 70}
              />
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
  },
});
