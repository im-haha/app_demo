import React, {useMemo, useState} from 'react';
import {Pressable, StyleProp, TextStyle, ViewStyle} from 'react-native';
import {Menu, Text} from 'react-native-paper';
import {TimePresetOption} from '@/utils/timeRange';

interface TimePresetBarProps<T extends string = string> {
  value: T;
  options: TimePresetOption<T>[];
  onChange: (value: T) => void;
  labelPrefix?: string;
  chipStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function TimePresetBar<T extends string = string>({
  value,
  options,
  onChange,
  labelPrefix = '时间：',
  chipStyle,
  textStyle,
}: TimePresetBarProps<T>): React.JSX.Element {
  const [menuVisible, setMenuVisible] = useState(false);
  const currentLabel = useMemo(
    () => options.find(option => option.value === value)?.label ?? options[0]?.label ?? '',
    [options, value],
  );

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Pressable onPress={() => setMenuVisible(true)} style={chipStyle}>
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
  );
}
