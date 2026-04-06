import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {
  BottomTabBarButtonProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/home/HomeScreen';
import BillListScreen from '@/screens/bill/BillListScreen';
import StatsScreen from '@/screens/stats/StatsScreen';
import MineScreen from '@/screens/mine/MineScreen';
import {MainTabParamList} from './types';
import {useThemeColors, useThemeTokens} from '@/theme';
import {tabSwitchHaptic} from '@/utils/haptics';
import TabNavIcon, {TabIconKind} from '@/components/common/icons/TabNavIcon';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON_MAP: Record<
  keyof MainTabParamList,
  {kind: TabIconKind; accessibilityLabel: string}
> = {
  Home: {
    kind: 'home',
    accessibilityLabel: '首页标签',
  },
  Bills: {
    kind: 'bills',
    accessibilityLabel: '账单标签',
  },
  Stats: {
    kind: 'stats',
    accessibilityLabel: '统计标签',
  },
  Mine: {
    kind: 'mine',
    accessibilityLabel: '我的标签',
  },
};

function HapticTabButton({
  accessibilityLabel,
  accessibilityState,
  children,
  onLongPress,
  onPress,
  onLayout,
  style,
  testID,
}: BottomTabBarButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      testID={testID}
      onLayout={onLayout}
      onLongPress={onLongPress}
      style={({pressed}) => [style as ViewStyle, pressed ? styles.tabPressed : null]}
      onPress={event => {
        tabSwitchHaptic();
        onPress?.(event);
      }}>
      {children}
    </Pressable>
  );
}

function TabLabel({
  color,
  focused,
  text,
}: {
  color: string;
  focused: boolean;
  text: string;
}): React.JSX.Element {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, focused]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });

  return (
    <Animated.Text
      style={{
        color,
        fontSize: 13,
        fontWeight: focused ? '700' : '600',
        marginBottom: 2,
        opacity,
        transform: [{scale}],
      }}>
      {text}
    </Animated.Text>
  );
}

function TabIcon({
  routeName,
  color,
  focused,
  haloColor,
}: {
  routeName: keyof MainTabParamList;
  color: string;
  focused: boolean;
  haloColor: string;
}): React.JSX.Element {
  const focusAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const iconKind = TAB_ICON_MAP[routeName].kind;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focusAnim, focused]);

  const iconScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.06],
  });
  const iconTranslateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });
  const bubbleScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Animated.View style={{transform: [{translateY: iconTranslateY}]}}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeHalo,
          {
            backgroundColor: haloColor,
            opacity: focusAnim,
            transform: [{scale: bubbleScale}],
          },
        ]}
      />
      <Animated.View style={[styles.iconBox, {transform: [{scale: iconScale}]}]}>
        <TabNavIcon kind={iconKind} color={color} focused={focused} size={23} />
      </Animated.View>
    </Animated.View>
  );
}

export default function MainTabNavigator(): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderTopColor: tokens.borderTone.default,
      height: 78,
      paddingTop: 9,
      paddingBottom: 8,
    }),
    [colors.surface, tokens.borderTone.default],
  );

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle,
        tabBarButton: props => <HapticTabButton {...props} />,
        tabBarLabel: ({color, focused, children}) => (
          <TabLabel color={color} focused={focused} text={String(children ?? '')} />
        ),
        tabBarIconStyle: {
          marginTop: 1,
        },
        tabBarIcon: ({color, focused}) => (
          <TabIcon
            routeName={route.name}
            color={color}
            focused={focused}
            haloColor={colors.tabActiveHalo}
          />
        ),
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: '首页', tabBarAccessibilityLabel: TAB_ICON_MAP.Home.accessibilityLabel}}
      />
      <Tab.Screen
        name="Bills"
        component={BillListScreen}
        options={{title: '账单', tabBarAccessibilityLabel: TAB_ICON_MAP.Bills.accessibilityLabel}}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{title: '统计', tabBarAccessibilityLabel: TAB_ICON_MAP.Stats.accessibilityLabel}}
      />
      <Tab.Screen
        name="Mine"
        component={MineScreen}
        options={{title: '我的', tabBarAccessibilityLabel: TAB_ICON_MAP.Mine.accessibilityLabel}}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeHalo: {
    position: 'absolute',
    top: -4,
    left: -8,
    right: -8,
    bottom: -2,
    borderRadius: 14,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabPressed: {
    opacity: 0.88,
  },
});
