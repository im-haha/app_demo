import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';

type CategoryIconBadgeProps = {
  size?: number;
  bgColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function CategoryIconBadge({
  size = 52,
  bgColor = '#F9EBDD',
  children,
  style,
}: CategoryIconBadgeProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: bgColor,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
