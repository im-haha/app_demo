import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, List} from 'react-native-paper';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';

interface DangerZoneCardProps {
  onLogoutPress: () => void;
  compact?: boolean;
}

export default function DangerZoneCard({
  onLogoutPress,
  compact = false,
}: DangerZoneCardProps): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const mode = useResolvedThemeMode();
  const isDark = mode === 'dark';

  return (
    <Card
      mode="contained"
      style={{backgroundColor: colors.surface, borderRadius: tokens.radius.xl}}>
      <List.Item
        title="退出登录"
        left={() => (
          <View
            style={[
              styles.menuIcon,
              compact ? styles.menuIconCompact : null,
              {
                borderColor: isDark ? '#5A3A38' : '#F2D0CA',
                backgroundColor: isDark ? '#311F1E' : '#FFF2EF',
              },
            ]}>
            <View style={[styles.logoutBar, {backgroundColor: colors.danger}]} />
            <View style={[styles.logoutArrow, {borderColor: colors.danger}]} />
          </View>
        )}
        titleStyle={{color: colors.danger}}
        onPress={onLogoutPress}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  menuIconCompact: {
    width: 32,
    height: 32,
    borderRadius: 11,
  },
  logoutBar: {
    position: 'absolute',
    left: 9,
    width: 9,
    height: 2,
    borderRadius: 999,
  },
  logoutArrow: {
    position: 'absolute',
    left: 15,
    width: 5,
    height: 5,
    borderTopWidth: 1.8,
    borderRightWidth: 1.8,
    transform: [{rotate: '45deg'}],
  },
});
