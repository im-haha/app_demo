import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, Text} from 'react-native-paper';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import {AuthStackParamList} from '@/navigation/types';
import {register} from '@/api/auth';
import {registerSchema} from '@/utils/validate';
import {useThemeColors} from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({navigation}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    try {
      setLoading(true);
      setErrors({});
      await registerSchema.validate(form, {abortEarly: false});
      await register({
        username: form.username,
        password: form.password,
        nickname: form.nickname,
      });
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const nextErrors: Record<string, string> = {};
        error.inner.forEach((item: any) => {
          if (item.path) {
            nextErrors[item.path] = item.message;
          }
        });
        setErrors(nextErrors);
      } else {
        Alert.alert('注册失败', error.message ?? '请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1, backgroundColor: colors.background}}>
      <ScrollView contentContainerStyle={{padding: 20, justifyContent: 'center', flexGrow: 1}}>
        <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
          <Card.Content style={{paddingVertical: 20, gap: 20}}>
            <Text variant="headlineSmall" style={{fontWeight: '800'}}>
              创建本地账户
            </Text>
            <AppInput
              label="昵称"
              value={form.nickname}
              onChangeText={nickname => setForm(current => ({...current, nickname}))}
              autoComplete="off"
              textContentType="nickname"
              errorText={errors.nickname}
            />
            <AppInput
              label="用户名"
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
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              errorText={errors.password}
            />
            <AppInput
              label="确认密码"
              value={form.confirmPassword}
              onChangeText={confirmPassword => setForm(current => ({...current, confirmPassword}))}
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              errorText={errors.confirmPassword}
            />
            <AppButton onPress={handleSubmit} loading={loading}>
              注册并进入
            </AppButton>
            <AppButton mode="text" onPress={() => navigation.goBack()}>
              返回登录
            </AppButton>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
