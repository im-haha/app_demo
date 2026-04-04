import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, List, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import EmptyState from '@/components/common/EmptyState';
import AppButton from '@/components/common/AppButton';
import {RootStackParamList} from '@/navigation/types';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {useThemeColors, useThemeTokens} from '@/theme';
import {formatCurrency} from '@/utils/format';
import {accountTypeOptions} from '@/utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountList'>;

export default function AccountListScreen({navigation}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const currentUserId = useAuthStore(state => state.currentUserId);
  const userAccounts = useAppStore(state =>
    state.accounts
      .filter(account => account.userId === currentUserId)
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
          <AppButton
            tone="text"
            size="sm"
            onPress={() => setShowArchived(current => !current)}
            accessibilityLabel={showArchived ? '隐藏停用账户' : '显示停用账户'}>
            {showArchived ? '隐藏停用账户' : '显示停用账户'}
          </AppButton>
          <AppButton
            tone="secondary"
            size="sm"
            onPress={() => navigation.navigate('AccountEdit')}
            accessibilityLabel="新增账户">
            + 新增账户
          </AppButton>
        </View>

        {visibleAccounts.length === 0 ? (
          <EmptyState title="暂无账户" description="先新增一个账户再记账。" icon="wallet-outline" />
        ) : (
          <View style={{gap: 8}}>
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
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`编辑${account.name}`}
                          hitSlop={6}
                          onPress={event => {
                            event.stopPropagation();
                            navigation.navigate('AccountEdit', {accountId: account.id});
                          }}
                          style={({pressed}) => ({
                            minHeight: tokens.size.touchMin,
                            minWidth: tokens.size.touchMin,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 8,
                            borderRadius: tokens.radius.md,
                            backgroundColor: pressed ? tokens.interactive.pressed : 'transparent',
                          })}>
                          <Text variant="labelMedium" style={{color: colors.primary, fontWeight: '700'}}>
                            编辑
                          </Text>
                        </Pressable>
                      </View>
                    )}
                    onPress={() => navigation.navigate('AccountLedger', {accountId: account.id})}
                  />
                );
              })}
            </Card>
            <Text variant="bodySmall" style={{color: colors.muted}}>
              点击账户查看流水，右侧可直接编辑。
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
