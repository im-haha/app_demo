import React, {useMemo, useState} from 'react';
import {Pressable, StyleProp, TextStyle, View, ViewStyle} from 'react-native';
import {Menu, Text} from 'react-native-paper';
import {useThemeTokens} from '@/theme';

interface CategoryFilterItem {
  id: number;
  name: string;
}

interface CategoryFilterMenuProps {
  selectedCategoryId: number | null;
  categories: CategoryFilterItem[];
  onChange: (value: number | null) => void;
  containerStyle?: StyleProp<ViewStyle>;
  chipStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allLabel?: string;
}

export default function CategoryFilterMenu({
  selectedCategoryId,
  categories,
  onChange,
  containerStyle,
  chipStyle,
  textStyle,
  allLabel = '全部分类',
}: CategoryFilterMenuProps): React.JSX.Element {
  const tokens = useThemeTokens();
  const [menuVisible, setMenuVisible] = useState(false);
  const selectedName = useMemo(() => {
    if (selectedCategoryId === null) {
      return allLabel;
    }
    return categories.find(category => category.id === selectedCategoryId)?.name ?? allLabel;
  }, [allLabel, categories, selectedCategoryId]);

  return (
    <View style={containerStyle}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`分类筛选，当前${selectedName}`}
            accessibilityState={{expanded: menuVisible}}
            hitSlop={6}
            onPress={() => setMenuVisible(true)}
            style={({pressed}) => [
              {
                minHeight: tokens.size.touchMin,
                borderRadius: tokens.radius.pill,
                justifyContent: 'center',
              },
              chipStyle,
              pressed ? {backgroundColor: tokens.interactive.pressed} : null,
            ]}>
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
    </View>
  );
}
