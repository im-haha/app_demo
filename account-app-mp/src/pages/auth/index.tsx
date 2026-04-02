import {useMemo, useState} from 'react';
import Taro from '@tarojs/taro';
import {Button, Input, Text, View} from '@tarojs/components';
import type {LoginPayload, RegisterPayload} from '@/shared/types/user';
import {loginLocal, registerLocal} from '@/services/appData';
import './index.scss';

type AuthMode = 'LOGIN' | 'REGISTER';

export default function AuthPage(): React.JSX.Element {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitLabel = useMemo(
    () => (mode === 'LOGIN' ? '登录' : '注册并进入'),
    [mode],
  );

  async function handleSubmit(): Promise<void> {
    if (submitting) {
      return;
    }
    if (!username.trim()) {
      Taro.showToast({title: '请输入用户名', icon: 'none'});
      return;
    }
    if (!password.trim()) {
      Taro.showToast({title: '请输入密码', icon: 'none'});
      return;
    }
    if (mode === 'REGISTER') {
      if (!nickname.trim()) {
        Taro.showToast({title: '请输入昵称', icon: 'none'});
        return;
      }
      if (password !== confirmPassword) {
        Taro.showToast({title: '两次密码不一致', icon: 'none'});
        return;
      }
    }

    try {
      setSubmitting(true);
      if (mode === 'LOGIN') {
        const payload: LoginPayload = {username, password};
        loginLocal(payload);
      } else {
        const payload: RegisterPayload = {username, password, nickname};
        registerLocal(payload);
      }
      await Taro.showToast({title: '欢迎回来', icon: 'success'});
      await Taro.reLaunch({url: '/pages/home/index'});
    } catch (error: any) {
      await Taro.showToast({
        title: error?.message ?? '操作失败，请稍后重试',
        icon: 'none',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="container">
      <View className="card">
        <View className="auth-header">
          <Text className="auth-title">你的离线账本</Text>
          <View>
            <Text className="muted auth-subtitle">
              先把数据记下来，再决定是否切换服务端同步。
            </Text>
          </View>
        </View>

        <View className="auth-mode-row">
          <Button
            className="auth-mode-btn"
            type={mode === 'LOGIN' ? 'primary' : 'default'}
            onClick={() => setMode('LOGIN')}>
            登录
          </Button>
          <Button
            className="auth-mode-btn"
            type={mode === 'REGISTER' ? 'primary' : 'default'}
            onClick={() => setMode('REGISTER')}>
            注册
          </Button>
        </View>

        {mode === 'REGISTER' ? (
          <View className="auth-field">
            <Text>昵称</Text>
            <Input
              className="auth-input"
              value={nickname}
              onInput={event => setNickname(event.detail.value)}
              placeholder="请输入昵称"
            />
          </View>
        ) : null}

        <View className="auth-field">
          <Text>用户名</Text>
          <Input
            className="auth-input"
            value={username}
            onInput={event => setUsername(event.detail.value)}
            placeholder="至少 3 位"
          />
        </View>

        <View className="auth-field">
          <Text>密码</Text>
          <Input
            className="auth-input"
            value={password}
            password
            onInput={event => setPassword(event.detail.value)}
            placeholder="至少 6 位"
          />
        </View>

        {mode === 'REGISTER' ? (
          <View className="auth-field">
            <Text>确认密码</Text>
            <Input
              className="auth-input"
              value={confirmPassword}
              password
              onInput={event => setConfirmPassword(event.detail.value)}
              placeholder="请再次输入密码"
            />
          </View>
        ) : null}

        <Button
          className="auth-submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </View>
    </View>
  );
}
