import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppInput from '@/components/common/AppInput';
import EmptyState from '@/components/common/EmptyState';
import {useAppStore} from '@/store/appStore';
import {createCategory, deleteCategory, updateCategory} from '@/api/category';
import {useThemeColors} from '@/theme';

const iconOptions = ['food-fork-drink', 'shopping', 'car', 'cash', 'gift', 'shape'];
const colorOptions = ['#D97757', '#1D7874', '#5C7AEA', '#D64D7F', '#2A9D8F', '#6C757D'];

export default function CategoryManageScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(iconOptions[0]);
  const [color, setColor] = useState(colorOptions[0]);
  const allCategories = useAppStore(state => state.categories);
  const currentUserId = useAppStore(state => state.currentUserId);
  const categories = useMemo(
    () =>
      allCategories
        .filter(category => category.type === type)
        .filter(category => category.userId === null || category.userId === currentUserId)
        .sort((left, right) => left.sortNum - right.sortNum),
    [type, allCategories, currentUserId],
  );

  function openCreate() {
    setEditingId(null);
    setName('');
    setIcon(iconOptions[0]);
    setColor(colorOptions[0]);
    setVisible(true);
  }

  function openEdit(category: (typeof categories)[number]) {
    setEditingId(category.id);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }

    if (editingId) {
      await updateCategory(editingId, {name, icon, color});
    } else {
      await createCategory({type, name, icon, color});
    }

    setVisible(false);
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
        <SegmentedButtons
          value={type}
          onValueChange={value => setType(value as 'INCOME' | 'EXPENSE')}
          buttons={[
            {label: '支出分类', value: 'EXPENSE'},
            {label: '收入分类', value: 'INCOME'},
          ]}
        />
        {categories.length === 0 ? (
          <EmptyState title="暂无分类" description="先建几个常用分类，记账速度会快很多。" />
        ) : (
          categories.map(category => (
            <Card key={category.id} mode="contained" style={{backgroundColor: colors.surface, borderRadius: 22}}>
              <Card.Content
                style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${category.color}20`,
                    }}>
                    <MaterialCommunityIcons name={category.icon} size={20} color={category.color} />
                  </View>
                  <View>
                    <Text variant="titleMedium">{category.name}</Text>
                    <Text variant="bodySmall" style={{color: colors.muted}}>
                      {category.isDefault ? '系统默认分类' : '自定义分类'}
                    </Text>
                  </View>
                </View>
                {category.isDefault ? null : (
                  <View style={{flexDirection: 'row'}}>
                    <IconButton icon="pencil-outline" onPress={() => openEdit(category)} />
                    <IconButton
                      icon="delete-outline"
                      iconColor={colors.danger}
                      onPress={() =>
                        Alert.alert('删除分类', '确认删除该分类？', [
                          {text: '取消', style: 'cancel'},
                          {
                            text: '删除',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteCategory(category.id);
                            },
                          },
                        ])
                      }
                    />
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
        <Button mode="contained" buttonColor={colors.secondary} onPress={openCreate}>
          新增分类
        </Button>
      </ScrollView>
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>{editingId ? '编辑分类' : '新增分类'}</Dialog.Title>
          <Dialog.Content style={{gap: 14}}>
            <AppInput label="分类名称" value={name} onChangeText={setName} />
            <View style={{gap: 8}}>
              <Text variant="titleSmall">图标</Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                {iconOptions.map(item => (
                  <IconButton
                    key={item}
                    mode={icon === item ? 'contained' : 'outlined'}
                    icon={item}
                    onPress={() => setIcon(item)}
                  />
                ))}
              </View>
            </View>
            <View style={{gap: 8}}>
              <Text variant="titleSmall">颜色</Text>
              <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap'}}>
                {colorOptions.map(item => (
                  <Button
                    key={item}
                    mode={color === item ? 'contained' : 'outlined'}
                    buttonColor={color === item ? item : undefined}
                    textColor={color === item ? '#FFFFFF' : item}
                    onPress={() => setColor(item)}>
                    选择
                  </Button>
                ))}
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>取消</Button>
            <Button onPress={handleSave}>保存</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
