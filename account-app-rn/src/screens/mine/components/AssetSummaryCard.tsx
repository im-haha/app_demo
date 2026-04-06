import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {useThemeColors, useThemeTokens} from '@/theme';
import {formatCurrency} from '@/utils/format';

interface AssetSummaryCardProps {
  totalBalance: number;
  accountCount: number;
  activeAccountCount: number;
  compact?: boolean;
}

export default function AssetSummaryCard({
  totalBalance,
  accountCount,
  activeAccountCount,
  compact = false,
}: AssetSummaryCardProps): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();

  return (
    <Card
      mode="contained"
      style={{
        backgroundColor: colors.surface,
        borderRadius: tokens.radius.xl,
        ...tokens.shadow.card,
      }}>
      <Card.Content style={[styles.content, compact ? styles.contentCompact : null]}>
        <View style={styles.metricItem}>
          <Text variant="bodySmall" style={{color: colors.muted}}>
            总资产
          </Text>
          <Text
            variant={compact ? 'titleMedium' : 'titleLarge'}
            style={[styles.metricValue, {color: colors.primary}]}>
            {formatCurrency(totalBalance)}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.metricItem}>
          <Text variant="bodySmall" style={{color: colors.muted}}>
            账户数量
          </Text>
          <Text variant="titleMedium" style={{color: colors.text, fontWeight: '700'}}>
            {accountCount} 个
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.metricItem}>
          <Text variant="bodySmall" style={{color: colors.muted}}>
            启用账户
          </Text>
          <Text variant="titleMedium" style={{color: colors.text, fontWeight: '700'}}>
            {activeAccountCount} 个
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  contentCompact: {
    gap: 8,
  },
  metricItem: {
    flex: 1,
    gap: 5,
  },
  metricValue: {
    fontWeight: '800',
  },
  separator: {
    width: 1,
    backgroundColor: 'rgba(129,145,159,0.25)',
    alignSelf: 'stretch',
  },
});
