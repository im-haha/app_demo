import React, {useMemo} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View} from 'react-native';
import {ActivityIndicator, Text} from 'react-native-paper';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import BillAddScreen from '@/screens/bill/BillAddScreen';
import BillDetailScreen from '@/screens/bill/BillDetailScreen';
import BillEditScreen from '@/screens/bill/BillEditScreen';
import BudgetScreen from '@/screens/budget/BudgetScreen';
import CategoryManageScreen from '@/screens/category/CategoryManageScreen';
import ProfileScreen from '@/screens/mine/ProfileScreen';
import AccountListScreen from '@/screens/account/AccountListScreen';
import AccountEditScreen from '@/screens/account/AccountEditScreen';
import AccountLedgerScreen from '@/screens/account/AccountLedgerScreen';
import {RootStackParamList} from './types';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {buildNavigationTheme, useResolvedThemeMode, useThemeColors} from '@/theme';
import {APP_NAME} from '@/utils/constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
              component={MainTabNavigator}
              options={{headerShown: false}}
            />
            <Stack.Screen name="BillAdd" component={BillAddScreen} options={{title: '新增账单'}} />
            <Stack.Screen
              name="BillEdit"
              component={BillEditScreen}
              options={{
                title: '编辑账单',
                animation: 'fade',
                headerStyle: {backgroundColor: colors.background},
              }}
            />
            <Stack.Screen
              name="BillDetail"
              component={BillDetailScreen}
              options={{
                title: '账单详情',
                animation: 'fade',
                headerStyle: {backgroundColor: colors.background},
              }}
            />
            <Stack.Screen name="Budget" component={BudgetScreen} options={{title: '月预算'}} />
            <Stack.Screen
              name="CategoryManage"
              component={CategoryManageScreen}
              options={{title: '分类管理'}}
            />
            <Stack.Screen
              name="AccountList"
              component={AccountListScreen}
              options={{title: '账户管理'}}
            />
            <Stack.Screen
              name="AccountEdit"
              component={AccountEditScreen}
              options={{title: '账户编辑'}}
            />
            <Stack.Screen
              name="AccountLedger"
              component={AccountLedgerScreen}
              options={{title: '账户流水'}}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{title: '个人资料'}} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} options={{headerShown: false}} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
