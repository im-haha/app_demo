import React from 'react';
import {View, ViewStyle} from 'react-native';
import {
  CategoryIconKey,
  categoryIconTheme,
} from '@/constants/categoryIconTheme';
import CategoryIconBadge from '@/components/category-icons/CategoryIconBadge';
import {
  BonusIcon,
  EntertainmentIcon,
  FoodIcon,
  HousingIcon,
  OtherIcon,
  SalaryIcon,
  ShoppingIcon,
  TransportIcon,
} from '@/components/category-icons/CategoryGlyphs';

type Props = {
  categoryName?: string;
  categoryIcon?: string;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  bgColor?: string;
  withBadge?: boolean;
  style?: ViewStyle;
};

const CATEGORY_NAME_MAP: Record<string, CategoryIconKey> = {
  餐饮: 'food',
  交通: 'transport',
  通讯: 'transport',
  出行: 'transport',
  旅行: 'transport',
  奖金: 'bonus',
  住房: 'housing',
  工资: 'salary',
  兼职: 'salary',
  理财: 'salary',
  转账: 'bonus',
  娱乐: 'entertainment',
  购物: 'shopping',
  医疗: 'other',
  学习: 'other',
  其他: 'other',
};

const CATEGORY_ICON_MAP: Record<string, CategoryIconKey> = {
  'silverware-fork-knife': 'food',
  'food-fork-drink': 'food',
  'train-car': 'transport',
  cellphone: 'transport',
  car: 'transport',
  shopping: 'shopping',
  'home-city': 'housing',
  'briefcase-variant': 'salary',
  'account-tie-outline': 'salary',
  'chart-line': 'salary',
  'trophy-outline': 'bonus',
  'bank-transfer': 'bonus',
  'movie-open-star': 'entertainment',
  'medical-bag': 'other',
  'book-open-page-variant': 'other',
  airplane: 'transport',
  shape: 'other',
  'plus-circle-outline': 'other',
};

export function resolveCategoryIconKey(
  categoryName?: string,
  categoryIcon?: string,
): CategoryIconKey {
  const normalizedName = categoryName?.trim();
  if (normalizedName && CATEGORY_NAME_MAP[normalizedName]) {
    return CATEGORY_NAME_MAP[normalizedName];
  }

  const normalizedIcon = categoryIcon?.trim();
  if (normalizedIcon && CATEGORY_ICON_MAP[normalizedIcon]) {
    return CATEGORY_ICON_MAP[normalizedIcon];
  }

  return 'other';
}

function renderCategoryGlyph(
  key: CategoryIconKey,
  iconSize: number,
  iconColor: string,
): React.JSX.Element {
  switch (key) {
    case 'food':
      return <FoodIcon size={iconSize} color={iconColor} />;
    case 'transport':
      return <TransportIcon size={iconSize} color={iconColor} />;
    case 'bonus':
      return <BonusIcon size={iconSize} color={iconColor} />;
    case 'housing':
      return <HousingIcon size={iconSize} color={iconColor} />;
    case 'salary':
      return <SalaryIcon size={iconSize} color={iconColor} />;
    case 'entertainment':
      return <EntertainmentIcon size={iconSize} color={iconColor} />;
    case 'shopping':
      return <ShoppingIcon size={iconSize} color={iconColor} />;
    default:
      return <OtherIcon size={iconSize} color={iconColor} />;
  }
}

export default function BillCategoryIcon({
  categoryName,
  categoryIcon,
  size = 52,
  iconSize = 22,
  iconColor,
  bgColor,
  withBadge = true,
  style,
}: Props): React.JSX.Element {
  const key = resolveCategoryIconKey(categoryName, categoryIcon);
  const theme = categoryIconTheme[key];
  const resolvedIconColor = iconColor ?? theme.iconColor;
  const glyph = renderCategoryGlyph(key, iconSize, resolvedIconColor);

  if (!withBadge) {
    return (
      <View
        style={[
          {
            width: iconSize,
            height: iconSize,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}>
        {glyph}
      </View>
    );
  }

  return (
    <CategoryIconBadge
      size={size}
      bgColor={bgColor ?? theme.bgColor}
      style={style}>
      {glyph}
    </CategoryIconBadge>
  );
}
