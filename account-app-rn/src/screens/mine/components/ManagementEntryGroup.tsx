import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, List, Text} from 'react-native-paper';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';

interface ManagementEntryGroupProps {
  backupMenuDescription: string;
  currentThemeLabel: string;
  activeThemeLabel: string;
  onNavigateProfilePress: () => void;
  onNavigateBudgetPress: () => void;
  onNavigateAccountListPress: () => void;
  onNavigateCategoryManagePress: () => void;
  onOpenBackupMenuPress: () => void;
  onOpenThemeDialogPress: () => void;
  compact?: boolean;
}

function IconContainer({
  children,
  borderColor,
  backgroundColor,
  compact = false,
}: {
  children: React.ReactNode;
  borderColor: string;
  backgroundColor: string;
  compact?: boolean;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.menuIcon,
        compact ? styles.menuIconCompact : null,
        {
          borderColor,
          backgroundColor,
        },
      ]}>
      {children}
    </View>
  );
}

export default function ManagementEntryGroup({
  backupMenuDescription,
  currentThemeLabel,
  activeThemeLabel,
  onNavigateProfilePress,
  onNavigateBudgetPress,
  onNavigateAccountListPress,
  onNavigateCategoryManagePress,
  onOpenBackupMenuPress,
  onOpenThemeDialogPress,
  compact = false,
}: ManagementEntryGroupProps): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const mode = useResolvedThemeMode();
  const isDark = mode === 'dark';

  return (
    <Card
      mode="contained"
      style={{
        backgroundColor: colors.surface,
        borderRadius: tokens.radius.xl,
      }}>
      <List.Item
        title="个人资料"
        description="修改昵称"
        left={() => (
          <IconContainer
            compact={compact}
            borderColor={isDark ? '#335155' : '#BCD6D3'}
            backgroundColor={isDark ? '#1F3235' : '#EEF7F6'}>
            <View style={[styles.profileHead, {borderColor: colors.primary}]} />
            <View style={[styles.profileShoulder, {borderColor: colors.primary}]} />
          </IconContainer>
        )}
        onPress={onNavigateProfilePress}
      />
      <List.Item
        title="月预算"
        description="设置和查看预算进度"
        left={() => (
          <IconContainer
            compact={compact}
            borderColor={isDark ? '#5B453D' : '#F1D8C8'}
            backgroundColor={isDark ? '#302521' : '#FFF3EB'}>
            <View style={[styles.walletBody, {borderColor: colors.secondary}]} />
            <View style={[styles.walletDot, {backgroundColor: colors.secondary}]} />
          </IconContainer>
        )}
        onPress={onNavigateBudgetPress}
      />
      <List.Item
        title="账户管理"
        description="管理具体账户、余额与停用状态"
        left={() => (
          <IconContainer
            compact={compact}
            borderColor={isDark ? '#42513D' : '#D5E3CE'}
            backgroundColor={isDark ? '#273223' : '#EEF6EA'}>
            <Text style={{color: colors.primary, fontWeight: '700'}}>¥</Text>
          </IconContainer>
        )}
        onPress={onNavigateAccountListPress}
      />
      <List.Item
        title="分类管理"
        description="新增、编辑和删除分类"
        left={() => (
          <IconContainer
            compact={compact}
            borderColor={isDark ? '#3D415C' : '#D9D7EE'}
            backgroundColor={isDark ? '#25273A' : '#F4F2FD'}>
            <View style={[styles.gridDot, {left: 8, top: 8, backgroundColor: '#5C7AEA'}]} />
            <View style={[styles.gridDot, {left: 14, top: 8, backgroundColor: '#D64D7F'}]} />
            <View style={[styles.gridDot, {left: 8, top: 14, backgroundColor: '#2A9D8F'}]} />
            <View style={[styles.gridDot, {left: 14, top: 14, backgroundColor: '#E9B949'}]} />
          </IconContainer>
        )}
        onPress={onNavigateCategoryManagePress}
      />
      <List.Item
        title="数据备份"
        description={backupMenuDescription}
        left={() => (
          <IconContainer
            compact={compact}
            borderColor={isDark ? '#47616A' : '#CFE0E4'}
            backgroundColor={isDark ? '#22363D' : '#EEF6F8'}>
            <Text style={{color: colors.primary, fontWeight: '700'}}>↕</Text>
          </IconContainer>
        )}
        onPress={onOpenBackupMenuPress}
      />
      <List.Item
        title="关于"
        description="离线优先，后续可切换服务端同步"
        left={() => (
          <IconContainer
            compact={compact}
            borderColor={isDark ? '#404C5A' : '#D8DFE8'}
            backgroundColor={isDark ? '#252F3A' : '#F1F6FA'}>
            <Text style={{color: colors.primary, fontWeight: '800'}}>i</Text>
          </IconContainer>
        )}
      />
      <List.Item
        title="主题模式"
        description={`${currentThemeLabel} · 当前${activeThemeLabel}`}
        left={() => (
          <IconContainer
            compact={compact}
            borderColor={isDark ? '#4A4E66' : '#E0DAF2'}
            backgroundColor={isDark ? '#2D2D43' : '#F5F1FF'}>
            <Text style={{color: '#8F78C4', fontWeight: '700'}}>A</Text>
          </IconContainer>
        )}
        onPress={onOpenThemeDialogPress}
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
  profileHead: {
    position: 'absolute',
    top: 7,
    width: 9,
    height: 9,
    borderRadius: 999,
    borderWidth: 1.6,
  },
  profileShoulder: {
    position: 'absolute',
    top: 16,
    width: 15,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.6,
    borderBottomWidth: 0,
  },
  walletBody: {
    width: 16,
    height: 12,
    borderRadius: 4,
    borderWidth: 1.6,
  },
  walletDot: {
    position: 'absolute',
    right: 8,
    width: 3.5,
    height: 3.5,
    borderRadius: 999,
  },
  gridDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1.5,
  },
});
