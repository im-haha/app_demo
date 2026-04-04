import {
  formatCurrency,
  formatDateTime,
  formatSignedCurrency,
  type BillRecord,
  type BudgetSummary,
  type OverviewStats,
  type UserProfile,
} from 'account-app-shared';

interface HomePanelProps {
  user: UserProfile | undefined;
  overview: OverviewStats;
  budget: BudgetSummary;
  recentBills: BillRecord[];
  categoryNameMap: Map<number, string>;
  onOpenBills: () => void;
}

export default function HomePanel({
  user,
  overview,
  budget,
  recentBills,
  categoryNameMap,
  onOpenBills,
}: HomePanelProps): React.JSX.Element {
  return (
    <section className="panel-grid">
      <article className="hero-card">
        <p className="hero-greet">你好，{user?.nickname ?? '你'}</p>
        <h2>{formatSignedCurrency(overview.monthBalance)}</h2>
        <p className="hero-note">
          本月预算使用：{formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetAmount)}
        </p>
      </article>

      <div className="stat-grid">
        <article className="card-like stat-card">
          <span className="muted">今日支出</span>
          <strong>{formatCurrency(overview.todayExpense)}</strong>
        </article>
        <article className="card-like stat-card">
          <span className="muted">今日收入</span>
          <strong>{formatCurrency(overview.todayIncome)}</strong>
        </article>
        <article className="card-like stat-card">
          <span className="muted">本月支出</span>
          <strong>{formatCurrency(overview.monthExpense)}</strong>
        </article>
        <article className="card-like stat-card">
          <span className="muted">本月收入</span>
          <strong>{formatCurrency(overview.monthIncome)}</strong>
        </article>
      </div>

      <article className="card-like">
        <div className="section-head">
          <h3>最近账单</h3>
          <button className="text-btn" onClick={onOpenBills}>
            查看全部
          </button>
        </div>
        {recentBills.length === 0 ? (
          <p className="muted">还没有账单，去账单页先记一笔。</p>
        ) : (
          <div className="bill-list">
            {recentBills.map(bill => (
              <article className="bill-item" key={bill.id}>
                <div className="bill-row">
                  <span>{categoryNameMap.get(bill.categoryId) ?? '未分类'}</span>
                  <strong>{bill.type === 'INCOME' ? '+' : '-'}{formatCurrency(bill.amount)}</strong>
                </div>
                <div className="bill-row muted small">
                  <span>{bill.remark || '无备注'}</span>
                  <span>{formatDateTime(bill.billTime)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
