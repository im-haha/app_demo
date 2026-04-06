import React from 'react';
import {Pressable, View} from 'react-native';
import {Text} from 'react-native-paper';
import {useThemeColors, useThemeTokens} from '@/theme';

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
  const tokens = useThemeTokens();
  const hasValue = Boolean(value?.trim());

  return (
    <View style={{gap: 8, marginTop: 2}}>
      <Text
        variant="labelLarge"
        style={{marginLeft: 12, color: tokens.textTone.secondary, fontWeight: '600'}}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${hasValue ? `，当前${value}` : ''}`}
        accessibilityState={{disabled}}
        onPress={onPress}
        disabled={disabled}
        hitSlop={6}
        style={({pressed}) => ({
          minHeight: tokens.size.controlHeight,
          borderRadius: tokens.radius.lg,
          borderWidth: 1,
          borderColor: tokens.borderTone.default,
          backgroundColor: disabled
            ? tokens.surface.muted
            : pressed
              ? tokens.interactive.pressed
              : colors.surface,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: disabled ? 0.7 : 1,
        })}>
        <Text variant="bodyLarge" style={{color: hasValue ? colors.text : tokens.textTone.tertiary, flexShrink: 1}}>
          {hasValue ? value : placeholder ?? '请选择'}
        </Text>
        <Text variant="titleSmall" style={{color: tokens.textTone.secondary, marginLeft: 12}}>
          {'>'}
        </Text>
      </Pressable>
    </View>
  );
}
