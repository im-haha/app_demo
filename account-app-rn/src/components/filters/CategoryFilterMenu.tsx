import React, {useMemo, useState} from 'react';
import {Pressable, StyleProp, TextStyle, ViewStyle} from 'react-native';
import {Menu, Text} from 'react-native-paper';

interface CategoryFilterItem {
  id: number;
  name: string;
}

interface CategoryFilterMenuProps {
  selectedCategoryId: number | null;
  categories: CategoryFilterItem[];
  onChange: (value: number | null) => void;
  chipStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allLabel?: string;
}

export default function CategoryFilterMenu({
  selectedCategoryId,
  categories,
  onChange,
  chipStyle,
  textStyle,
  allLabel = '全部分类',
}: CategoryFilterMenuProps): React.JSX.Element {
  const [menuVisible, setMenuVisible] = useState(false);
  const selectedName = useMemo(() => {
    if (selectedCategoryId === null) {
      return allLabel;
    }
    return categories.find(category => category.id === selectedCategoryId)?.name ?? allLabel;
  }, [allLabel, categories, selectedCategoryId]);

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Pressable onPress={() => setMenuVisible(true)} style={chipStyle}>
          <Text numberOfLines={1} style={textStyle}>
            {selectedName}
          </Text>
        </Pressable>
      }>
      <Menu.Item
        title={allLabel}
        onPress={() => {
          onChange(null);
          setMenuVisible(false);
        }}
      />
      {categories.map(category => (
        <Menu.Item
          key={category.id}
          title={category.name}
          onPress={() => {
            onChange(category.id);
            setMenuVisible(false);
          }}
        />
      ))}
    </Menu>
  );
}
