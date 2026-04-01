import React, {useState} from 'react';
import {Alert, ScrollView} from 'react-native';
import {Card, Text} from 'react-native-paper';
import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import {updateProfile} from '@/api/auth';
import {useAppStore} from '@/store/appStore';
import {colors} from '@/theme';

export default function ProfileScreen(): React.JSX.Element {
  const user = useAppStore(state => state.getCurrentUser());
  const [nickname, setNickname] = useState(user?.nickname ?? '');

  async function handleSave() {
    if (!nickname.trim()) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }

    await updateProfile({nickname});
    Alert.alert('已保存', '昵称更新成功');
  }

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 28}}>
        <Card.Content style={{gap: 16}}>
          <Text variant="titleMedium">用户名：{user?.username}</Text>
          <AppInput label="昵称" value={nickname} onChangeText={setNickname} />
          <AppButton onPress={handleSave}>保存资料</AppButton>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
