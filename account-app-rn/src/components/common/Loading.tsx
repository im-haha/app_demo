import React from 'react';
import {View} from 'react-native';
import {ActivityIndicator, Text} from 'react-native-paper';
import {colors} from '@/theme';

interface Props {
  text?: string;
}

export default function Loading({text = '加载中...'}: Props): React.JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}>
      <ActivityIndicator animating size="large" color={colors.primary} />
      <Text>{text}</Text>
    </View>
  );
}
