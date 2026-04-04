import React, {useMemo, useState} from 'react';
import {Alert, Image, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Card, List, Modal, Portal, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuthStore} from '@/store/authStore';
import AppInput from '@/components/common/AppInput';
import {useThemeColors, useResolvedThemeMode} from '@/theme';
import {useThemeStore} from '@/store/themeStore';
import {ThemePreference} from '@/types/theme';
import {useMainTabNavigation} from '@/navigation/hooks';
import {exportMyData, importMyData} from '@/api/data';
import {withErrorCapture} from '@/lib/errorCapture';
import {reportHandledError} from '@/lib/reportError';
import {AppDataExportPayload} from '@/services/localAppService';
import {
  exportBackupByShare,
  pickBackupPayloadFromFile,
  writeBackupPayloadToFile,
} from '@/services/fileBackupService';

const DEFAULT_AVATAR = require('../../assets/images/avatar-default.jpeg');
const THEME_OPTIONS: ThemePreference[] = ['SYSTEM', 'LIGHT', 'DARK'];
const THEME_LABEL_MAP: Record<ThemePreference, string> = {
  SYSTEM: '跟随系统',
  LIGHT: '浅色',
  DARK: '深色（护眼）',
};
const THEME_DESC_MAP: Record<ThemePreference, string> = {
  SYSTEM: '自动跟随手机系统外观',
  LIGHT: '保持当前清爽浅色风格',
  DARK: '低亮度护眼，夜间更舒适',
};
type BackupPhase = 'idle' | 'picking' | 'confirming' | 'importing' | 'exporting';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '请稍后重试';
}

function resolveImportFailure(error: unknown): {title: string; message: string} {
  const rawMessage = getErrorMessage(error);
  if (rawMessage.startsWith('AUTO_BACKUP_FAILED::')) {
    return {
      title: '自动备份失败',
      message: rawMessage.replace('AUTO_BACKUP_FAILED::', ''),
    };
  }
  if (rawMessage.startsWith('IMPORT_APPLY_FAILED::')) {
    return {
      title: '导入应用失败',
      message: rawMessage.replace('IMPORT_APPLY_FAILED::', ''),
    };
  }
  if (rawMessage.includes('暂不支持')) {
    return {
      title: '版本不兼容',
      message: rawMessage,
    };
  }
  if (
    rawMessage.includes('校验失败') ||
    rawMessage.includes('损坏') ||
    rawMessage.includes('格式不正确') ||
    rawMessage.includes('JSON') ||
    rawMessage.includes('Unexpected token')
  ) {
    return {
      title: '备份文件损坏',
      message: rawMessage,
    };
  }
  return {
    title: '导入失败',
    message: rawMessage,
  };
}

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

function reportMineHandledError(
  error: unknown,
  action: string,
  extra?: Record<string, unknown>,
): void {
  reportHandledError(error, {
    screen: 'Mine',
    feature: 'mine',
    action,
    extra,
  });
}

