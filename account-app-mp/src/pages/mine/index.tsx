import {useCallback, useState} from 'react';
import Taro, {useDidShow} from '@tarojs/taro';
import {Button, Input, Text, View} from '@tarojs/components';
import type {UserProfile} from '@/shared';
import {getCurrentUserLocal, logoutLocal, updateProfileNickname} from '@/services/appData';
import {safeReLaunch, safeShowToast} from '@/utils/taroSafe';
import './index.scss';

export default function MinePage(): React.JSX.Element {
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUser = useCallback(async () => {
    const currentUser = getCurrentUserLocal();
    if (!currentUser) {
      await safeReLaunch('/pages/auth/index');
      return;
    }
    setUser(currentUser);
    setNickname(currentUser.nickname);
  }, []);

  useDidShow(() => {
    void loadUser().catch(error => {
      console.warn('[mine] loadUser failed:', error);
    });
  });

  async function handleSaveNickname(): Promise<void> {
    if (saving) {
      return;
    }
    if (!nickname.trim()) {
      await safeShowToast({title: '昵称不能为空', icon: 'none'});
      return;
    }
    try {
      setSaving(true);
      const nextUser = updateProfileNickname(nickname);
      setUser(nextUser);
      await safeShowToast({title: '已保存', icon: 'success'});
    } catch (error: any) {
      await safeShowToast({
        title: error?.message ?? '保存失败',
        icon: 'none',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout(): Promise<void> {
    logoutLocal();
    await safeShowToast({title: '已退出', icon: 'success'});
    await safeReLaunch('/pages/auth/index');
  }

  return (
    <View className="container">
      <View className="card mine-profile">
        <Text className="mine-name">{user?.nickname ?? '未登录用户'}</Text>
        <View>
          <Text className="muted mine-username">@{user?.username ?? '-'}</Text>
        </View>
      </View>

      <View className="card mine-section">
        <Text>昵称</Text>
        <Input
          className="mine-input"
          value={nickname}
          onInput={event => setNickname(event.detail.value)}
          placeholder="输入新的昵称"
        />
        <View className="mine-actions">
          <Button
            className="mine-action"
            type="primary"
            loading={saving}
            onClick={handleSaveNickname}>
            保存昵称
          </Button>
          <Button
            className="mine-action"
            onClick={() => Taro.navigateTo({url: '/pages/home/index'})}>
            回首页
          </Button>
        </View>
      </View>

      <View className="card">
        <Button onClick={handleLogout}>退出登录</Button>
      </View>
    </View>
  );
}
