import React from 'react';
import {Button} from 'react-native-paper';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  loading?: boolean;
  disabled?: boolean;
}

export default function AppButton({
  children,
  onPress,
  mode = 'contained',
  loading,
  disabled,
}: Props): React.JSX.Element {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      contentStyle={{paddingVertical: 8}}
      labelStyle={{fontSize: 16, fontWeight: '700'}}>
      {children}
    </Button>
  );
}