export default function MineScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const navigation = useMainTabNavigation<'Mine'>();
  const users = useAuthStore(state => state.users);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const logout = useAuthStore(state => state.logout);
  const themePreference = useThemeStore(state => state.preference);
  const setThemePreference = useThemeStore(state => state.setPreference);
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);
  const [backupPassphraseModalVisible, setBackupPassphraseModalVisible] = useState(false);
  const [backupPassphraseAction, setBackupPassphraseAction] = useState<'IMPORT' | 'EXPORT' | null>(
    null,
  );
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [backupPhase, setBackupPhase] = useState<BackupPhase>('idle');
  const user = useMemo(
    () => users.find(item => item.id === currentUserId),
    [users, currentUserId],
  );
  const isBackupBusy = backupPhase !== 'idle';
  const backupMenuDescription = useMemo(() => {
    if (backupPhase === 'picking') {
      return '正在选择备份文件...';
    }
    if (backupPhase === 'confirming') {
      return '请确认是否覆盖当前账本';
    }
    if (backupPhase === 'importing') {
      return '正在导入并校验备份...';
    }
    if (backupPhase === 'exporting') {
      return '正在加密并导出备份...';
    }
    return '导出备份文件或选择文件导入';
  }, [backupPhase]);
  const currentThemeLabel = THEME_LABEL_MAP[themePreference];
  const activeThemeLabel = resolvedThemeMode === 'dark' ? '深色' : '浅色';
  const modalMaskColor = isDark
    ? 'rgba(5, 10, 14, 0.74)'
    : 'rgba(24, 34, 33, 0.38)';
  const modalCardColor = isDark ? '#0F1C22' : '#FFF9F1';
  const modalCardBorder = isDark ? '#2E4A53' : '#D9CCB8';
  const canSubmitBackupPassphrase = backupPassphrase.trim().length >= 6;

  function openBackupPassphraseModal(action: 'IMPORT' | 'EXPORT'): void {
    if (isBackupBusy) {
      return;
    }
    setBackupPassphrase('');
    setBackupPassphraseAction(action);
    setBackupPassphraseModalVisible(true);
  }

  function closeBackupPassphraseModal(): void {
    setBackupPassphraseModalVisible(false);
    setBackupPassphraseAction(null);
    setBackupPassphrase('');
  }

  function resolveBackupPassphrase(): string | null {
    const normalized = backupPassphrase.trim();
    if (normalized.length < 6) {
      Alert.alert('口令过短', '备份口令至少 6 位，请重新输入');
      return null;
    }
    return normalized;
  }

  async function handleBackupPassphraseConfirm(): Promise<void> {
    const action = backupPassphraseAction;
    const passphrase = resolveBackupPassphrase();
    if (!action || !passphrase) {
      return;
    }

    closeBackupPassphraseModal();
    if (action === 'EXPORT') {
      await handleExportBackupFile(passphrase);
      return;
    }
    await handleImportBackupFile(passphrase);
  }

  async function handleExportBackupFile(passphrase: string): Promise<void> {
    if (isBackupBusy) {
      return;
    }
    try {
      setBackupPhase('exporting');
      const response = await exportMyData();
      const fileInfo = await exportBackupByShare(response.data, {
        encryptionSecret: passphrase,
      });
      Alert.alert('导出成功', `备份文件已生成：${fileInfo.fileName}`);
    } catch (error: unknown) {
      reportMineHandledError(error, 'exportBackupFile');
      const message = getErrorMessage(error);
      Alert.alert('导出失败', message);
    } finally {
      setBackupPhase('idle');
    }
  }

  async function handleImportBackupFile(passphrase: string): Promise<void> {
    if (isBackupBusy) {
      return;
    }
    try {
      setBackupPhase('picking');
      const pickedFile = await pickBackupPayloadFromFile({
        encryptionSecret: passphrase,
      });
      if (!pickedFile) {
        setBackupPhase('idle');
        return;
      }

      const importedAtText = pickedFile.payload.exportedAt
        ? `导出时间：${pickedFile.payload.exportedAt}\n`
        : '';
      setBackupPhase('confirming');
      let shouldResetToIdleOnDismiss = true;

      Alert.alert(
        '确认导入备份',
        `${importedAtText}文件：${pickedFile.fileName}\n导入会覆盖当前账户账本数据，是否继续？`,
        [
          {
            text: '取消',
            style: 'cancel',
            onPress: () => setBackupPhase('idle'),
          },
          {
            text: '继续导入',
            style: 'destructive',
            onPress: () => {
              shouldResetToIdleOnDismiss = false;
              confirmImportBackup(pickedFile.payload, pickedFile.fileName, passphrase);
            },
          },
        ],
        {
          onDismiss: () => {
            if (shouldResetToIdleOnDismiss) {
              setBackupPhase('idle');
            }
          },
        },
      );
    } catch (error: unknown) {
      setBackupPhase('idle');
      reportMineHandledError(error, 'importBackupFile.pickOrConfirm');
      const {title, message} = resolveImportFailure(error);
      Alert.alert(title, message);
    }
  }

  async function confirmImportBackup(
    payload: AppDataExportPayload,
    sourceFileName: string,
    passphrase: string,
  ): Promise<void> {
    try {
      setBackupPhase('importing');
      const currentPayload = await exportMyData();
      let autoBackupName = '';
      try {
        const autoBackup = await writeBackupPayloadToFile(currentPayload.data, {
          prefix: 'auto-backup-before-import',
          encryptionSecret: passphrase,
        });
        autoBackupName = autoBackup.fileName;
      } catch (error: unknown) {
        throw new Error(`AUTO_BACKUP_FAILED::${getErrorMessage(error)}`);
      }
      try {
        await importMyData(payload);
      } catch (error: unknown) {
        throw new Error(`IMPORT_APPLY_FAILED::${getErrorMessage(error)}`);
      }

      const importSummary = [
        `账户 ${payload.accounts.length} 个`,
        `分类 ${payload.categories.length} 个`,
        `账单 ${payload.bills.length} 笔`,
        `预算 ${payload.budgets.length} 条`,
      ].join('，');

      Alert.alert(
        '导入成功',
        `已从 ${sourceFileName} 导入数据。\n导入摘要：${importSummary}\n导入前自动备份：${autoBackupName}`,
      );
    } catch (error: unknown) {
      reportMineHandledError(error, 'importBackupFile.confirm', {
        sourceFileName,
      });
      const {title, message} = resolveImportFailure(error);
      Alert.alert(title, message);
    } finally {
      setBackupPhase('idle');
    }
  }

  const handleNavigateProfilePress = withErrorCapture(
    () => navigation.navigate('Profile'),
    {
      screen: 'Mine',
      action: 'navigateProfile',
      feature: 'mineMenu',
    },
  );

  const handleNavigateBudgetPress = withErrorCapture(
    () => navigation.navigate('Budget'),
    {
      screen: 'Mine',
      action: 'navigateBudget',
      feature: 'mineMenu',
    },
  );

  const handleNavigateAccountListPress = withErrorCapture(
    () => navigation.navigate('AccountList'),
    {
      screen: 'Mine',
      action: 'navigateAccountList',
      feature: 'mineMenu',
    },
  );

  const handleNavigateCategoryManagePress = withErrorCapture(
    () => navigation.navigate('CategoryManage'),
    {
      screen: 'Mine',
      action: 'navigateCategoryManage',
      feature: 'mineMenu',
    },
  );

  const handleOpenBackupImportPress = withErrorCapture(
    () => openBackupPassphraseModal('IMPORT'),
    {
      screen: 'Mine',
      action: 'openBackupImport',
      feature: 'backup',
    },
  );

  const handleOpenBackupExportPress = withErrorCapture(
    () => openBackupPassphraseModal('EXPORT'),
    {
      screen: 'Mine',
      action: 'openBackupExport',
      feature: 'backup',
    },
  );

  const handleOpenBackupMenuPress = withErrorCapture(
    () => {
      if (isBackupBusy) {
        return;
      }

      Alert.alert('数据备份', '选择需要的操作', [
        {text: '取消', style: 'cancel'},
        {
          text: '导入',
          onPress: handleOpenBackupImportPress,
        },
        {
          text: '导出',
          onPress: handleOpenBackupExportPress,
        },
      ]);
    },
    {
      screen: 'Mine',
      action: 'openBackupMenu',
      feature: 'backup',
    },
  );

  const handleOpenThemeDialogPress = withErrorCapture(
    () => setThemeDialogVisible(true),
    {
      screen: 'Mine',
      action: 'openThemeDialog',
      feature: 'theme',
    },
  );

  const handleCloseThemeDialogPress = withErrorCapture(
    () => setThemeDialogVisible(false),
    {
      screen: 'Mine',
      action: 'closeThemeDialog',
      feature: 'theme',
    },
  );

  const handleSetThemePreferencePress = withErrorCapture(
    (option: ThemePreference) => setThemePreference(option),
    option => ({
      screen: 'Mine',
      action: 'setThemePreference',
      feature: 'theme',
      extra: {option},
    }),
  );

  const handleLogoutPress = withErrorCapture(() => logout(), {
    screen: 'Mine',
    action: 'logout',
    feature: 'auth',
  });

  const handleCloseBackupPassphraseModalPress = withErrorCapture(
    closeBackupPassphraseModal,
    {
      screen: 'Mine',
      action: 'closeBackupPassphraseModal',
      feature: 'backup',
    },
  );

  const handleBackupPassphraseConfirmPress = withErrorCapture(
    handleBackupPassphraseConfirm,
    {
      screen: 'Mine',
      action: 'confirmBackupPassphrase',
      feature: 'backup',
    },
  );

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
            onPress={handleNavigateProfilePress}
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
            onPress={handleNavigateBudgetPress}
          />
          <List.Item
            title="账户管理"
            description="管理具体账户、余额与停用状态"
            left={() => (
              <View
                style={[
                  styles.menuIcon,
                  {
                    borderColor: isDark ? '#42513D' : '#D5E3CE',
                    backgroundColor: isDark ? '#273223' : '#EEF6EA',
                  },
                ]}>
                <Text style={{color: colors.primary, fontWeight: '700'}}>¥</Text>
              </View>
            )}
            onPress={handleNavigateAccountListPress}
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
            onPress={handleNavigateCategoryManagePress}
          />
          <List.Item
            title="数据备份"
            description={backupMenuDescription}
            left={() => (
              <View
                style={[
                  styles.menuIcon,
                  {
                    borderColor: isDark ? '#47616A' : '#CFE0E4',
                    backgroundColor: isDark ? '#22363D' : '#EEF6F8',
                  },
                ]}>
                <Text style={{color: colors.primary, fontWeight: '700'}}>↕</Text>
              </View>
            )}
            onPress={handleOpenBackupMenuPress}
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
            onPress={handleOpenThemeDialogPress}
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
            onPress={handleLogoutPress}
          />
        </Card>
      </ScrollView>
      <Portal>
        <Modal
          visible={backupPassphraseModalVisible}
          onDismiss={handleCloseBackupPassphraseModalPress}
          contentContainerStyle={styles.passphraseModalContainer}
          style={{backgroundColor: modalMaskColor}}>
          <View
            style={[
              styles.passphraseModalCard,
              {
                backgroundColor: modalCardColor,
                borderColor: modalCardBorder,
              },
            ]}>
            <Text variant="titleMedium" style={{fontWeight: '800', color: colors.text}}>
              {backupPassphraseAction === 'EXPORT' ? '输入备份口令' : '输入导入口令'}
            </Text>
            <Text variant="bodySmall" style={{color: colors.muted}}>
              口令需手动保存，导入时必须与导出时一致。
            </Text>
            <AppInput
              label="备份口令"
              value={backupPassphrase}
              onChangeText={setBackupPassphrase}
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              placeholder="至少 6 位"
            />
            <View style={styles.passphraseActions}>
              <Button onPress={handleCloseBackupPassphraseModalPress}>取消</Button>
              <Button
                mode="contained"
                onPress={handleBackupPassphraseConfirmPress}
                disabled={!canSubmitBackupPassphrase}>
                继续
              </Button>
            </View>
          </View>
        </Modal>
        <Modal
          visible={themeDialogVisible}
          onDismiss={handleCloseThemeDialogPress}
          contentContainerStyle={styles.themeModalContainer}
          style={{backgroundColor: modalMaskColor}}>
          <View
            style={[
              styles.themeModalCard,
              {
                backgroundColor: modalCardColor,
                borderColor: modalCardBorder,
              },
            ]}>
            <View
              style={[
                styles.themeModalHeader,
                {
                  backgroundColor: hexToRgba(colors.primary, isDark ? 0.22 : 0.1),
                  borderColor: hexToRgba(colors.primary, isDark ? 0.28 : 0.16),
                },
              ]}>
              <Text variant="titleLarge" style={{fontWeight: '800', color: colors.text}}>
                主题模式
              </Text>
              <Text variant="bodySmall" style={{color: colors.muted}}>
                选择你偏好的显示风格
              </Text>
            </View>

            <View style={styles.themeOptionGroup}>
              {THEME_OPTIONS.map(option => {
                const selected = themePreference === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => handleSetThemePreferencePress(option)}
                    style={[
                      styles.themeOptionCard,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : isDark
                            ? 'rgba(255,255,255,0.02)'
                            : '#FFFFFF',
                        borderColor: selected
                          ? colors.primary
                          : isDark
                            ? '#334951'
                            : '#DDD2C0',
                      },
                    ]}>
                    <Text
                      variant="titleMedium"
                      style={{
                        color: selected ? '#FFFFFF' : colors.text,
                        fontWeight: '700',
                      }}>
                      {THEME_LABEL_MAP[option]}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{color: selected ? '#E3F0EC' : colors.muted}}>
                      {THEME_DESC_MAP[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text variant="bodySmall" style={{color: colors.muted}}>
              当前系统生效主题：{activeThemeLabel}
            </Text>

            <View style={styles.themeActions}>
              <Button onPress={handleCloseThemeDialogPress}>关闭</Button>
            </View>
          </View>
        </Modal>
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
  themeModalContainer: {
    paddingHorizontal: 24,
  },
  themeModalCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  themeModalHeader: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  themeOptionGroup: {
    gap: 10,
  },
  themeOptionCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  themeActions: {
    alignItems: 'flex-end',
  },
  passphraseModalContainer: {
    paddingHorizontal: 24,
  },
  passphraseModalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  passphraseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
