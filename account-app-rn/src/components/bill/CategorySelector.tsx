import React from 'react';
import {ScrollView, View} from 'react-native';
import {Chip, Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Category} from '@/types/bill';

interface Props {
  categories: Category[];
  selectedId: number | null;
  onChange: (categoryId: number) => void;
}

export default function CategorySelector({
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
              onPress={() => onChange(category.id)}
              style={{
                backgroundColor: selectedId === category.id ? category.color : undefined,
              }}
              textStyle={{
                color: selectedId === category.id ? '#FFFFFF' : undefined,
              }}
              icon={() => (
                <MaterialCommunityIcons
                  name={category.icon}
                  size={18}
                  color={selectedId === category.id ? '#FFFFFF' : category.color}
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
