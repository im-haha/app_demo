import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, Text} from 'react-native-paper';
import {ValidationError} from 'yup';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import SecureInputWarmup from '@/components/common/SecureInputWarmup';
import {withErrorCapture} from '@/lib/errorCapture';
import {reportHandledError} from '@/lib/reportError';
import {loginSchema} from '@/utils/validate';
import {useThemeColors} from '@/theme';
import {AuthStackParamList} from '@/navigation/types';
import {login} from '@/api/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type LoginFormState = {
  username: string;
  password: string;
};

type LoginContentProps = {
  username: string;
  password: string;
  errors: Record<string, string>;
  loading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmitPress: () => void;
  onNavigateRegisterPress: () => void;
  mutedColor: string;
  surfaceColor: string;
};

const LoginIntro = React.memo(function LoginIntro({
  mutedColor,
}: {
  mutedColor: string;
}): React.JSX.Element {
  return (
    <View style={styles.introSection}>
      <Text variant="headlineMedium" style={styles.introTitle}>
        解锁本地账本
      </Text>
      <Text variant="bodyMedium" style={{color: mutedColor}}>
        所有数据仅存储在本机，解锁后即可继续记账。
      </Text>
    </View>
  );
});

const LoginFields = React.memo(function LoginFields({
  username,
  password,
  errors,
  onUsernameChange,
  onPasswordChange,
}: Pick<
  LoginContentProps,
  'username' | 'password' | 'errors' | 'onUsernameChange' | 'onPasswordChange'
>): React.JSX.Element {
  return (
    <>
      <AppInput
        label="账本账号"
        value={username}
        onChangeText={onUsernameChange}
        autoComplete="username"
        textContentType="username"
        errorText={errors.username}
      />
      <AppInput
        label="解锁口令"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        autoComplete="off"
        textContentType="none"
        importantForAutofill="no"
        errorText={errors.password}
      />
    </>
  );
});

const LoginActions = React.memo(function LoginActions({
  loading,
  onSubmitPress,
  onNavigateRegisterPress,
}: Pick<LoginContentProps, 'loading' | 'onSubmitPress' | 'onNavigateRegisterPress'>): React.JSX.Element {
  return (
    <>
      <AppButton onPress={onSubmitPress} loading={loading} disabled={loading}>
        解锁账本
      </AppButton>
      <AppButton mode="text" onPress={onNavigateRegisterPress} disabled={loading}>
        首次使用，创建本地账本
      </AppButton>
    </>
  );
});

const LoginCardContent = React.memo(function LoginCardContent({
  username,
  password,
  errors,
  loading,
  onUsernameChange,
  onPasswordChange,
  onSubmitPress,
  onNavigateRegisterPress,
  mutedColor,
  surfaceColor,
}: LoginContentProps): React.JSX.Element {
  return (
    <Card mode="contained" style={[styles.card, {backgroundColor: surfaceColor}]}>
      <Card.Content style={styles.cardContent}>
        <LoginIntro mutedColor={mutedColor} />
        <LoginFields
          username={username}
          password={password}
          errors={errors}
          onUsernameChange={onUsernameChange}
          onPasswordChange={onPasswordChange}
        />
        <LoginActions
          loading={loading}
          onSubmitPress={onSubmitPress}
          onNavigateRegisterPress={onNavigateRegisterPress}
        />
      </Card.Content>
    </Card>
  );
});

function resolveUnlockError(error: unknown): {title: string; message: string} {
  const rawMessage = error instanceof Error ? error.message : '请稍后重试';
  if (rawMessage.includes('用户名或密码错误')) {
    return {
      title: '账本凭证错误',
      message: '账本账号不存在或解锁口令错误，请检查后重试。',
    };
  }
  return {
    title: '系统异常',
    message: rawMessage,
  };
}

export default function LoginScreen({navigation}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<LoginFormState>({username: '', password: ''});
  const loadingRef = useRef(false);

  const handleUsernameChange = useCallback((nextUsername: string) => {
    formRef.current.username = nextUsername;
    setUsername(current => (current === nextUsername ? current : nextUsername));
  }, []);

  const handlePasswordChange = useCallback((nextPassword: string) => {
    formRef.current.password = nextPassword;
    setPassword(current => (current === nextPassword ? current : nextPassword));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setErrors({});
      const snapshot: LoginFormState = {
        username: formRef.current.username,
        password: formRef.current.password,
      };
      await loginSchema.validate(snapshot, {abortEarly: false});
      await login({
        username: snapshot.username.trim(),
        password: snapshot.password,
      });
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        const nextErrors: Record<string, string> = {};
        error.inner.forEach(item => {
          if (item.path) {
            nextErrors[item.path] = item.message;
          }
        });
        setErrors(nextErrors);
      } else {
        const {title, message} = resolveUnlockError(error);
        if (title === '系统异常') {
          reportHandledError(error, {
            screen: 'Login',
            action: 'submit',
            feature: 'auth',
          });
        }
        Alert.alert(title, message);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  const handleSubmitPress = useMemo(
    () =>
      withErrorCapture(handleSubmit, {
        screen: 'Login',
        action: 'pressSubmit',
        feature: 'auth',
      }),
    [handleSubmit],
  );

  const handleNavigateRegister = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

  const handleNavigateRegisterPress = useMemo(
    () =>
      withErrorCapture(handleNavigateRegister, {
        screen: 'Login',
        action: 'navigateRegister',
        feature: 'auth',
      }),
    [handleNavigateRegister],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1, backgroundColor: colors.background}}>
      <SecureInputWarmup />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        <LoginCardContent
          username={username}
          password={password}
          errors={errors}
          loading={loading}
          onUsernameChange={handleUsernameChange}
          onPasswordChange={handlePasswordChange}
          onSubmitPress={handleSubmitPress}
          onNavigateRegisterPress={handleNavigateRegisterPress}
          mutedColor={colors.muted}
          surfaceColor={colors.surface}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingVertical: 48,
  },
  card: {
    borderRadius: 28,
  },
  cardContent: {
    paddingVertical: 20,
    gap: 22,
  },
  introSection: {
    gap: 8,
  },
  introTitle: {
    fontWeight: '800',
  },
});
