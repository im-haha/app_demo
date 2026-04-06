import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';

const DEFAULT_AVATAR = require('../../../assets/images/avatar-default.jpeg');

interface ProfileHeaderCardProps {
  nickname?: string;
  username?: string;
  compact?: boolean;
}

export default function ProfileHeaderCard({
  nickname,
  username,
  compact = false,
}: ProfileHeaderCardProps): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const mode = useResolvedThemeMode();
  const isDark = mode === 'dark';
  const avatarSize = compact ? 56 : 64;

  return (
    <Card
      mode="contained"
      style={{
        backgroundColor: colors.primary,
        borderRadius: tokens.radius.xl + (compact ? -2 : 4),
      }}>
      <Card.Content style={styles.profileCardContent}>
        <Image
          source={DEFAULT_AVATAR}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: tokens.radius.pill,
            borderWidth: 2.2,
            borderColor: isDark ? '#8FB6AE' : '#D9F2EE',
            backgroundColor: isDark ? '#304540' : '#DCE9E7',
          }}
        />
        <View style={{gap: compact ? 6 : 8, flex: 1}}>
          <Text variant={compact ? 'titleLarge' : 'headlineSmall'} style={styles.nameText}>
            {nickname ?? '未登录用户'}
          </Text>
          <Text variant="bodyMedium" style={{color: isDark ? '#CFE5E0' : '#D9F2EE'}}>
            @{username ?? '-'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  profileCardContent: {
    gap: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  nameText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
