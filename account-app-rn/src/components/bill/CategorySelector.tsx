import React from 'react';
import {ScrollView, View} from 'react-native';
import {Chip, Text} from 'react-native-paper';
import {Category} from '@/types/bill';
import BillCategoryIcon from '@/components/bill/BillCategoryIcon';

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
  return (
    <View style={{gap: 10}}>
      <Text variant="titleSmall">分类</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{flexDirection: 'row', gap: 8}}>
          {categories.map(category => (
            <Chip
              key={category.id}
              selected={selectedId === category.id}
              showSelectedCheck={false}
              onPress={() => onChange(category.id)}
              style={{
                backgroundColor:
                  selectedId === category.id ? category.color : undefined,
              }}
              textStyle={{
                color: selectedId === category.id ? '#FFFFFF' : undefined,
              }}
              icon={() => (
                <BillCategoryIcon
                  categoryName={category.name}
                  categoryIcon={category.icon}
                  size={24}
                  iconSize={14}
                  iconColor={selectedId === category.id ? '#FFFFFF' : undefined}
                  bgColor={
                    selectedId === category.id
                      ? 'rgba(255,255,255,0.22)'
                      : undefined
                  }
                />
              )}>
              {category.name}
            </Chip>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default React.memo(CategorySelector);
