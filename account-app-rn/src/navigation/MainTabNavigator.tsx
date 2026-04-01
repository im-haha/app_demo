import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '@/screens/home/HomeScreen';
import BillListScreen from '@/screens/bill/BillListScreen';
import StatsScreen from '@/screens/stats/StatsScreen';
import MineScreen from '@/screens/mine/MineScreen';
import {MainTabParamList} from './types';
import {colors} from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarIcon: ({color, size}) => {
          const iconMap: Record<keyof MainTabParamList, string> = {
            Home: 'home-variant-outline',
            Bills: 'text-box-multiple-outline',
            Stats: 'chart-line',
            Mine: 'account-circle-outline',
          };

          return <MaterialCommunityIcons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{title: '首页'}} />
      <Tab.Screen name="Bills" component={BillListScreen} options={{title: '账单'}} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{title: '统计'}} />
      <Tab.Screen name="Mine" component={MineScreen} options={{title: '我的'}} />
    </Tab.Navigator>
  );
}
