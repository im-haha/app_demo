import React from 'react';
import {View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from 'react-native-paper';
import {colors} from '@/theme';

interface Props {
  title: string;
  description: string;
  icon?: string;
}

export default function EmptyState({
  title,
  description,
  icon = 'notebook-outline',
}: Props): React.JSX.Element {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 36,
        gap: 10,
      }}>
      <MaterialCommunityIcons name={icon} size={40} color={colors.muted} />
      <Text variant="titleMedium">{title}</Text>
      <Text variant="bodyMedium" style={{color: colors.muted, textAlign: 'center'}}>
        {description}
      </Text>
    </View>
  );
}
