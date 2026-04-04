import React, {useEffect, useState} from 'react';
import {Modal, Platform, Pressable, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Text} from 'react-native-paper';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';

export type DateTimePickerMode = 'date' | 'time';

interface DateTimePickerModalProps {
  visible: boolean;
  mode: DateTimePickerMode;
  initialValue: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
}

export default function DateTimePickerModal({
  visible,
  mode,
  initialValue,
  onCancel,
  onConfirm,
}: DateTimePickerModalProps): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const [draftValue, setDraftValue] = useState<Date>(initialValue);
  const modalMaskColor = isDark ? 'rgba(5, 10, 14, 0.74)' : 'rgba(20, 28, 38, 0.44)';
  const modalCardColor = isDark ? '#0F1C22' : '#FFFFFF';
  const modalCardBorder = isDark ? '#2E4A53' : '#D5DFEA';

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDraftValue(initialValue);
  }, [initialValue, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: modalMaskColor,
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}>
        <View
          style={{
            borderRadius: 22,
            paddingVertical: 16,
            paddingHorizontal: 14,
            gap: 12,
            backgroundColor: modalCardColor,
            borderWidth: 1,
            borderColor: modalCardBorder,
            ...tokens.shadow.modal,
          }}>
          <Text variant="titleMedium" style={{fontWeight: '800', color: colors.text}}>
            {mode === 'date' ? '选择日期' : '选择时间'}
          </Text>

          <DateTimePicker
            value={draftValue}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={(_event, date) => {
              if (date) {
                setDraftValue(date);
              }
            }}
            locale={Platform.OS === 'ios' ? 'zh-CN' : undefined}
            themeVariant={Platform.OS === 'ios' ? resolvedThemeMode : undefined}
            textColor={Platform.OS === 'ios' ? colors.text : undefined}
            accentColor={Platform.OS === 'ios' ? colors.primary : undefined}
            onDismiss={() => {}}
          />

          <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10}}>
            <Pressable
              onPress={onCancel}
              style={{paddingHorizontal: 10, paddingVertical: 8}}>
              <Text variant="labelLarge" style={{color: colors.muted}}>
                取消
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(draftValue)}
              style={{paddingHorizontal: 10, paddingVertical: 8}}>
              <Text variant="labelLarge" style={{color: colors.primary, fontWeight: '700'}}>
                确定
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
