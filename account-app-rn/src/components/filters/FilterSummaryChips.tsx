import React from 'react';
import {Pressable, StyleProp, TextStyle, View, ViewStyle} from 'react-native';
import {Text} from 'react-native-paper';
import {useThemeTokens} from '@/theme';

interface FilterSummaryChipsProps {
  summaryText: string;
  onClear: () => void;
  summaryTextStyle?: StyleProp<TextStyle>;
  clearTextStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  clearLabel?: string;
}

export default function FilterSummaryChips({
  summaryText,
  onClear,
  summaryTextStyle,
  clearTextStyle,
  containerStyle,
  clearLabel = '清空',
}: FilterSummaryChipsProps): React.JSX.Element {
  const tokens = useThemeTokens();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        containerStyle,
      ]}>
      <Text variant="bodySmall" style={[{flex: 1}, summaryTextStyle]}>
        {summaryText}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={clearLabel}
        hitSlop={6}
        onPress={onClear}
        style={({pressed}) => ({
          minHeight: tokens.size.touchMin,
          minWidth: tokens.size.touchMin,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 6,
          borderRadius: tokens.radius.md,
          backgroundColor: pressed ? tokens.interactive.pressed : 'transparent',
        })}>
        <Text variant="labelLarge" style={clearTextStyle}>
          {clearLabel}
        </Text>
      </Pressable>
    </View>
  );
}
