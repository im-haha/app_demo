import {formatCurrency, formatDateTime, type BillRecord, type BillType} from 'account-app-shared';

type FilterType = BillType | 'ALL';

interface BillsPanelProps {
  refreshing: boolean;
  bills: BillRecord[];
  billFilterType: FilterType;
  onChangeBillFilter: (type: FilterType) => void;
  newBillType: BillType;
  setNewBillType: (type: BillType) => void;
  amount: string;
  setAmount: (value: string) => void;
  remark: string;
  setRemark: (value: string) => void;
  onAddBill: () => void;
  onDeleteBill: (billId: number) => void;
  categoryNameMap: Map<number, string>;
  onBackHome: () => void;
}

export default function BillsPanel({
  refreshing,
  bills,
  billFilterType,
  onChangeBillFilter,
  newBillType,
  setNewBillType,
  amount,
  setAmount,
  remark,
  setRemark,
  onAddBill,
  onDeleteBill,
  categoryNameMap,
  onBackHome,
}: BillsPanelProps): React.JSX.Element {
  return (
    <section className="panel-grid">
      <article className="card-like">
        <div className="section-head">
          <h3>账单筛选</h3>
          <span className="muted small">{refreshing ? '刷新中...' : `共 ${bills.length} 条`}</span>
        </div>

        <div className="inline-buttons">
          {(['ALL', 'EXPENSE', 'INCOME'] as FilterType[]).map(type => (
            <button
              key={type}
              className={`ghost-btn ${billFilterType === type ? 'is-active' : ''}`}
              onClick={() => onChangeBillFilter(type)}>
              {type === 'ALL' ? '全部' : type === 'EXPENSE' ? '支出' : '收入'}
            </button>
          ))}
        </div>
      </article>

      <article className="card-like">
        <h3>快速新增</h3>

        <div className="inline-buttons compact-gap">
          <button
            className={`ghost-btn ${newBillType === 'EXPENSE' ? 'is-active' : ''}`}
            onClick={() => setNewBillType('EXPENSE')}>
            支出
          </button>
          <button
            className={`ghost-btn ${newBillType === 'INCOME' ? 'is-active' : ''}`}
            onClick={() => setNewBillType('INCOME')}>
            收入
          </button>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>金额</span>
            <input
              type="number"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              placeholder="例如 35.5"
            />
          </label>
          <label className="field">
            <span>备注（可选）</span>
            <input
              value={remark}
              onChange={event => setRemark(event.target.value)}
              placeholder="例如：早餐 / 打车"
            />
          </label>
        </div>

        <button className="primary-btn" onClick={onAddBill} disabled={refreshing}>
          新增账单
        </button>
      </article>

      <article className="card-like">
        <div className="section-head">
          <h3>账单列表</h3>
          <button className="text-btn" onClick={onBackHome}>
            回首页
          </button>
        </div>

        {bills.length === 0 ? (
          <p className="muted">暂无账单，先添加一笔试试。</p>
        ) : (
          <div className="bill-list">
            {bills.map(bill => (
              <article className="bill-item" key={bill.id}>
                <div className="bill-row">
                  <span>{categoryNameMap.get(bill.categoryId) ?? '未分类'}</span>
                  <strong>{bill.type === 'INCOME' ? '+' : '-'}{formatCurrency(bill.amount)}</strong>
                </div>
                <div className="bill-row muted small">
                  <span>{bill.remark || '无备注'}</span>
                  <span>{bill.accountType}</span>
                </div>
                <div className="bill-row muted small">
                  <span>{formatDateTime(bill.billTime)}</span>
                  <button className="danger-btn" onClick={() => onDeleteBill(bill.id)}>
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
