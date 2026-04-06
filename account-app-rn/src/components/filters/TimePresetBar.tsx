import React, {useMemo, useState} from 'react';
import {Pressable, StyleProp, TextStyle, View, ViewStyle} from 'react-native';
import {Menu, Text} from 'react-native-paper';
import {TimePresetOption} from '@/utils/timeRange';
import {useThemeTokens} from '@/theme';

interface TimePresetBarProps<T extends string = string> {
  value: T;
  options: TimePresetOption<T>[];
  onChange: (value: T) => void;
  labelPrefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  chipStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function TimePresetBar<T extends string = string>({
  value,
  options,
  onChange,
  labelPrefix = '时间：',
  containerStyle,
  chipStyle,
  textStyle,
}: TimePresetBarProps<T>): React.JSX.Element {
  const tokens = useThemeTokens();
  const [menuVisible, setMenuVisible] = useState(false);
  const currentLabel = useMemo(
    () => options.find(option => option.value === value)?.label ?? options[0]?.label ?? '',
    [options, value],
  );

  return (
    <View style={containerStyle}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`时间筛选，当前${currentLabel}`}
            accessibilityState={{expanded: menuVisible}}
            hitSlop={6}
            onPress={() => setMenuVisible(true)}
            style={({pressed}) => [
              {
                minHeight: tokens.size.touchMin,
                borderRadius: tokens.radius.pill,
                justifyContent: 'center',
              },
              chipStyle,
              pressed ? {backgroundColor: tokens.interactive.pressed} : null,
            ]}>
            <Text numberOfLines={1} style={textStyle}>
              {labelPrefix}
              {currentLabel}
            </Text>
          </Pressable>
        }>
        {options.map(option => (
          <Menu.Item
            key={option.value}
            title={option.label}
            onPress={() => {
              onChange(option.value);
              setMenuVisible(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
}
