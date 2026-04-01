import React from 'react';
import {TextInput, Text} from 'react-native-paper';
import {View} from 'react-native';

interface Props {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  errorText?: string;
}

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  multiline,
  errorText,
}: Props): React.JSX.Element {
  return (
    <View style={{gap: 6}}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        mode="outlined"
        outlineStyle={{borderRadius: 18}}
        contentStyle={{paddingHorizontal: 8}}
      />
      {errorText ? (
        <Text variant="bodySmall" style={{color: '#C44536'}}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
