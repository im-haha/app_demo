import React from 'react';
import {ScrollView, View} from 'react-native';
import {Chip, Text} from 'react-native-paper';
import {Category} from '@/types/bill';
import BillCategoryIcon from '@/components/bill/BillCategoryIcon';
import {useResolvedThemeMode, useThemeColors} from '@/theme';

interface Props {
  categories: Category[];
  selectedId: number | null;
  onChange: (categoryId: number) => void;
}

function CategorySelector({
  categories,
  selectedId,
  onChange,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const resolvedThemeMode = useResolvedThemeMode();
  const isDark = resolvedThemeMode === 'dark';

  return (
    <View style={{gap: 10}}>
      <Text variant="titleSmall">分类</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{flexDirection: 'row', gap: 8}}>
          {categories.map(category => {
            const selected = selectedId === category.id;

            return (
              <Chip
                key={category.id}
                selected={selected}
                showSelectedCheck={false}
                onPress={() => onChange(category.id)}
                style={{
                  backgroundColor: selected
                    ? category.color
                    : isDark
                      ? 'rgba(255,255,255,0.04)'
                      : '#F7F2E7',
                  borderWidth: selected ? 0 : 1,
                  borderColor: isDark
                    ? 'rgba(142,148,143,0.32)'
                    : 'rgba(142,148,143,0.24)',
                }}
                textStyle={{
                  color: selected ? '#FFFFFF' : colors.text,
                  fontWeight: selected ? '700' : '600',
                }}
                icon={() => (
                  <BillCategoryIcon
                    categoryName={category.name}
                    categoryIcon={category.icon}
                    size={24}
                    iconSize={14}
                    iconColor={selected ? '#FFFFFF' : colors.primary}
                    bgColor={
                      selected ? 'rgba(255,255,255,0.22)' : undefined
                    }
                  />
                )}>
                {category.name}
              </Chip>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default React.memo(CategorySelector);
