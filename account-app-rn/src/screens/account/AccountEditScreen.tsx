import React, {useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, Menu, SegmentedButtons, Switch, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import EmptyState from '@/components/common/EmptyState';
import {withErrorCapture} from '@/lib/errorCapture';
import {reportHandledError} from '@/lib/reportError';
import {RootStackParamList} from '@/navigation/types';
import {useAppStore} from '@/store/appStore';
import {useThemeColors} from '@/theme';
import {AccountType} from '@/types/bill';
import {accountTypeOptions} from '@/utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountEdit'>;

export default function AccountEditScreen({navigation, route}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const accountId = route.params?.accountId;
  const getAccountById = useAppStore(state => state.getAccountById);
  const addAccountRecord = useAppStore(state => state.addAccountRecord);
  const editAccountRecord = useAppStore(state => state.editAccountRecord);
  const setAccountArchived = useAppStore(state => state.setAccountArchived);

  const account = accountId ? getAccountById(accountId) : undefined;
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'WECHAT');
  const [openingBalance, setOpeningBalance] = useState(account ? String(account.openingBalance) : '0');
  const [includeInTotal, setIncludeInTotal] = useState(account?.includeInTotal ?? true);
  const [isArchived, setIsArchived] = useState(account?.isArchived ?? false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  const typeLabel =
    accountTypeOptions.find(option => option.value === type)?.label ?? '选择账户类型';

  if (accountId && account === undefined) {
    return <EmptyState title="账户不存在" description="该账户可能已被删除或无法访问。" />;
  }

  function handleSave(): void {
    const normalizedName = name.trim();
    const parsedBalance = Number(openingBalance);

    if (normalizedName.length === 0) {
      Alert.alert('提示', '请输入账户名称');
      return;
    }
    if (Number.isFinite(parsedBalance) === false) {
      Alert.alert('提示', '期初余额格式不正确');
      return;
    }

    try {
      if (accountId && account) {
        editAccountRecord(accountId, {
          name: normalizedName,
          type,
          openingBalance: parsedBalance,
          includeInTotal,
        });
        if (isArchived === account.isArchived) {
          // no-op
        } else {
          setAccountArchived(accountId, isArchived);
        }
      } else {
        addAccountRecord({
          name: normalizedName,
          type,
          openingBalance: parsedBalance,
          includeInTotal,
        });
      }

      Alert.alert('保存成功', '账户信息已更新');
      navigation.goBack();
    } catch (error: unknown) {
      reportHandledError(error, {
        screen: 'AccountEdit',
        action: accountId ? 'editAccount' : 'createAccount',
        feature: 'account',
        extra: {
          accountId: accountId ?? null,
        },
      });
      const message = error instanceof Error ? error.message : '请稍后重试';
      Alert.alert('保存失败', message);
    }
  }

  const handleSavePress = withErrorCapture(handleSave, {
    screen: 'AccountEdit',
    action: 'pressSave',
    feature: 'account',
    extra: {
      accountId: accountId ?? null,
    },
  });

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['bottom']}>
      <ScrollView bounces={false} contentContainerStyle={{padding: 20, gap: 16, paddingBottom: 24}}>
        <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
          <Card.Content style={{gap: 14}}>
            <AppInput
              label="账户名称"
              value={name}
              onChangeText={setName}
              placeholder="例如：招商银行卡"
            />

            <View style={{gap: 8}}>
              <Text variant="titleSmall">账户类型</Text>
              <Menu
                visible={typeMenuVisible}
                onDismiss={() => setTypeMenuVisible(false)}
                anchor={
                  <SegmentedButtons
                    value={type}
                    onValueChange={() => setTypeMenuVisible(true)}
                    buttons={[{value: type, label: typeLabel}]}
                  />
                }>
                {accountTypeOptions.map(option => (
                  <Menu.Item
                    key={option.value}
                    title={option.label}
                    onPress={() => {
                      setType(option.value);
                      setTypeMenuVisible(false);
                    }}
                  />
                ))}
              </Menu>
            </View>

            <AppInput
              label="期初余额"
              value={openingBalance}
              onChangeText={setOpeningBalance}
              keyboardType="decimal-pad"
              placeholder="例如：1000"
            />

            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <View style={{flex: 1, paddingRight: 12}}>
                <Text variant="titleSmall" style={{color: colors.text}}>
                  计入总资产
                </Text>
                <Text variant="bodySmall" style={{color: colors.muted}}>
                  关闭后此账户不参与总资产统计
                </Text>
              </View>
              <Switch value={includeInTotal} onValueChange={setIncludeInTotal} />
            </View>

            {accountId ? (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View style={{flex: 1, paddingRight: 12}}>
                  <Text variant="titleSmall" style={{color: colors.text}}>
                    停用账户
                  </Text>
                  <Text variant="bodySmall" style={{color: colors.muted}}>
                    停用后不再出现在记账账户选项中
                  </Text>
                </View>
                <Switch value={isArchived} onValueChange={setIsArchived} />
              </View>
            ) : null}
          </Card.Content>
        </Card>

        <AppButton onPress={handleSavePress}>保存账户</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}
