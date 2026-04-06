import dayjs from 'dayjs';
import {Category} from '@/types/bill';

const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

const expensePresets = [
  ['餐饮', 'food', '#D97757'],
  ['交通', 'transport', '#5C7AEA'],
  ['购物', 'shopping', '#D64D7F'],
  ['住房', 'housing', '#8C6A5D'],
  ['通讯', 'communication', '#4A6FA5'],
  ['医疗', 'medical', '#C44536'],
  ['娱乐', 'entertainment', '#7D5BA6'],
  ['学习', 'study', '#3C8D5A'],
  ['旅行', 'travel', '#1D7874'],
  ['其他', 'other', '#6C757D'],
] as const;

const incomePresets = [
  ['工资', 'salary', '#1F8A70'],
  ['奖金', 'bonus', '#E9B949'],
  ['兼职', 'salary', '#4C956C'],
  ['理财', 'salary', '#2A9D8F'],
  ['转账', 'bonus', '#457B9D'],
  ['其他', 'other', '#6C757D'],
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
