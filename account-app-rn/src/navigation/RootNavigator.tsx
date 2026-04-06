import React, {useMemo} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View} from 'react-native';
import {ActivityIndicator, Text} from 'react-native-paper';
import {RootStackParamList} from './types';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {buildNavigationTheme, useResolvedThemeMode, useThemeColors} from '@/theme';
import {APP_NAME} from '@/utils/constants';

const Stack = createNativeStackNavigator<RootStackParamList>();
const getAuthNavigator = () => require('./AuthNavigator').default;
const getMainTabNavigator = () => require('./MainTabNavigator').default;
const getBillAddScreen = () => require('@/screens/bill/BillAddScreen').default;
const getBillEditScreen = () => require('@/screens/bill/BillEditScreen').default;
const getBillDetailScreen = () => require('@/screens/bill/BillDetailScreen').default;
const getBudgetScreen = () => require('@/screens/budget/BudgetScreen').default;
const getCategoryManageScreen = () => require('@/screens/category/CategoryManageScreen').default;
const getAccountListScreen = () => require('@/screens/account/AccountListScreen').default;
const getAccountEditScreen = () => require('@/screens/account/AccountEditScreen').default;
const getAccountLedgerScreen = () => require('@/screens/account/AccountLedgerScreen').default;
const getProfileScreen = () => require('@/screens/mine/ProfileScreen').default;

function SplashFallback({colors}: {colors: ReturnType<typeof useThemeColors>}): React.JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
      }}>
      <ActivityIndicator animating size="large" color={colors.primary} />
      <Text variant="titleMedium">{APP_NAME}</Text>
    </View>
  );
}

export default function RootNavigator(): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const navigationTheme = useMemo(
    () => buildNavigationTheme(resolvedThemeMode),
    [resolvedThemeMode],
  );
  const businessHydrated = useAppStore(state => state.hydrated);
  const authHydrated = useAuthStore(state => state.hydrated);
  const isAuthenticated = useAuthStore(state => Boolean(state.currentUserId));

  if (!businessHydrated || !authHydrated) {
    return <SplashFallback colors={colors} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {backgroundColor: colors.background},
          headerTintColor: colors.text,
          headerTitleStyle: {color: colors.text, fontWeight: '700'},
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: {backgroundColor: colors.background},
        }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="MainTabs"
              getComponent={getMainTabNavigator}
              options={{headerShown: false}}
            />
            <Stack.Screen name="BillAdd" getComponent={getBillAddScreen} options={{title: '新增账单'}} />
            <Stack.Screen
              name="BillEdit"
              getComponent={getBillEditScreen}
              options={{
                title: '编辑账单',
                animation: 'fade',
                headerStyle: {backgroundColor: colors.background},
              }}
            />
            <Stack.Screen
              name="BillDetail"
              getComponent={getBillDetailScreen}
              options={{
                title: '账单详情',
                animation: 'fade',
                headerStyle: {backgroundColor: colors.background},
              }}
            />
            <Stack.Screen name="Budget" getComponent={getBudgetScreen} options={{title: '月预算'}} />
            <Stack.Screen
              name="CategoryManage"
              getComponent={getCategoryManageScreen}
              options={{title: '分类管理'}}
            />
            <Stack.Screen
              name="AccountList"
              getComponent={getAccountListScreen}
              options={{title: '账户管理'}}
            />
            <Stack.Screen
              name="AccountEdit"
              getComponent={getAccountEditScreen}
              options={{title: '账户编辑'}}
            />
            <Stack.Screen
              name="AccountLedger"
              getComponent={getAccountLedgerScreen}
              options={{title: '账户流水'}}
            />
            <Stack.Screen name="Profile" getComponent={getProfileScreen} options={{title: '个人资料'}} />
          </>
        ) : (
          <Stack.Screen name="Auth" getComponent={getAuthNavigator} options={{headerShown: false}} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
