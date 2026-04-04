import React, {useCallback, useMemo, useState} from 'react';
import {TextInput, Text} from 'react-native-paper';
import {View} from 'react-native';
import type {TextInputProps as RNTextInputProps} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {useThemeColors} from '@/theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: RNTextInputProps['keyboardType'];
  multiline?: boolean;
  autoComplete?: RNTextInputProps['autoComplete'];
  textContentType?: RNTextInputProps['textContentType'];
  importantForAutofill?: RNTextInputProps['importantForAutofill'];
  autoCapitalize?: RNTextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  spellCheck?: boolean;
  errorText?: string;
}

type PasswordEyeIconProps = {
  size: number;
  color: string;
  hidden: boolean;
};

function PasswordEyeIcon({size, color, hidden}: PasswordEyeIconProps): React.JSX.Element {
  const iconSize = Math.max(16, size - 4);

  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12C5.1 8.2 8.3 6.3 12 6.3C15.7 6.3 18.9 8.2 21 12C18.9 15.8 15.7 17.7 12 17.7C8.3 17.7 5.1 15.8 3 12Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="2.7" stroke={color} strokeWidth={1.8} />
      {hidden ? (
        <Path
          d="M5 19L19 5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}

function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  multiline,
  autoComplete,
  textContentType,
  importantForAutofill,
  autoCapitalize = 'none',
  autoCorrect = false,
  spellCheck,
  errorText,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const isPasswordField = Boolean(secureTextEntry);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handlePasswordVisibleToggle = useCallback(() => {
    setIsPasswordVisible(current => !current);
  }, []);

  const renderPasswordIcon = useCallback(
    ({color = '#6F7A76', size = 20}: {color?: string; size?: number}) => (
      <PasswordEyeIcon
        color={color}
        size={size}
        hidden={!isPasswordVisible}
      />
    ),
    [isPasswordVisible],
  );

  const rightIcon = useMemo(
    () =>
      isPasswordField ? (
        <TextInput.Icon
          icon={renderPasswordIcon}
          forceTextInputFocus={false}
          onPress={handlePasswordVisibleToggle}
          style={{marginRight: 4}}
        />
      ) : undefined,
    [handlePasswordVisibleToggle, isPasswordField, renderPasswordIcon],
  );

  return (
    <View style={{gap: 8, marginTop: 2}}>
      <Text
        variant="labelLarge"
        style={{marginLeft: 12, color: colors.muted, fontWeight: '600'}}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={isPasswordField ? !isPasswordVisible : false}
        keyboardType={keyboardType}
        multiline={multiline}
        autoComplete={isPasswordField ? 'off' : autoComplete}
        textContentType={isPasswordField ? 'oneTimeCode' : textContentType}
        importantForAutofill={
          isPasswordField
            ? ('noExcludeDescendants' as RNTextInputProps['importantForAutofill'])
            : importantForAutofill
        }
        autoCapitalize={autoCapitalize}
        autoCorrect={isPasswordField ? false : autoCorrect}
        spellCheck={isPasswordField ? false : spellCheck}
        right={rightIcon}
        mode="outlined"
        outlineStyle={{borderRadius: 18}}
        contentStyle={{
          paddingLeft: 8,
          paddingRight: 10,
          paddingVertical: 12,
          fontSize: 16,
        }}
      />
      {errorText ? (
        <Text variant="bodySmall" style={{color: '#C44536', lineHeight: 18}}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}

export default React.memo(AppInput);
