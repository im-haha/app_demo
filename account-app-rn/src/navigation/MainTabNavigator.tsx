import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  BottomTabBarButtonProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/home/HomeScreen';
import BillListScreen from '@/screens/bill/BillListScreen';
import StatsScreen from '@/screens/stats/StatsScreen';
import MineScreen from '@/screens/mine/MineScreen';
import {MainTabParamList} from './types';
import {useThemeColors} from '@/theme';
import {tabSwitchHaptic} from '@/utils/haptics';

const Tab = createBottomTabNavigator<MainTabParamList>();

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
      style={style}
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
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, focused]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.08],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  return (
    <Animated.Text
      style={{
        color,
        fontSize: 14,
        fontWeight: focused ? '700' : '600',
        marginBottom: 2,
        opacity,
        transform: [{translateY}, {scale}],
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
    outputRange: [0.95, 1.06],
  });
  const iconTranslateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });
  const bubbleScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  let glyph: React.JSX.Element;
  if (routeName === 'Home') {
    glyph = (
      <>
        <View style={[styles.houseRoof, {borderBottomColor: color}]} />
        <View style={[styles.houseBody, {borderColor: color}]} />
      </>
    );
  } else if (routeName === 'Bills') {
    glyph = (
      <>
        <View style={[styles.docBody, {borderColor: color}]} />
        <View style={[styles.docLineTop, {backgroundColor: color}]} />
        <View style={[styles.docLineMiddle, {backgroundColor: color}]} />
        <View style={[styles.docLineBottom, {backgroundColor: color}]} />
      </>
    );
  } else if (routeName === 'Stats') {
    glyph = (
      <View style={styles.chartWrap}>
        <View style={[styles.chartBarSmall, {backgroundColor: color}]} />
        <View style={[styles.chartBarMedium, {backgroundColor: color}]} />
        <View style={[styles.chartBarLarge, {backgroundColor: color}]} />
      </View>
    );
  } else {
    glyph = (
      <>
        <View style={[styles.userHead, {borderColor: color}]} />
        <View style={[styles.userShoulder, {borderColor: color}]} />
      </>
    );
  }

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
        {glyph}
      </Animated.View>
    </Animated.View>
  );
}

export default function MainTabNavigator(): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 76,
          paddingTop: 9,
          paddingBottom: 8,
        },
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
      <Tab.Screen name="Home" component={HomeScreen} options={{title: '首页'}} />
      <Tab.Screen name="Bills" component={BillListScreen} options={{title: '账单'}} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{title: '统计'}} />
      <Tab.Screen name="Mine" component={MineScreen} options={{title: '我的'}} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeHalo: {
    position: 'absolute',
    top: -3,
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
  houseRoof: {
    position: 'absolute',
    top: 3,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 6,
  },
  houseBody: {
    position: 'absolute',
    top: 9,
    width: 14,
    height: 10,
    borderWidth: 1.8,
    borderRadius: 2.5,
    backgroundColor: 'transparent',
  },
  docBody: {
    position: 'absolute',
    top: 4,
    width: 14,
    height: 16,
    borderWidth: 1.8,
    borderRadius: 2.5,
    backgroundColor: 'transparent',
  },
  docLineTop: {
    position: 'absolute',
    top: 8,
    width: 7,
    height: 1.6,
    borderRadius: 1,
  },
  docLineMiddle: {
    position: 'absolute',
    top: 11.5,
    width: 7,
    height: 1.6,
    borderRadius: 1,
  },
  docLineBottom: {
    position: 'absolute',
    top: 15,
    width: 7,
    height: 1.6,
    borderRadius: 1,
  },
  chartWrap: {
    width: 15,
    height: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBarSmall: {
    width: 3.2,
    height: 5,
    borderRadius: 1,
  },
  chartBarMedium: {
    width: 3.2,
    height: 9,
    borderRadius: 1,
  },
  chartBarLarge: {
    width: 3.2,
    height: 12,
    borderRadius: 1,
  },
  userHead: {
    position: 'absolute',
    top: 3,
    width: 7.5,
    height: 7.5,
    borderWidth: 1.8,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  userShoulder: {
    position: 'absolute',
    top: 13,
    width: 14.5,
    height: 7.5,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'transparent',
  },
});
