import React, {useMemo, useState} from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button, Card, Dialog, List, Portal, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import {useThemeColors, useResolvedThemeMode} from '@/theme';
import {useThemeStore} from '@/store/themeStore';
import {ThemePreference} from '@/types/theme';

const DEFAULT_AVATAR = require('../../assets/images/avatar-default.jpeg');
const THEME_OPTIONS: ThemePreference[] = ['SYSTEM', 'LIGHT', 'DARK'];
const THEME_LABEL_MAP: Record<ThemePreference, string> = {
  SYSTEM: '跟随系统',
  LIGHT: '浅色',
  DARK: '深色（护眼）',
};

export default function MineScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const navigation = useNavigation<any>();
  const users = useAppStore(state => state.users);
  const currentUserId = useAppStore(state => state.currentUserId);
  const logout = useAppStore(state => state.logout);
  const themePreference = useThemeStore(state => state.preference);
  const setThemePreference = useThemeStore(state => state.setPreference);
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);
  const user = useMemo(
    () => users.find(item => item.id === currentUserId),
    [users, currentUserId],
  );
  const currentThemeLabel = THEME_LABEL_MAP[themePreference];
  const activeThemeLabel = resolvedThemeMode === 'dark' ? '深色' : '浅色';

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <ScrollView
        bounces={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 20,
          paddingTop: 12,
          gap: 16,
        }}>
        <Card
          mode="contained"
          style={{backgroundColor: colors.primary, borderRadius: 28}}>
          <Card.Content style={styles.profileCardContent}>
            <Image
              source={DEFAULT_AVATAR}
              style={[
                styles.avatar,
                {
                  borderColor: isDark ? '#8FB6AE' : '#D9F2EE',
                  backgroundColor: isDark ? '#304540' : '#DCE9E7',
                },
              ]}
            />
            <View style={{gap: 8, flex: 1}}>
              <Text
                variant="headlineSmall"
                style={{color: '#FFFFFF', fontWeight: '800'}}>
                {user?.nickname ?? '未登录用户'}
              </Text>
              <Text variant="bodyMedium" style={{color: isDark ? '#CFE5E0' : '#D9F2EE'}}>
                @{user?.username ?? '-'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card
          mode="contained"
          style={{backgroundColor: colors.surface, borderRadius: 24}}>
          <List.Item
            title="个人资料"
            description="修改昵称"
            left={() => (
              <View
                style={[
                  styles.menuIcon,
                  {
                    borderColor: isDark ? '#335155' : '#BCD6D3',
                    backgroundColor: isDark ? '#1F3235' : '#EEF7F6',
                  },
                ]}>
                <View
                  style={[styles.profileHead, {borderColor: colors.primary}]}
                />
                <View
                  style={[
                    styles.profileShoulder,
                    {borderColor: colors.primary},
                  ]}
                />
              </View>
            )}
            onPress={() => navigation.navigate('Profile')}
          />
          <List.Item
            title="月预算"
            description="设置和查看预算进度"
            left={() => (
              <View
                style={[
                  styles.menuIcon,
                  {
                    borderColor: isDark ? '#5B453D' : '#F1D8C8',
                    backgroundColor: isDark ? '#302521' : '#FFF3EB',
                  },
                ]}>
                <View
                  style={[styles.walletBody, {borderColor: colors.secondary}]}
                />
                <View
                  style={[
                    styles.walletDot,
                    {backgroundColor: colors.secondary},
                  ]}
                />
              </View>
            )}
            onPress={() => navigation.navigate('Budget')}
          />
          <List.Item
            title="分类管理"
            description="新增、编辑和删除分类"
            left={() => (
              <View
                style={[
                  styles.menuIcon,
                  {
                    borderColor: isDark ? '#3D415C' : '#D9D7EE',
                    backgroundColor: isDark ? '#25273A' : '#F4F2FD',
                  },
                ]}>
                <View
                  style={[
                    styles.gridDot,
                    {left: 8, top: 8, backgroundColor: '#5C7AEA'},
                  ]}
                />
                <View
                  style={[
                    styles.gridDot,
                    {left: 14, top: 8, backgroundColor: '#D64D7F'},
                  ]}
                />
                <View
                  style={[
                    styles.gridDot,
                    {left: 8, top: 14, backgroundColor: '#2A9D8F'},
                  ]}
                />
                <View
                  style={[
                    styles.gridDot,
                    {left: 14, top: 14, backgroundColor: '#E9B949'},
                  ]}
                />
              </View>
            )}
            onPress={() => navigation.navigate('CategoryManage')}
          />
          <List.Item
            title="关于"
            description="离线优先，后续可切换服务端同步"
            left={() => (
              <View
                style={[
                  styles.menuIcon,
                  {
                    borderColor: isDark ? '#404C5A' : '#D8DFE8',
                    backgroundColor: isDark ? '#252F3A' : '#F1F6FA',
                  },
                ]}>
                <Text style={{color: colors.primary, fontWeight: '800'}}>
                  i
                </Text>
              </View>
            )}
          />
          <List.Item
            title="主题模式"
            description={`${currentThemeLabel} · 当前${activeThemeLabel}`}
            left={() => (
              <View
                style={[
                  styles.menuIcon,
                  {
                    borderColor: isDark ? '#4A4E66' : '#E0DAF2',
                    backgroundColor: isDark ? '#2D2D43' : '#F5F1FF',
                  },
                ]}>
                <Text style={{color: '#8F78C4', fontWeight: '700'}}>A</Text>
              </View>
            )}
            onPress={() => setThemeDialogVisible(true)}
          />
        </Card>

        <Card
          mode="contained"
          style={{backgroundColor: colors.surface, borderRadius: 24}}>
          <List.Item
            title="退出登录"
            left={() => (
              <View
                style={[
                  styles.menuIcon,
                  {
                    borderColor: isDark ? '#5A3A38' : '#F2D0CA',
                    backgroundColor: isDark ? '#311F1E' : '#FFF2EF',
                  },
                ]}>
                <View
                  style={[styles.logoutBar, {backgroundColor: colors.danger}]}
                />
                <View
                  style={[styles.logoutArrow, {borderColor: colors.danger}]}
                />
              </View>
            )}
            titleStyle={{color: colors.danger}}
            onPress={logout}
          />
        </Card>
      </ScrollView>
      <Portal>
        <Dialog
          visible={themeDialogVisible}
          onDismiss={() => setThemeDialogVisible(false)}
          style={{backgroundColor: colors.surface}}>
          <Dialog.Title>主题模式</Dialog.Title>
          <Dialog.Content style={{gap: 10}}>
            {THEME_OPTIONS.map(option => (
              <Button
                key={option}
                mode={themePreference === option ? 'contained' : 'outlined'}
                buttonColor={themePreference === option ? colors.primary : undefined}
                textColor={themePreference === option ? '#FFFFFF' : colors.text}
                onPress={() => setThemePreference(option)}>
                {THEME_LABEL_MAP[option]}
              </Button>
            ))}
            <Text variant="bodySmall" style={{color: colors.muted}}>
              当前系统生效主题：{activeThemeLabel}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setThemeDialogVisible(false)}>关闭</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCardContent: {
    gap: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2.2,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
