import React from 'react';
import {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {Button} from 'react-native-paper';
import {useResolvedThemeMode, useThemeColors, useThemeTokens} from '@/theme';

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  tone?: ButtonTone;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

function resolveTone(mode: Props['mode'], tone: ButtonTone | undefined): ButtonTone {
  if (tone) {
    return tone;
  }
  if (mode === 'text') {
    return 'text';
  }
  if (mode === 'outlined') {
    return 'ghost';
  }
  return 'primary';
}

function resolveSizeHeight(size: ButtonSize, touchMin: number): number {
  if (size === 'sm') {
    return touchMin;
  }
  if (size === 'lg') {
    return 54;
  }
  return 48;
}

export default function AppButton({
  children,
  onPress,
  mode = 'contained',
  tone,
  size = 'md',
  loading,
  disabled,
  style,
  labelStyle,
  contentStyle,
  accessibilityLabel,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';
  const resolvedTone = resolveTone(mode, tone);
  const minHeight = resolveSizeHeight(size, tokens.size.touchMin);
  const fontSize = size === 'sm' ? 15 : 16;
  const paperMode =
    resolvedTone === 'text'
      ? 'text'
      : resolvedTone === 'ghost'
        ? 'outlined'
        : resolvedTone === 'secondary'
          ? 'contained-tonal'
          : 'contained';
  const buttonColor =
    resolvedTone === 'primary'
      ? colors.primary
      : resolvedTone === 'secondary'
        ? tokens.surface.accent
        : resolvedTone === 'danger'
          ? colors.danger
          : undefined;
  const textColor =
    resolvedTone === 'primary' || resolvedTone === 'danger'
      ? '#FFFFFF'
      : resolvedTone === 'text'
        ? colors.primary
        : colors.text;
  const rippleColor =
    resolvedTone === 'primary' || resolvedTone === 'danger'
      ? 'rgba(255,255,255,0.2)'
      : tokens.interactive.pressed;

  return (
    <Button
      mode={paperMode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      buttonColor={buttonColor}
      textColor={textColor}
      rippleColor={rippleColor}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          borderRadius: tokens.radius.lg,
          borderColor:
            resolvedTone === 'ghost'
              ? tokens.borderTone.strong
              : resolvedTone === 'text'
                ? 'transparent'
                : undefined,
          opacity: disabled ? 0.7 : 1,
          backgroundColor:
            resolvedTone === 'ghost'
              ? isDark
                ? 'rgba(255,255,255,0.02)'
                : '#FFFFFF'
              : undefined,
        },
        style,
      ]}
      contentStyle={[{minHeight, paddingHorizontal: 8}, contentStyle]}
      labelStyle={[{fontSize, fontWeight: '700', letterSpacing: 0.2}, labelStyle]}>
      {children}
    </Button>
  );
}
