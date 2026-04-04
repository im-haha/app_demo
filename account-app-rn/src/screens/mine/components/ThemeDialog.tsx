import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Button, Modal, Portal, Text} from 'react-native-paper';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';
import {ThemePreference} from '@/types/theme';

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

interface ThemeDialogProps {
  visible: boolean;
  themePreference: ThemePreference;
  activeThemeLabel: string;
  onDismiss: () => void;
  onSelect: (option: ThemePreference) => void;
  compact?: boolean;
}

export default function ThemeDialog({
  visible,
  themePreference,
  activeThemeLabel,
  onDismiss,
  onSelect,
  compact = false,
}: ThemeDialogProps): React.JSX.Element {
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
              borderRadius: compact ? 24 : 28,
              backgroundColor: modalCardColor,
              borderColor: modalCardBorder,
              ...tokens.shadow.modal,
            },
          ]}>
          <View
            style={[
              styles.modalHeader,
              {
                borderRadius: compact ? 16 : 18,
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
                  accessibilityRole="button"
                  accessibilityState={{selected}}
                  onPress={() => onSelect(option)}
                  style={[
                    styles.themeOptionCard,
                    {
                      borderRadius: compact ? 16 : 18,
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
                  <Text variant="bodySmall" style={{color: selected ? '#E3F0EC' : colors.muted}}>
                    {THEME_DESC_MAP[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text variant="bodySmall" style={{color: colors.muted}}>
            当前系统生效主题：{activeThemeLabel}
          </Text>

          <View style={styles.actions}>
            <Button onPress={onDismiss}>关闭</Button>
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
  modalHeader: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  themeOptionGroup: {
    gap: 10,
  },
  themeOptionCard: {
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  actions: {
    alignItems: 'flex-end',
  },
});
