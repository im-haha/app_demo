import React from 'react';
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
import {RootStackParamList} from './types';
import {useAppStore} from '@/store/appStore';
import {APP_NAME} from '@/utils/constants';
import {colors} from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function SplashFallback(): React.JSX.Element {
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
  const hydrated = useAppStore(state => state.hydrated);
  const isAuthenticated = useAppStore(state => Boolean(state.currentUserId && state.token));

  if (!hydrated) {
    return <SplashFallback />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {backgroundColor: colors.surface},
          headerTintColor: colors.text,
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
            <Stack.Screen name="BillEdit" component={BillEditScreen} options={{title: '编辑账单'}} />
            <Stack.Screen
              name="BillDetail"
              component={BillDetailScreen}
              options={{title: '账单详情'}}
            />
            <Stack.Screen name="Budget" component={BudgetScreen} options={{title: '月预算'}} />
            <Stack.Screen
              name="CategoryManage"
              component={CategoryManageScreen}
              options={{title: '分类管理'}}
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
