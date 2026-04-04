import {useCallback, useMemo, useState} from 'react';
import Taro, {useDidShow} from '@tarojs/taro';
import {Button, Input, Text, View} from '@tarojs/components';
import type {BillRecord, BillType, Category} from '@/shared';
import {formatCurrency, formatDateTime} from '@/shared';
import {
  addBillLocal,
  buildQuickBillPayload,
  deleteBillLocal,
  getBillsLocal,
  getCategoriesLocal,
  getCurrentUserLocal,
  initializeLocalState,
} from '@/services/appData';
import {safeReLaunch, safeShowToast} from '@/utils/taroSafe';
import './index.scss';

export default function BillsPage(): React.JSX.Element {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<BillType | 'ALL'>('ALL');
  const [newType, setNewType] = useState<BillType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    initializeLocalState();
    const currentUser = getCurrentUserLocal();
    if (!currentUser) {
      await safeReLaunch('/pages/auth/index');
      return;
    }
    setCategories(getCategoriesLocal());
    setBills(
      getBillsLocal({
        type,
      }),
    );
  }, [type]);

  useDidShow(() => {
    void loadData().catch(error => {
      console.warn('[bills] loadData failed:', error);
    });
  });

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(category => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  async function handleAddBill(): Promise<void> {
    if (saving) {
      return;
    }
    try {
      setSaving(true);
      const payload = buildQuickBillPayload(amount, remark, newType);
      addBillLocal(payload);
      setAmount('');
      setRemark('');
      await safeShowToast({title: '已添加', icon: 'success'});
      await loadData();
    } catch (error: any) {
      await safeShowToast({
        title: error?.message ?? '添加失败',
        icon: 'none',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBill(billId: number): Promise<void> {
    try {
      const result = await Taro.showModal({
        title: '删除账单',
        content: '删除后不可恢复，是否继续？',
      });
      if (!result.confirm) {
        return;
      }
      deleteBillLocal(billId);
      await loadData();
    } catch (error) {
      console.warn('[bills] delete failed:', error);
      await safeShowToast({title: '删除失败，请重试', icon: 'none'});
    }
  }

  return (
    <View className="container">
      <View className="bills-toolbar">
        <View className="bills-filter-row">
          <Button
            className="bills-filter-btn"
            type={type === 'ALL' ? 'primary' : 'default'}
            onClick={() => setType('ALL')}>
            全部
          </Button>
          <Button
            className="bills-filter-btn"
            type={type === 'EXPENSE' ? 'primary' : 'default'}
            onClick={() => setType('EXPENSE')}>
            支出
          </Button>
          <Button
            className="bills-filter-btn"
            type={type === 'INCOME' ? 'primary' : 'default'}
            onClick={() => setType('INCOME')}>
            收入
          </Button>
        </View>

        <View className="bills-form-row">
          <Text>快速新增（演示）</Text>
        </View>

        <View className="bills-filter-row">
          <Button
            className="bills-filter-btn"
            type={newType === 'EXPENSE' ? 'primary' : 'default'}
            onClick={() => setNewType('EXPENSE')}>
            支出
          </Button>
          <Button
            className="bills-filter-btn"
            type={newType === 'INCOME' ? 'primary' : 'default'}
            onClick={() => setNewType('INCOME')}>
            收入
          </Button>
        </View>

        <View className="bills-form-row">
          <Text>金额</Text>
          <Input
            className="bills-input"
            type="number"
            value={amount}
            onInput={event => setAmount(event.detail.value)}
            placeholder="例如 35.5"
          />
        </View>

        <View className="bills-form-row">
          <Text>备注（可选）</Text>
          <Input
            className="bills-input"
            value={remark}
            onInput={event => setRemark(event.detail.value)}
            placeholder="例如：早餐 / 打车"
          />
        </View>

        <Button
          className="bills-submit"
          type="primary"
          loading={saving}
          onClick={handleAddBill}>
          新增账单
        </Button>
      </View>

      {bills.length === 0 ? (
        <View className="card">
          <Text className="muted">暂无账单，先添加一笔试试。</Text>
        </View>
      ) : (
        bills.map(bill => (
          <View className="bills-item" key={bill.id}>
            <View className="bills-item-row">
              <Text>{categoryMap.get(bill.categoryId) ?? '未分类'}</Text>
              <Text>{bill.type === 'INCOME' ? '+' : '-'}{formatCurrency(bill.amount)}</Text>
            </View>
            <View className="bills-item-note">
              <Text className="muted">{bill.remark || '无备注'}</Text>
            </View>
            <View className="bills-item-row">
              <Text className="muted">{formatDateTime(bill.billTime)}</Text>
              <Text className="muted">{bill.accountType}</Text>
            </View>
            <View className="bills-item-actions">
              <Button size="mini" onClick={() => handleDeleteBill(bill.id)}>
                删除
              </Button>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
