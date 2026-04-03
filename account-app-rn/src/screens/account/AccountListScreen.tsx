import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, List, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import EmptyState from '@/components/common/EmptyState';
import {RootStackParamList} from '@/navigation/types';
import {useAppStore} from '@/store/appStore';
import {useThemeColors} from '@/theme';
import {formatCurrency} from '@/utils/format';
import {accountTypeOptions} from '@/utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountList'>;

export default function AccountListScreen({navigation}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const userAccounts = useAppStore(state =>
    state.accounts
      .filter(account => account.userId === state.currentUserId)
      .sort((left, right) => left.sortNum - right.sortNum),
  );
  const [showArchived, setShowArchived] = useState(false);

  const visibleAccounts = useMemo(
    () =>
      userAccounts.filter(account =>
        showArchived ? true : account.isArchived === false,
      ),
    [showArchived, userAccounts],
  );
  const totalBalance = useMemo(
    () =>
      userAccounts
        .filter(
          account => account.includeInTotal && account.isArchived === false,
        )
        .reduce((sum, account) => sum + account.currentBalance, 0),
    [userAccounts],
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['bottom']}>
      <ScrollView
        bounces={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          gap: 14,
        }}>
        <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
          <Card.Content style={{gap: 8}}>
            <Text variant="titleMedium" style={{fontWeight: '700', color: colors.text}}>
              账户总资产
            </Text>
            <Text variant="headlineSmall" style={{fontWeight: '800', color: colors.primary}}>
              {formatCurrency(totalBalance)}
            </Text>
            <Text variant="bodySmall" style={{color: colors.muted}}>
              仅统计“计入总资产”且未停用的账户
            </Text>
          </Card.Content>
        </Card>

        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Pressable
            onPress={() =>
              setShowArchived(current => (current === true ? false : true))
            }
            hitSlop={8}>
            <Text variant="labelLarge" style={{color: colors.primary}}>
              {showArchived ? '隐藏停用账户' : '显示停用账户'}
            </Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('AccountEdit')} hitSlop={8}>
            <Text variant="labelLarge" style={{color: colors.primary, fontWeight: '700'}}>
              + 新增账户
            </Text>
          </Pressable>
        </View>

        {visibleAccounts.length === 0 ? (
          <EmptyState title="暂无账户" description="先新增一个账户再记账。" icon="wallet-outline" />
        ) : (
          <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
            {visibleAccounts.map(account => {
              const typeLabel =
                accountTypeOptions.find(option => option.value === account.type)?.label ?? account.type;
              const archivedText = account.isArchived ? ' · 已停用' : '';
              return (
                <List.Item
                  key={account.id}
                  title={account.name}
                  description={`${typeLabel} · 期初 ${formatCurrency(account.openingBalance)}${archivedText}`}
                  right={() => (
                    <View style={{justifyContent: 'center', alignItems: 'flex-end', marginRight: 12}}>
                      <Text variant="titleSmall" style={{fontWeight: '700', color: colors.text}}>
                        {formatCurrency(account.currentBalance)}
                      </Text>
                      <Text variant="bodySmall" style={{color: colors.muted}}>
                        {account.includeInTotal ? '计入总资产' : '不计入总资产'}
                      </Text>
                    </View>
                  )}
                  onPress={() => navigation.navigate('AccountEdit', {accountId: account.id})}
                />
              );
            })}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
