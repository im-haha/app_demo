import React from 'react';
import {Pressable, StyleProp, TextStyle, View, ViewStyle} from 'react-native';
import {Text} from 'react-native-paper';

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
      <Pressable onPress={onClear} hitSlop={8}>
        <Text variant="labelLarge" style={clearTextStyle}>
          {clearLabel}
        </Text>
      </Pressable>
    </View>
  );
}
