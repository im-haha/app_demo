import React, {useEffect, useState} from 'react';
import {Modal, Platform, Pressable, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Text} from 'react-native-paper';
import {useThemeColors} from '@/theme';

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
  const [draftValue, setDraftValue] = useState<Date>(initialValue);

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
          backgroundColor: 'rgba(10,18,24,0.52)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}>
        <View
          style={{
            borderRadius: 22,
            paddingVertical: 16,
            paddingHorizontal: 14,
            gap: 12,
            backgroundColor: colors.surface,
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
