import React, {useMemo, useState} from 'react';
import {Pressable, StyleProp, TextStyle, ViewStyle} from 'react-native';
import {Menu, Text} from 'react-native-paper';
import {Account} from '@/types/bill';
import {accountTypeOptions} from '@/utils/constants';

interface AccountFilterMenuProps {
  accounts: Account[];
  selectedAccountId: number | 'ALL';
  onChange: (value: number | 'ALL') => void;
  chipStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allLabel?: string;
}

export default function AccountFilterMenu({
  accounts,
  selectedAccountId,
  onChange,
  chipStyle,
  textStyle,
  allLabel = '全部账户',
}: AccountFilterMenuProps): React.JSX.Element {
  const [menuVisible, setMenuVisible] = useState(false);
  const visibleAccounts = useMemo(
    () =>
      accounts
        .filter(account => !account.isArchived)
        .sort((left, right) => {
          if (left.sortNum !== right.sortNum) {
            return left.sortNum - right.sortNum;
          }
          return left.createdAt.localeCompare(right.createdAt);
        }),
    [accounts],
  );
  const selectedName = useMemo(() => {
    if (selectedAccountId === 'ALL') {
      return allLabel;
    }
    return visibleAccounts.find(account => account.id === selectedAccountId)?.name ?? allLabel;
  }, [allLabel, selectedAccountId, visibleAccounts]);

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
      {visibleAccounts.map(account => (
        <Menu.Item
          key={account.id}
          title={`${account.name} · ${
            accountTypeOptions.find(option => option.value === account.type)?.label ?? account.type
          }`}
          onPress={() => {
            onChange(account.id);
            setMenuVisible(false);
          }}
        />
      ))}
    </Menu>
  );
}
