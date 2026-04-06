import React, {useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, View} from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Portal,
  RadioButton,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import AppInput from '@/components/common/AppInput';
import BillCategoryIcon, {
  resolveCategoryIconKey,
} from '@/components/bill/BillCategoryIcon';
import EmptyState from '@/components/common/EmptyState';
import {CategoryIconKey} from '@/constants/categoryIconTheme';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {
  createCategory,
  deleteCategory,
  replaceCategoryAndDelete,
  updateCategory,
} from '@/api/category';
import {useThemeColors} from '@/theme';

const iconOptions: Array<{key: CategoryIconKey; label: string}> = [
  {key: 'food', label: '餐饮'},
  {key: 'transport', label: '交通'},
  {key: 'communication', label: '通讯'},
  {key: 'shopping', label: '购物'},
  {key: 'housing', label: '住房'},
  {key: 'medical', label: '医疗'},
  {key: 'entertainment', label: '娱乐'},
  {key: 'study', label: '学习'},
  {key: 'travel', label: '旅行'},
  {key: 'salary', label: '收入'},
  {key: 'bonus', label: '奖金'},
  {key: 'other', label: '其他'},
];
const colorOptions = ['#D97757', '#1D7874', '#5C7AEA', '#D64D7F', '#2A9D8F', '#6C757D'];

export default function CategoryManageScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [replaceTargetCategoryId, setReplaceTargetCategoryId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<CategoryIconKey>(iconOptions[0].key);
  const [color, setColor] = useState(colorOptions[0]);
  const allCategories = useAppStore(state => state.categories);
  const allBills = useAppStore(state => state.bills);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const categories = useMemo(
    () =>
      allCategories
        .filter(category => category.type === type)
        .filter(category => category.userId === null || category.userId === currentUserId)
        .sort((left, right) => left.sortNum - right.sortNum),
    [type, allCategories, currentUserId],
  );
  const replaceTargetOptions = useMemo(
    () => categories.filter(category => category.id !== deletingCategoryId),
    [categories, deletingCategoryId],
  );

  function openCreate() {
    setEditingId(null);
    setName('');
    setIcon(iconOptions[0].key);
    setColor(colorOptions[0]);
    setVisible(true);
  }

  function openEdit(category: (typeof categories)[number]) {
    setEditingId(category.id);
    setName(category.name);
    setIcon(resolveCategoryIconKey(category.name, category.icon));
    setColor(category.color);
    setVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }

    try {
      if (editingId) {
        await updateCategory(editingId, {name, icon, color});
      } else {
        await createCategory({type, name, icon, color});
      }
      setVisible(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '请稍后重试';
      Alert.alert('保存失败', message);
    }
  }

  function isCategoryUsed(categoryId: number): boolean {
    return allBills.some(
      bill =>
        bill.userId === currentUserId &&
        !bill.deleted &&
        bill.categoryId === categoryId,
    );
  }

  function openReplaceDialog(categoryId: number): void {
    const defaultTarget = categories.find(category => category.id !== categoryId)?.id ?? null;
    setDeletingCategoryId(categoryId);
    setReplaceTargetCategoryId(defaultTarget);
  }

  async function handleDelete(categoryId: number): Promise<void> {
    if (isCategoryUsed(categoryId)) {
      openReplaceDialog(categoryId);
      return;
    }

    Alert.alert('删除分类', '确认删除该分类？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(categoryId);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '请稍后重试';
            Alert.alert('删除失败', message);
          }
        },
      },
    ]);
  }

  async function confirmReplaceAndDelete(): Promise<void> {
    if (!deletingCategoryId || !replaceTargetCategoryId) {
      Alert.alert('提示', '请选择迁移目标分类');
      return;
    }
    try {
      await replaceCategoryAndDelete(deletingCategoryId, replaceTargetCategoryId);
      setDeletingCategoryId(null);
      setReplaceTargetCategoryId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '请稍后重试';
      Alert.alert('删除失败', message);
    }
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
                  <BillCategoryIcon
                    categoryName={category.name}
                    categoryIcon={category.icon}
                    size={42}
                    iconSize={18}
                    iconColor={category.color}
                    bgColor={`${category.color}20`}
                  />
                  <View>
                    <Text variant="titleMedium">{category.name}</Text>
                    <Text variant="bodySmall" style={{color: colors.muted}}>
                      {category.isDefault ? '系统默认分类' : '自定义分类'}
                    </Text>
                  </View>
                </View>
                {category.isDefault ? null : (
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 2}}>
                    <Button compact onPress={() => openEdit(category)}>
                      编辑
                    </Button>
                    <Button
                      compact
                      textColor={colors.danger}
                      onPress={() => {
                        void handleDelete(category.id);
                      }}
                    >
                      删除
                    </Button>
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
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                {iconOptions.map(item => {
                  const selected = icon === item.key;

                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setIcon(item.key)}
                      style={{
                        width: 92,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? `${colors.primary}14` : colors.surface,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                      }}>
                      <View style={{alignItems: 'center', gap: 6}}>
                        <BillCategoryIcon
                          categoryIcon={item.key}
                          size={42}
                          iconSize={18}
                        />
                        <Text
                          variant="labelMedium"
                          style={{
                            color: selected ? colors.primary : colors.text,
                            fontWeight: selected ? '700' : '500',
                          }}>
                          {item.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
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
        <Dialog
          visible={Boolean(deletingCategoryId)}
          onDismiss={() => {
            setDeletingCategoryId(null);
            setReplaceTargetCategoryId(null);
          }}>
          <Dialog.Title>迁移后删除分类</Dialog.Title>
          <Dialog.Content style={{gap: 10}}>
            <Text variant="bodyMedium" style={{color: colors.muted}}>
              该分类已有账单，请先选择迁移目标分类。
            </Text>
            {replaceTargetOptions.length === 0 ? (
              <Text style={{color: colors.danger}}>没有可迁移的分类，请先新增分类。</Text>
            ) : (
              <RadioButton.Group
                value={
                  replaceTargetCategoryId ? String(replaceTargetCategoryId) : ''
                }
                onValueChange={value =>
                  setReplaceTargetCategoryId(Number(value))
                }>
                {replaceTargetOptions.map(category => (
                  <RadioButton.Item
                    key={category.id}
                    label={category.name}
                    value={String(category.id)}
                  />
                ))}
              </RadioButton.Group>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setDeletingCategoryId(null);
                setReplaceTargetCategoryId(null);
              }}>
              取消
            </Button>
            <Button onPress={() => void confirmReplaceAndDelete()}>
              迁移并删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
