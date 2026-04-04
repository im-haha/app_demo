import React, {useCallback, useMemo, useState} from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput as NativeTextInput,
  View,
} from 'react-native';
import {Text, TextInput as PaperTextInput} from 'react-native-paper';
import type {TextInputProps as RNTextInputProps} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {useThemeColors, useThemeTokens} from '@/theme';

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
  nativeStyle?: boolean;
  errorText?: string;
  helperText?: string;
  successText?: string;
  disabled?: boolean;
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
  nativeStyle = false,
  errorText,
  helperText,
  successText,
  disabled = false,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const tokens = useThemeTokens();
  const isPasswordField = Boolean(secureTextEntry);
  const useNativeStyle = isPasswordField || nativeStyle;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const resolvedSecureAutoComplete =
    Platform.OS === 'ios' && isPasswordField && autoComplete === 'off'
      ? ('one-time-code' as RNTextInputProps['autoComplete'])
      : autoComplete;
  const resolvedSecureTextContentType =
    Platform.OS === 'ios' && isPasswordField && textContentType === 'none'
      ? ('oneTimeCode' as RNTextInputProps['textContentType'])
      : textContentType;
  const hasValue = value.trim().length > 0;
  const hasError = Boolean(errorText);
  const hasSuccess = !hasError && Boolean(successText);
  const helperToneColor = hasError
    ? tokens.textTone.danger
    : hasSuccess
      ? colors.success
      : tokens.textTone.secondary;

  const borderColor = useMemo(() => {
    if (disabled) {
      return tokens.interactive.disabled;
    }
    if (hasError) {
      return tokens.textTone.danger;
    }
    if (hasSuccess) {
      return colors.success;
    }
    if (focused) {
      return tokens.interactive.focus;
    }
    return tokens.borderTone.default;
  }, [colors.success, disabled, focused, hasError, hasSuccess, tokens]);

  const labelColor = useMemo(() => {
    if (hasError) {
      return tokens.textTone.danger;
    }
    if (focused || hasValue) {
      return colors.primary;
    }
    return tokens.textTone.secondary;
  }, [colors.primary, focused, hasError, hasValue, tokens.textTone.danger, tokens.textTone.secondary]);

  const handlePasswordVisibleToggle = useCallback(() => {
    setIsPasswordVisible(current => !current);
  }, []);

  const supportingText = errorText || successText || helperText;

  return (
    <View style={{gap: 8, marginTop: 2}}>
      <Text variant="labelLarge" style={{marginLeft: 12, color: labelColor, fontWeight: '600'}}>
        {label}
      </Text>
      {useNativeStyle ? (
        <View
          style={[
            styles.inputWrapper,
            {
              minHeight: tokens.size.controlHeight,
              borderRadius: tokens.radius.lg,
              borderColor,
              backgroundColor: disabled ? tokens.surface.muted : tokens.surface.default,
              paddingRight: isPasswordField ? 8 : 16,
              opacity: disabled ? 0.75 : 1,
            },
          ]}>
          <NativeTextInput
            value={value}
            editable={!disabled}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={tokens.textTone.tertiary}
            secureTextEntry={isPasswordField ? !isPasswordVisible : false}
            keyboardType={keyboardType}
            multiline={multiline}
            autoComplete={isPasswordField ? resolvedSecureAutoComplete : autoComplete}
            textContentType={isPasswordField ? resolvedSecureTextContentType : textContentType}
            importantForAutofill={importantForAutofill}
            autoCapitalize={autoCapitalize}
            autoCorrect={isPasswordField ? false : autoCorrect}
            spellCheck={isPasswordField ? false : spellCheck}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={[
              styles.input,
              multiline ? styles.multilineInput : null,
              {
                color: colors.text,
              },
            ]}
          />
          {isPasswordField ? (
            <Pressable
              accessibilityLabel={isPasswordVisible ? '隐藏口令' : '显示口令'}
              accessibilityRole="button"
              accessibilityState={{disabled}}
              disabled={disabled}
              hitSlop={8}
              onPress={handlePasswordVisibleToggle}
              style={({pressed}) => [
                styles.passwordToggleButton,
                {
                  borderRadius: tokens.radius.md,
                  backgroundColor: pressed ? tokens.interactive.pressed : 'transparent',
                },
              ]}>
              <PasswordEyeIcon color={tokens.textTone.secondary} size={20} hidden={!isPasswordVisible} />
            </Pressable>
          ) : null}
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
          editable={!disabled}
          error={hasError}
          mode="outlined"
          activeOutlineColor={borderColor}
          outlineColor={borderColor}
          textColor={colors.text}
          outlineStyle={{borderRadius: tokens.radius.lg}}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          contentStyle={{
            minHeight: tokens.size.controlHeight,
            paddingLeft: 8,
            paddingRight: 10,
            paddingVertical: 12,
            fontSize: 16,
          }}
        />
      )}
      {supportingText ? (
        <Text variant="bodySmall" style={{color: helperToneColor, lineHeight: 18, marginLeft: 2}}>
          {supportingText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    borderWidth: 1,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 8,
  },
  multilineInput: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  passwordToggleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});

export default React.memo(AppInput);
