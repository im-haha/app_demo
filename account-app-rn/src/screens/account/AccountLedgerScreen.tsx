import React, {useMemo} from 'react';
import {SectionList, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, Text} from 'react-native-paper';
import dayjs from 'dayjs';
import {SafeAreaView} from 'react-native-safe-area-context';
import BillCard from '@/components/bill/BillCard';
import EmptyState from '@/components/common/EmptyState';
import {RootStackParamList} from '@/navigation/types';
import {listAccountLedger, PersistedAppData} from '@/services/localAppService';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {useThemeColors} from '@/theme';
import {formatCurrency, formatSignedCurrency} from '@/utils/format';
import {AccountLedgerEntry} from '@/types/bill';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountLedger'>;

interface LedgerSection {
  title: string;
  date: string;
  data: AccountLedgerEntry[];
  dayInflow: number;
  dayOutflow: number;
  dayNet: number;
}

export default function AccountLedgerScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const schemaVersion = useAppStore(state => state.schemaVersion);
  const bills = useAppStore(state => state.bills);
  const categories = useAppStore(state => state.categories);
  const accounts = useAppStore(state => state.accounts);
  const budgets = useAppStore(state => state.budgets);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const accountId = route.params.accountId;
  const ledgerEntries = useMemo(() => {
    const data: PersistedAppData = {
      schemaVersion,
      categories,
      accounts,
      bills,
      budgets,
      users: [],
      authCredentials: [],
      currentUserId,
    };
    return listAccountLedger(data, currentUserId, accountId);
  }, [schemaVersion, categories, accounts, bills, budgets, currentUserId, accountId]);

  const account = useMemo(
    () =>
      accounts.find(
        item => item.id === accountId && item.userId === currentUserId,
      ),
    [accountId, accounts, currentUserId],
  );
  const categoryMap = useMemo(() => {
    const map = new Map<number, (typeof categories)[number]>();
    categories.forEach(category => {
      map.set(category.id, category);
    });
    return map;
  }, [categories]);
  const accountNameMap = useMemo(() => {
    const map = new Map<number, string>();
    accounts
      .filter(item => item.userId === currentUserId)
      .forEach(item => {
        map.set(item.id, item.name);
      });
    return map;
  }, [accounts, currentUserId]);
  const ledgerSections = useMemo<LedgerSection[]>(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const sectionMap = new Map<string, LedgerSection>();

    ledgerEntries.forEach(entry => {
      const date = dayjs(entry.bill.billTime).format('YYYY-MM-DD');
      const title = date === today ? '今天' : date === yesterday ? '昨天' : date;
      const section = sectionMap.get(date);
      if (section) {
        section.data.push(entry);
        if (entry.signedAmount >= 0) {
          section.dayInflow += entry.signedAmount;
        } else {
          section.dayOutflow += Math.abs(entry.signedAmount);
        }
        section.dayNet += entry.signedAmount;
        return;
      }

      sectionMap.set(date, {
        title,
        date,
        data: [entry],
        dayInflow: entry.signedAmount >= 0 ? entry.signedAmount : 0,
        dayOutflow: entry.signedAmount < 0 ? Math.abs(entry.signedAmount) : 0,
        dayNet: entry.signedAmount,
      });
    });

    return Array.from(sectionMap.values()).sort(
      (left, right) => dayjs(right.date).valueOf() - dayjs(left.date).valueOf(),
    );
  }, [ledgerEntries]);
  const flowSummary = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let transferIn = 0;
    let transferOut = 0;

    ledgerEntries.forEach(entry => {
      if (entry.signedAmount >= 0) {
        inflow += entry.signedAmount;
      } else {
        outflow += Math.abs(entry.signedAmount);
      }
      if (entry.direction === 'TRANSFER_IN') {
        transferIn += entry.bill.amount;
      }
      if (entry.direction === 'TRANSFER_OUT') {
        transferOut += entry.bill.amount;
      }
    });

    return {
      inflow,
      outflow,
      transferIn,
      transferOut,
      net: inflow - outflow,
    };
  }, [ledgerEntries]);

  if (!account) {
    return <EmptyState title="账户不存在" description="该账户可能已删除或无访问权限。" />;
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['bottom']}>
      <View style={{flex: 1}}>
        <SectionList
          sections={ledgerSections}
          keyExtractor={item => `${item.bill.id}-${item.direction}`}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View style={{paddingHorizontal: 20, paddingTop: 12, gap: 12, paddingBottom: 4}}>
              <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
                <Card.Content style={{gap: 8}}>
                  <Text variant="titleMedium" style={{fontWeight: '700'}}>
                    {account.name}
                  </Text>
                  <Text variant="headlineSmall" style={{fontWeight: '800', color: colors.primary}}>
                    {formatCurrency(account.currentBalance)}
                  </Text>
                  <Text variant="bodySmall" style={{color: colors.muted}}>
                    期初 {formatCurrency(account.openingBalance)} ·{' '}
                    {account.includeInTotal ? '计入总资产' : '不计入总资产'}
                  </Text>
                </Card.Content>
              </Card>
              <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
                <Card.Content style={{gap: 8}}>
                  <Text variant="titleSmall" style={{fontWeight: '700', color: colors.text}}>
                    流水汇总
                  </Text>
                  <Text variant="bodySmall" style={{color: colors.muted}}>
                    流入 {formatCurrency(flowSummary.inflow)} · 流出 {formatCurrency(flowSummary.outflow)}
                  </Text>
                  <Text variant="bodySmall" style={{color: colors.muted}}>
                    转入 {formatCurrency(flowSummary.transferIn)} · 转出 {formatCurrency(flowSummary.transferOut)}
                  </Text>
                  <Text variant="labelLarge" style={{color: colors.primary, fontWeight: '700'}}>
                    净流动 {formatSignedCurrency(flowSummary.net)}
                  </Text>
                </Card.Content>
              </Card>
              {ledgerEntries.length === 0 ? (
                <EmptyState
                  title="暂无流水"
                  description="该账户还没有账单记录。"
                  icon="wallet-outline"
                />
              ) : null}
            </View>
          }
          renderSectionHeader={({section}) => (
            <View
              style={{
                marginTop: 6,
                marginBottom: 8,
                paddingHorizontal: 24,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text variant="titleSmall" style={{fontWeight: '700', color: colors.text}}>
                {section.title}
              </Text>
              <Text variant="bodySmall" style={{color: colors.muted}}>
                流入 {formatCurrency(section.dayInflow)} / 流出 {formatCurrency(section.dayOutflow)} / 净
                {formatSignedCurrency(section.dayNet)}
              </Text>
            </View>
          )}
          renderItem={({item}) => (
            <View style={{paddingHorizontal: 20, marginBottom: 10}}>
              <BillCard
                bill={item.bill}
                category={categoryMap.get(item.bill.categoryId)}
                sourceAccountName={
                  item.bill.accountId ? accountNameMap.get(item.bill.accountId) : undefined
                }
                transferTargetAccountName={
                  item.bill.transferTargetAccountId
                    ? accountNameMap.get(item.bill.transferTargetAccountId)
                    : undefined
                }
                accountPerspectiveAccountId={accountId}
                onPress={() =>
                  navigation.navigate('BillDetail', {
                    billId: item.bill.id,
                  })
                }
              />
            </View>
          )}
          contentContainerStyle={{paddingBottom: 24}}
        />
      </View>
    </SafeAreaView>
  );
}
