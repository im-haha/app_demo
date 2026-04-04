import React, {useCallback, useState} from 'react';
import {Platform, Pressable, StyleSheet, TextInput as NativeTextInput, View} from 'react-native';
import {Text, TextInput as PaperTextInput} from 'react-native-paper';
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

const PasswordEyeIcon = React.memo(function PasswordEyeIcon({
  size,
  color,
  hidden,
}: PasswordEyeIconProps): React.JSX.Element {
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
});

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
  const resolvedSecureAutoComplete =
    Platform.OS === 'ios' && isPasswordField && autoComplete === 'off'
      ? ('one-time-code' as RNTextInputProps['autoComplete'])
      : autoComplete;
  const resolvedSecureTextContentType =
    Platform.OS === 'ios' && isPasswordField && textContentType === 'none'
      ? ('oneTimeCode' as RNTextInputProps['textContentType'])
      : textContentType;

  const handlePasswordVisibleToggle = useCallback(() => {
    setIsPasswordVisible(current => !current);
  }, []);

  return (
    <View style={{gap: 8, marginTop: 2}}>
      <Text
        variant="labelLarge"
        style={{marginLeft: 12, color: colors.muted, fontWeight: '600'}}>
        {label}
      </Text>
      {isPasswordField ? (
        <View
          style={[
            styles.passwordInputWrapper,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}>
          <NativeTextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            secureTextEntry={!isPasswordVisible}
            keyboardType={keyboardType}
            autoComplete={resolvedSecureAutoComplete}
            textContentType={resolvedSecureTextContentType}
            importantForAutofill={importantForAutofill}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            spellCheck={false}
            style={[
              styles.passwordInput,
              {
                color: colors.text,
              },
            ]}
          />
          <Pressable
            accessibilityLabel={isPasswordVisible ? '隐藏口令' : '显示口令'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handlePasswordVisibleToggle}
            style={styles.passwordToggleButton}>
            <PasswordEyeIcon color={colors.muted} size={20} hidden={!isPasswordVisible} />
          </Pressable>
        </View>
      ) : (
        <PaperTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          autoComplete={autoComplete}
          textContentType={textContentType}
          importantForAutofill={importantForAutofill}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          spellCheck={spellCheck}
          mode="outlined"
          outlineStyle={{borderRadius: 18}}
          contentStyle={{
            paddingLeft: 8,
            paddingRight: 10,
            paddingVertical: 12,
            fontSize: 16,
          }}
        />
      )}
      {errorText ? (
        <Text variant="bodySmall" style={{color: '#C44536', lineHeight: 18}}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  passwordInputWrapper: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 8,
  },
  passwordToggleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});

export default React.memo(AppInput);
