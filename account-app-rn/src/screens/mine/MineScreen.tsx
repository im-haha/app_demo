import React from 'react';
import {ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Card, List, Text} from 'react-native-paper';
import {useAppStore} from '@/store/appStore';
import {colors} from '@/theme';

export default function MineScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const user = useAppStore(state => state.getCurrentUser());
  const logout = useAppStore(state => state.logout);

  return (
    <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
      <Card mode="contained" style={{backgroundColor: colors.primary, borderRadius: 28}}>
        <Card.Content style={{gap: 8}}>
          <Text variant="headlineSmall" style={{color: '#FFFFFF', fontWeight: '800'}}>
            {user?.nickname ?? '未登录用户'}
          </Text>
          <Text variant="bodyMedium" style={{color: '#D9F2EE'}}>
            @{user?.username ?? '-'}
          </Text>
        </Card.Content>
      </Card>

      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
        <List.Item
          title="个人资料"
          description="修改昵称"
          left={props => <List.Icon {...props} icon="account-edit-outline" />}
          onPress={() => navigation.navigate('Profile')}
        />
        <List.Item
          title="月预算"
          description="设置和查看预算进度"
          left={props => <List.Icon {...props} icon="wallet-outline" />}
          onPress={() => navigation.navigate('Budget')}
        />
        <List.Item
          title="分类管理"
          description="新增、编辑和删除分类"
          left={props => <List.Icon {...props} icon="shape-outline" />}
          onPress={() => navigation.navigate('CategoryManage')}
        />
        <List.Item
          title="关于"
          description="离线优先，后续可切换服务端同步"
          left={props => <List.Icon {...props} icon="information-outline" />}
        />
      </Card>

      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
        <List.Item
          title="退出登录"
          left={props => <List.Icon {...props} icon="logout" color={colors.danger} />}
          titleStyle={{color: colors.danger}}
          onPress={logout}
        />
      </Card>
    </ScrollView>
  );
}
