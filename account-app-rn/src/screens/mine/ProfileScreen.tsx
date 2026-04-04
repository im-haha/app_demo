import React, {useEffect, useState} from 'react';
import {Alert, ScrollView} from 'react-native';
import {Card, Text} from 'react-native-paper';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import {updateProfile} from '@/api/auth';
import {useCurrentUser} from '@/store/userStore';
import {useThemeColors} from '@/theme';

export default function ProfileScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const user = useCurrentUser();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNickname(user?.nickname ?? '');
  }, [user?.nickname]);

  async function handleSave() {
    if (saving) {
      return;
    }
    const normalizedNickname = nickname.trim();
    if (!normalizedNickname) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }
    if (normalizedNickname === (user?.nickname ?? '').trim()) {
      Alert.alert('无需保存', '昵称未发生变化');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({nickname: normalizedNickname});
      Alert.alert('已保存', '账本昵称更新成功');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '请稍后重试';
      Alert.alert('保存失败', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
        <Card.Content style={{gap: 16}}>
          <Text variant="titleMedium">用户名：{user?.username}</Text>
          <AppInput label="昵称" value={nickname} onChangeText={setNickname} />
          <AppButton onPress={handleSave} loading={saving} disabled={saving}>
            保存资料
          </AppButton>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
