import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuthStore} from '@/store/authStore';
import {useResolvedThemeMode, useThemeColors} from '@/theme';
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
import {useAppStore} from '@/store/appStore';
import ProfileHeaderCard from '@/screens/mine/components/ProfileHeaderCard';
import AssetSummaryCard from '@/screens/mine/components/AssetSummaryCard';
import ManagementEntryGroup from '@/screens/mine/components/ManagementEntryGroup';
import DangerZoneCard from '@/screens/mine/components/DangerZoneCard';
import BackupPassphraseDialog from '@/screens/mine/components/BackupPassphraseDialog';
import ThemeDialog from '@/screens/mine/components/ThemeDialog';

const THEME_LABEL_MAP: Record<ThemePreference, string> = {
  SYSTEM: '跟随系统',
  LIGHT: '浅色',
  DARK: '深色（护眼）',
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
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const navigation = useMainTabNavigation<'Mine'>();
  const users = useAuthStore(state => state.users);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const logout = useAuthStore(state => state.logout);
  const themePreference = useThemeStore(state => state.preference);
  const setThemePreference = useThemeStore(state => state.setPreference);
  const accounts = useAppStore(state => state.accounts);
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
  const accountSummary = useMemo(() => {
    const userAccounts = accounts.filter(account => account.userId === currentUserId);
    const activeAccounts = userAccounts.filter(account => !account.isArchived);
    const totalBalance = activeAccounts
      .filter(account => account.includeInTotal)
      .reduce((sum, account) => sum + account.currentBalance, 0);
    return {
      totalBalance,
      accountCount: userAccounts.length,
      activeAccountCount: activeAccounts.length,
    };
  }, [accounts, currentUserId]);
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
          paddingHorizontal: compact ? 14 : 20,
          paddingBottom: compact ? 16 : 20,
          paddingTop: compact ? 8 : 12,
          gap: compact ? 12 : 16,
        }}>
        <ProfileHeaderCard
          nickname={user?.nickname}
          username={user?.username}
          compact={compact}
        />
        <AssetSummaryCard
          totalBalance={accountSummary.totalBalance}
          accountCount={accountSummary.accountCount}
          activeAccountCount={accountSummary.activeAccountCount}
          compact={compact}
        />
        <ManagementEntryGroup
          backupMenuDescription={backupMenuDescription}
          currentThemeLabel={currentThemeLabel}
          activeThemeLabel={activeThemeLabel}
          onNavigateProfilePress={handleNavigateProfilePress}
          onNavigateBudgetPress={handleNavigateBudgetPress}
          onNavigateAccountListPress={handleNavigateAccountListPress}
          onNavigateCategoryManagePress={handleNavigateCategoryManagePress}
          onOpenBackupMenuPress={handleOpenBackupMenuPress}
          onOpenThemeDialogPress={handleOpenThemeDialogPress}
          compact={compact}
        />
        <DangerZoneCard onLogoutPress={handleLogoutPress} compact={compact} />
      </ScrollView>
      <BackupPassphraseDialog
        visible={backupPassphraseModalVisible}
        passphraseAction={backupPassphraseAction}
        passphrase={backupPassphrase}
        canSubmit={canSubmitBackupPassphrase}
        onChangePassphrase={setBackupPassphrase}
        onDismiss={handleCloseBackupPassphraseModalPress}
        onConfirm={handleBackupPassphraseConfirmPress}
        compact={compact}
      />
      <ThemeDialog
        visible={themeDialogVisible}
        themePreference={themePreference}
        activeThemeLabel={activeThemeLabel}
        onDismiss={handleCloseThemeDialogPress}
        onSelect={handleSetThemePreferencePress}
        compact={compact}
      />
    </SafeAreaView>
  );
}
