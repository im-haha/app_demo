import React, {useCallback, useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, Text} from 'react-native-paper';
import {ValidationError} from 'yup';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import {withErrorCapture} from '@/lib/errorCapture';
import {reportHandledError} from '@/lib/reportError';
import {AuthStackParamList} from '@/navigation/types';
import {register} from '@/api/auth';
import {registerSchema} from '@/utils/validate';
import {useThemeColors} from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type RegisterFormState = {
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
};

function resolveCreateVaultError(error: unknown): {title: string; message: string} {
  const rawMessage = error instanceof Error ? error.message : '请稍后重试';
  if (rawMessage.includes('已存在')) {
    return {
      title: '账本账号已存在',
      message: '请更换一个账本账号后再试。',
    };
  }
  return {
    title: '系统异常',
    message: rawMessage,
  };
}

export default function RegisterScreen({navigation}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const [form, setForm] = useState<RegisterFormState>({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNicknameChange = useCallback((nickname: string) => {
    setForm(current => (current.nickname === nickname ? current : {...current, nickname}));
  }, []);

  const handleUsernameChange = useCallback((username: string) => {
    setForm(current => (current.username === username ? current : {...current, username}));
  }, []);

  const handlePasswordChange = useCallback((password: string) => {
    setForm(current => (current.password === password ? current : {...current, password}));
  }, []);

  const handleConfirmPasswordChange = useCallback((confirmPassword: string) => {
    setForm(current =>
      current.confirmPassword === confirmPassword
        ? current
        : {...current, confirmPassword},
    );
  }, []);

  async function handleSubmit() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      await registerSchema.validate(form, {abortEarly: false});
      await register({
        username: form.username.trim(),
        password: form.password,
        nickname: form.nickname.trim(),
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
        const {title, message} = resolveCreateVaultError(error);
        if (title === '系统异常') {
          reportHandledError(error, {
            screen: 'Register',
            action: 'submit',
            feature: 'auth',
          });
        }
        Alert.alert(title, message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitPress = withErrorCapture(handleSubmit, {
    screen: 'Register',
    action: 'pressSubmit',
    feature: 'auth',
  });

  const handleGoBackPress = withErrorCapture(() => navigation.goBack(), {
    screen: 'Register',
    action: 'goBack',
    feature: 'auth',
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1, backgroundColor: colors.background}}>
      <ScrollView contentContainerStyle={{padding: 20, justifyContent: 'center', flexGrow: 1}}>
        <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
          <Card.Content style={{paddingVertical: 20, gap: 20}}>
            <Text variant="headlineSmall" style={{fontWeight: '800'}}>
              创建本地账本档案
            </Text>
            <AppInput
              label="账本昵称"
              value={form.nickname}
              onChangeText={handleNicknameChange}
              autoComplete="off"
              textContentType="nickname"
              errorText={errors.nickname}
            />
            <AppInput
              label="账本账号"
              value={form.username}
              onChangeText={handleUsernameChange}
              autoComplete="username"
              textContentType="username"
              errorText={errors.username}
            />
            <AppInput
              label="解锁口令"
              value={form.password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              errorText={errors.password}
            />
            <AppInput
              label="确认口令"
              value={form.confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              errorText={errors.confirmPassword}
            />
            <AppButton onPress={handleSubmitPress} loading={loading} disabled={loading}>
              创建并解锁账本
            </AppButton>
            <AppButton mode="text" onPress={handleGoBackPress} disabled={loading}>
              返回解锁页面
            </AppButton>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
