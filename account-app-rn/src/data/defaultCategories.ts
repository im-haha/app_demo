import dayjs from 'dayjs';
import {Category} from '@/types/bill';

const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

const expensePresets = [
  ['餐饮', 'silverware-fork-knife', '#D97757'],
  ['交通', 'train-car', '#5C7AEA'],
  ['购物', 'shopping', '#D64D7F'],
  ['住房', 'home-city', '#8C6A5D'],
  ['通讯', 'cellphone', '#4A6FA5'],
  ['医疗', 'medical-bag', '#C44536'],
  ['娱乐', 'movie-open-star', '#7D5BA6'],
  ['学习', 'book-open-page-variant', '#3C8D5A'],
  ['旅行', 'airplane', '#1D7874'],
  ['其他', 'shape', '#6C757D'],
] as const;

const incomePresets = [
  ['工资', 'briefcase-variant', '#1F8A70'],
  ['奖金', 'trophy-outline', '#E9B949'],
  ['兼职', 'account-tie-outline', '#4C956C'],
  ['理财', 'chart-line', '#2A9D8F'],
  ['转账', 'bank-transfer', '#457B9D'],
  ['其他', 'plus-circle-outline', '#6C757D'],
] as const;

function buildCategory(
  name: string,
  icon: string,
  color: string,
  type: 'INCOME' | 'EXPENSE',
  id: number,
  sortNum: number,
): Category {
  return {
    id,
    userId: null,
    type,
    name,
    icon,
    color,
    sortNum,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}

export const defaultCategories: Category[] = [
  ...expensePresets.map(([name, icon, color], index) =>
    buildCategory(name, icon, color, 'EXPENSE', index + 1, index),
  ),
  ...incomePresets.map(([name, icon, color], index) =>
    buildCategory(name, icon, color, 'INCOME', expensePresets.length + index + 1, index),
  ),
];
