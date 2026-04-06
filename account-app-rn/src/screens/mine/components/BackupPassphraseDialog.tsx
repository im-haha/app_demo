import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Modal, Portal, Text} from 'react-native-paper';
import AppInput from '@/components/common/AppInput';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';

interface BackupPassphraseDialogProps {
  visible: boolean;
  passphraseAction: 'IMPORT' | 'EXPORT' | null;
  passphrase: string;
  canSubmit: boolean;
  onChangePassphrase: (value: string) => void;
  onDismiss: () => void;
  onConfirm: () => void;
  compact?: boolean;
}

export default function BackupPassphraseDialog({
  visible,
  passphraseAction,
  passphrase,
  canSubmit,
  onChangePassphrase,
  onDismiss,
  onConfirm,
  compact = false,
}: BackupPassphraseDialogProps): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const mode = useResolvedThemeMode();
  const isDark = mode === 'dark';
  const modalMaskColor = isDark ? 'rgba(5, 10, 14, 0.74)' : 'rgba(24, 34, 33, 0.38)';
  const modalCardColor = isDark ? '#0F1C22' : '#FFF9F1';
  const modalCardBorder = isDark ? '#2E4A53' : '#D9CCB8';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          {paddingHorizontal: compact ? 16 : 24},
        ]}
        style={{backgroundColor: modalMaskColor}}>
        <View
          style={[
            styles.modalCard,
            {
              borderRadius: compact ? 22 : 24,
              backgroundColor: modalCardColor,
              borderColor: modalCardBorder,
              ...tokens.shadow.modal,
            },
          ]}>
          <Text variant="titleMedium" style={{fontWeight: '800', color: colors.text}}>
            {passphraseAction === 'EXPORT' ? '输入备份口令' : '输入导入口令'}
          </Text>
          <Text variant="bodySmall" style={{color: colors.muted}}>
            口令需手动保存，导入时必须与导出时一致。
          </Text>
          <AppInput
            label="备份口令"
            value={passphrase}
            onChangeText={onChangePassphrase}
            secureTextEntry
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            placeholder="至少 6 位"
          />
          <View style={styles.actions}>
            <Button onPress={onDismiss}>取消</Button>
            <Button mode="contained" onPress={onConfirm} disabled={!canSubmit}>
              继续
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {},
  modalCard: {
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
