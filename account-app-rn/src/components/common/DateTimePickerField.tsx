import React from 'react';
import {Pressable, View} from 'react-native';
import {Text} from 'react-native-paper';
import {useThemeColors} from '@/theme';

interface DateTimePickerFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function DateTimePickerField({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
}: DateTimePickerFieldProps): React.JSX.Element {
  const colors = useThemeColors();
  const hasValue = Boolean(value?.trim());

  return (
    <View style={{gap: 8, marginTop: 2}}>
      <Text
        variant="labelLarge"
        style={{marginLeft: 12, color: colors.muted, fontWeight: '600'}}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{
          minHeight: 56,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(126,136,131,0.35)',
          backgroundColor: disabled ? 'rgba(130,140,136,0.12)' : colors.surface,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: disabled ? 0.65 : 1,
        }}>
        <Text
          variant="bodyLarge"
          style={{color: hasValue ? colors.text : colors.muted, flexShrink: 1}}>
          {hasValue ? value : placeholder ?? '请选择'}
        </Text>
        <Text variant="titleSmall" style={{color: colors.muted, marginLeft: 12}}>
          {'>'}
        </Text>
      </Pressable>
    </View>
  );
}
