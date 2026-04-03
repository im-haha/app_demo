import React, {useMemo, useState} from 'react';
import {Pressable, StyleProp, TextStyle, ViewStyle} from 'react-native';
import {Menu, Text} from 'react-native-paper';
import {accountTypeOptions} from '@/utils/constants';
import {AccountType} from '@/types/bill';

interface AccountFilterMenuProps {
  selectedAccountType: AccountType | 'ALL';
  onChange: (value: AccountType | 'ALL') => void;
  chipStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allLabel?: string;
}

export default function AccountFilterMenu({
  selectedAccountType,
  onChange,
  chipStyle,
  textStyle,
  allLabel = '全部账户',
}: AccountFilterMenuProps): React.JSX.Element {
  const [menuVisible, setMenuVisible] = useState(false);
  const selectedName = useMemo(() => {
    if (selectedAccountType === 'ALL') {
      return allLabel;
    }
    return (
      accountTypeOptions.find(option => option.value === selectedAccountType)?.label ?? allLabel
    );
  }, [allLabel, selectedAccountType]);

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Pressable onPress={() => setMenuVisible(true)} style={chipStyle}>
          <Text numberOfLines={1} style={textStyle}>
            {selectedName}
          </Text>
        </Pressable>
      }>
      <Menu.Item
        title={allLabel}
        onPress={() => {
          onChange('ALL');
          setMenuVisible(false);
        }}
      />
      {accountTypeOptions.map(option => (
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
