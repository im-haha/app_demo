import React, {useMemo} from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Card, List, Text} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import {colors} from '@/theme';

const DEFAULT_AVATAR = require('../../assets/images/avatar-default.jpeg');

export default function MineScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const users = useAppStore(state => state.users);
  const currentUserId = useAppStore(state => state.currentUserId);
  const logout = useAppStore(state => state.logout);
  const user = useMemo(() => users.find(item => item.id === currentUserId), [users, currentUserId]);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: insets.top + 12,
        gap: 16,
      }}>
      <Card mode="contained" style={{backgroundColor: colors.primary, borderRadius: 28}}>
        <Card.Content style={styles.profileCardContent}>
          <Image source={DEFAULT_AVATAR} style={styles.avatar} />
          <View style={{gap: 8, flex: 1}}>
            <Text variant="headlineSmall" style={{color: '#FFFFFF', fontWeight: '800'}}>
              {user?.nickname ?? '未登录用户'}
            </Text>
            <Text variant="bodyMedium" style={{color: '#D9F2EE'}}>
              @{user?.username ?? '-'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
        <List.Item
          title="个人资料"
          description="修改昵称"
          left={() => (
            <View style={[styles.menuIcon, {borderColor: '#BCD6D3', backgroundColor: '#EEF7F6'}]}>
              <View style={[styles.profileHead, {borderColor: colors.primary}]} />
              <View style={[styles.profileShoulder, {borderColor: colors.primary}]} />
            </View>
          )}
          onPress={() => navigation.navigate('Profile')}
        />
        <List.Item
          title="月预算"
          description="设置和查看预算进度"
          left={() => (
            <View style={[styles.menuIcon, {borderColor: '#F1D8C8', backgroundColor: '#FFF3EB'}]}>
              <View style={[styles.walletBody, {borderColor: colors.secondary}]} />
              <View style={[styles.walletDot, {backgroundColor: colors.secondary}]} />
            </View>
          )}
          onPress={() => navigation.navigate('Budget')}
        />
        <List.Item
          title="分类管理"
          description="新增、编辑和删除分类"
          left={() => (
            <View style={[styles.menuIcon, {borderColor: '#D9D7EE', backgroundColor: '#F4F2FD'}]}>
              <View style={[styles.gridDot, {left: 8, top: 8, backgroundColor: '#5C7AEA'}]} />
              <View style={[styles.gridDot, {left: 14, top: 8, backgroundColor: '#D64D7F'}]} />
              <View style={[styles.gridDot, {left: 8, top: 14, backgroundColor: '#2A9D8F'}]} />
              <View style={[styles.gridDot, {left: 14, top: 14, backgroundColor: '#E9B949'}]} />
            </View>
          )}
          onPress={() => navigation.navigate('CategoryManage')}
        />
        <List.Item
          title="关于"
          description="离线优先，后续可切换服务端同步"
          left={() => (
            <View style={[styles.menuIcon, {borderColor: '#D8DFE8', backgroundColor: '#F1F6FA'}]}>
              <Text style={{color: colors.primary, fontWeight: '800'}}>i</Text>
            </View>
          )}
        />
      </Card>

      <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
        <List.Item
          title="退出登录"
          left={() => (
            <View style={[styles.menuIcon, {borderColor: '#F2D0CA', backgroundColor: '#FFF2EF'}]}>
              <View style={[styles.logoutBar, {backgroundColor: colors.danger}]} />
              <View style={[styles.logoutArrow, {borderColor: colors.danger}]} />
            </View>
          )}
          titleStyle={{color: colors.danger}}
          onPress={logout}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileCardContent: {
    gap: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#D9F2EE',
    backgroundColor: '#DCE9E7',
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  profileHead: {
    position: 'absolute',
    top: 7,
    width: 9,
    height: 9,
    borderRadius: 999,
    borderWidth: 1.6,
  },
  profileShoulder: {
    position: 'absolute',
    top: 16,
    width: 15,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.6,
    borderBottomWidth: 0,
  },
  walletBody: {
    width: 16,
    height: 12,
    borderRadius: 4,
    borderWidth: 1.6,
  },
  walletDot: {
    position: 'absolute',
    right: 8,
    width: 3.5,
    height: 3.5,
    borderRadius: 999,
  },
  gridDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1.5,
  },
  logoutBar: {
    position: 'absolute',
    left: 9,
    width: 9,
    height: 2,
    borderRadius: 999,
  },
  logoutArrow: {
    position: 'absolute',
    left: 15,
    width: 5,
    height: 5,
    borderTopWidth: 1.8,
    borderRightWidth: 1.8,
    transform: [{rotate: '45deg'}],
  },
});
