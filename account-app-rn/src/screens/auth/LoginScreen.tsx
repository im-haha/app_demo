import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, Text} from 'react-native-paper';
import {ValidationError} from 'yup';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import {loginSchema} from '@/utils/validate';
import {useThemeColors} from '@/theme';
import {AuthStackParamList} from '@/navigation/types';
import {login} from '@/api/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type LoginFormState = {
  username: string;
  password: string;
};

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
      await login(form);
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
        const message = error instanceof Error ? error.message : '请稍后重试';
        Alert.alert('解锁失败', message);
      }
    } finally {
      setLoading(false);
    }
  }

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
              label="密码"
              value={form.password}
              onChangeText={password => setForm(current => ({...current, password}))}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              errorText={errors.password}
            />
            <AppButton onPress={handleSubmit} loading={loading} disabled={loading}>
              解锁账本
            </AppButton>
            <AppButton mode="text" onPress={() => navigation.navigate('Register')} disabled={loading}>
              首次使用，创建账本
            </AppButton>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
