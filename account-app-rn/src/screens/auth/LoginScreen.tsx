import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Card, Text} from 'react-native-paper';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import {loginSchema} from '@/utils/validate';
import {useThemeColors} from '@/theme';
import {AuthStackParamList} from '@/navigation/types';
import {login} from '@/api/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const [form, setForm] = useState({username: '', password: ''});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    try {
      setLoading(true);
      setErrors({});
      await loginSchema.validate(form, {abortEarly: false});
      await login(form);
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
        Alert.alert('登录失败', error.message ?? '请稍后重试');
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
                你的离线账本
              </Text>
              <Text variant="bodyMedium" style={{color: colors.muted}}>
                本地保存，先记得住，再考虑同步和上线。
              </Text>
            </View>
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
              autoComplete="password"
              textContentType="password"
              errorText={errors.password}
            />
            <AppButton onPress={handleSubmit} loading={loading}>
              登录
            </AppButton>
            <AppButton mode="text" onPress={() => navigation.navigate('Register')}>
              去注册
            </AppButton>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
