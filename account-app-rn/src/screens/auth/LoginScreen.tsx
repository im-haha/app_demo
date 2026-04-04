import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, Text} from 'react-native-paper';
import {ValidationError} from 'yup';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
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
  const [form, setForm] = useState<LoginFormState>({username: '', password: ''});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      await loginSchema.validate(form, {abortEarly: false});
      await login({
        username: form.username.trim(),
        password: form.password,
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
      setLoading(false);
    }
  }

  const handleSubmitPress = withErrorCapture(handleSubmit, {
    screen: 'Login',
    action: 'pressSubmit',
    feature: 'auth',
  });

  const handleNavigateRegisterPress = withErrorCapture(
    () => navigation.navigate('Register'),
    {
      screen: 'Login',
      action: 'navigateRegister',
      feature: 'auth',
    },
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1, backgroundColor: colors.background}}>
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center', padding: 20}}>
        <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
          <Card.Content style={{paddingVertical: 20, gap: 22}}>
            <View style={{gap: 8}}>
              <Text variant="headlineMedium" style={{fontWeight: '800'}}>
                解锁本地账本
              </Text>
              <Text variant="bodyMedium" style={{color: colors.muted}}>
                所有数据仅存储在本机，解锁后即可继续记账。
              </Text>
            </View>
            <AppInput
              label="账本账号"
              value={form.username}
              onChangeText={username => setForm(current => ({...current, username}))}
              autoComplete="username"
              textContentType="username"
              errorText={errors.username}
            />
            <AppInput
              label="解锁口令"
              value={form.password}
              onChangeText={password => setForm(current => ({...current, password}))}
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              errorText={errors.password}
            />
            <AppButton onPress={handleSubmitPress} loading={loading} disabled={loading}>
              解锁账本
            </AppButton>
            <AppButton
              mode="text"
              onPress={handleNavigateRegisterPress}
              disabled={loading}>
              首次使用，创建本地账本
            </AppButton>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
