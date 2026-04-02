import {useCallback, useMemo, useState} from 'react';
import Taro, {useDidShow} from '@tarojs/taro';
import dayjs from 'dayjs';
import {Button, Text, View} from '@tarojs/components';
import type {BillRecord, Category, OverviewStats, UserProfile} from '@/shared';
import {formatCurrency, formatSignedCurrency, formatDateTime} from '@/shared';
import {
  getBudgetSummaryLocal,
  getCategoriesLocal,
  getCurrentUserLocal,
  getOverviewLocal,
  getRecentBills,
  initializeLocalState,
} from '@/services/appData';
import {safeReLaunch} from '@/utils/taroSafe';
import './index.scss';

const EMPTY_OVERVIEW: OverviewStats = {
  todayIncome: 0,
  todayExpense: 0,
  monthIncome: 0,
  monthExpense: 0,
  monthBalance: 0,
};

export default function HomePage(): React.JSX.Element {
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [overview, setOverview] = useState<OverviewStats>(EMPTY_OVERVIEW);
  const [recentBills, setRecentBills] = useState<BillRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetText, setBudgetText] = useState('0/0');

  const month = dayjs().format('YYYY-MM');

  const loadData = useCallback(async () => {
    initializeLocalState();
    const currentUser = getCurrentUserLocal();
    if (!currentUser) {
      await safeReLaunch('/pages/auth/index');
      return;
    }

    const nextOverview = getOverviewLocal();
    const nextBills = getRecentBills(6);
    const nextCategories = getCategoriesLocal();
    const budget = getBudgetSummaryLocal(month);

    setUser(currentUser);
    setOverview(nextOverview);
    setRecentBills(nextBills);
    setCategories(nextCategories);
    setBudgetText(`${formatCurrency(budget.spentAmount)} / ${formatCurrency(budget.budgetAmount)}`);
  }, [month]);

  useDidShow(() => {
    void loadData().catch(error => {
      console.warn('[home] loadData failed:', error);
    });
  });

  const categoryNameMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(category => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  return (
    <View className="container">
      <View className="home-hero">
        <Text className="home-hero-title">你好，{user?.nickname ?? '你'}</Text>
        <View>
          <Text className="home-hero-balance">{formatSignedCurrency(overview.monthBalance)}</Text>
        </View>
        <View>
          <Text className="muted">本月预算使用：{budgetText}</Text>
        </View>
      </View>

      <View className="home-grid">
        <View className="home-grid-item">
          <Text className="muted">今日支出</Text>
          <View>
            <Text>{formatCurrency(overview.todayExpense)}</Text>
          </View>
        </View>
        <View className="home-grid-item">
          <Text className="muted">今日收入</Text>
          <View>
            <Text>{formatCurrency(overview.todayIncome)}</Text>
          </View>
        </View>
        <View className="home-grid-item">
          <Text className="muted">本月支出</Text>
          <View>
            <Text>{formatCurrency(overview.monthExpense)}</Text>
          </View>
        </View>
        <View className="home-grid-item">
          <Text className="muted">本月收入</Text>
          <View>
            <Text>{formatCurrency(overview.monthIncome)}</Text>
          </View>
        </View>
      </View>

      <View className="card">
        <Text className="home-section-title">最近账单</Text>
        {recentBills.length === 0 ? (
          <Text className="muted">还没有账单，先去“账单”页添加一笔。</Text>
        ) : (
          recentBills.map(bill => (
            <View className="home-bill-item" key={bill.id}>
              <View className="home-bill-row">
                <Text>{categoryNameMap.get(bill.categoryId) ?? '未分类'}</Text>
                <Text>{bill.type === 'INCOME' ? '+' : '-'}{formatCurrency(bill.amount)}</Text>
              </View>
              <View className="home-bill-row">
                <Text className="muted">{bill.remark || '无备注'}</Text>
                <Text className="muted">{formatDateTime(bill.billTime)}</Text>
              </View>
            </View>
          ))
        )}

        <View className="home-actions">
          <Button
            className="home-action"
            onClick={() => Taro.navigateTo({url: '/pages/bills/index'})}>
            去账单
          </Button>
          <Button
            className="home-action"
            onClick={() => Taro.navigateTo({url: '/pages/mine/index'})}>
            去我的
          </Button>
        </View>
      </View>
    </View>
  );
}
