import React, {useMemo, useState} from 'react';
import {Pressable, StyleProp, TextStyle, View, ViewStyle} from 'react-native';
import {Menu, Text} from 'react-native-paper';
import {Account} from '@/types/bill';
import {accountTypeOptions} from '@/utils/constants';
import {useThemeTokens} from '@/theme';

interface AccountFilterMenuProps {
  accounts: Account[];
  selectedAccountId: number | 'ALL';
  onChange: (value: number | 'ALL') => void;
  containerStyle?: StyleProp<ViewStyle>;
  chipStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allLabel?: string;
}

export default function AccountFilterMenu({
  accounts,
  selectedAccountId,
  onChange,
  containerStyle,
  chipStyle,
  textStyle,
  allLabel = '全部账户',
}: AccountFilterMenuProps): React.JSX.Element {
  const tokens = useThemeTokens();
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
    <View style={containerStyle}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`账户筛选，当前${selectedName}`}
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
    </View>
  );
}
