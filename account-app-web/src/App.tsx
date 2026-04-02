import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import dayjs from 'dayjs';
import {
  formatCurrency,
  formatDateTime,
  formatSignedCurrency,
  type BillInput,
  type BillRecord,
  type BillType,
  type BudgetSummary,
  type OverviewStats,
  type UserProfile,
} from 'account-app-shared';
import {appClient} from '@/api';
import {DATA_MODE, API_BASE_URL} from '@/api/config';

type AuthMode = 'LOGIN' | 'REGISTER';
type TabKey = 'home' | 'bills' | 'mine';
type FilterType = BillType | 'ALL';
type NoticeTone = 'success' | 'error';

interface NoticeState {
  tone: NoticeTone;
  text: string;
}

const EMPTY_OVERVIEW: OverviewStats = {
  todayIncome: 0,
  todayExpense: 0,
  monthIncome: 0,
  monthExpense: 0,
  monthBalance: 0,
};

function createEmptyBudget(month: string): BudgetSummary {
  return {
    month,
    budgetAmount: 0,
    spentAmount: 0,
    remainingAmount: 0,
    usageRate: 0,
  };
}

function getErrorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}

export default function App(): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const [session, setSession] = useState<{currentUserId: number | null; token: string | null}>({
    currentUserId: null,
    token: null,
  });

  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [overview, setOverview] = useState<OverviewStats>(EMPTY_OVERVIEW);
  const [budget, setBudget] = useState<BudgetSummary>(createEmptyBudget(dayjs().format('YYYY-MM')));
  const [categories, setCategories] = useState<Array<{id: number; name: string; type: BillType}>>([]);
  const [recentBills, setRecentBills] = useState<BillRecord[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);

  const [billFilterType, setBillFilterType] = useState<FilterType>('ALL');
  const [newBillType, setNewBillType] = useState<BillType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');

  const [nicknameDraft, setNicknameDraft] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const noticeTimerRef = useRef<number | null>(null);

  const isAuthenticated = Boolean(session.currentUserId && session.token);

  const categoryNameMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(category => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  const pushNotice = useCallback((tone: NoticeTone, text: string) => {
    setNotice({tone, text});
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 2800);
  }, []);

  const resetAuthedData = useCallback(() => {
    const month = dayjs().format('YYYY-MM');
    setUser(undefined);
    setOverview(EMPTY_OVERVIEW);
    setBudget(createEmptyBudget(month));
    setCategories([]);
    setRecentBills([]);
    setBills([]);
    setNicknameDraft('');
  }, []);

  const loadHomeData = useCallback(async () => {
    const month = dayjs().format('YYYY-MM');
    const [nextUser, nextOverview, nextBudget, nextCategories, nextRecentBills] = await Promise.all([
      appClient.getCurrentUser(),
      appClient.getOverview(),
      appClient.getBudget(month),
      appClient.getCategories(),
      appClient.getRecentBills(6),
    ]);

    if (!nextUser) {
      throw new Error('登录状态失效，请重新登录');
    }

    setUser(nextUser);
    setNicknameDraft(nextUser.nickname);
    setOverview(nextOverview);
    setBudget(nextBudget);
    setCategories(nextCategories);
    setRecentBills(nextRecentBills);
  }, []);

  const loadBillsData = useCallback(async (filterType: FilterType) => {
    const filters = filterType === 'ALL' ? undefined : {type: filterType};
    const [nextCategories, nextBills] = await Promise.all([
      appClient.getCategories(),
      appClient.getBills(filters),
    ]);

    setCategories(nextCategories);
    setBills(nextBills);
  }, []);

  const hydrateAfterLogin = useCallback(
    async (filterType: FilterType) => {
      await Promise.all([loadHomeData(), loadBillsData(filterType)]);
    },
    [loadBillsData, loadHomeData],
  );

  const clearLoginState = useCallback(() => {
    setSession({currentUserId: null, token: null});
    setActiveTab('home');
    resetAuthedData();
  }, [resetAuthedData]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async (): Promise<void> => {
      setBusy(true);
      try {
        await appClient.initialize();
        const nextSession = await appClient.getSession();
        if (!mounted) {
          return;
        }

        setSession(nextSession);

        if (nextSession.currentUserId && nextSession.token) {
          try {
            await hydrateAfterLogin('ALL');
          } catch (error) {
            clearLoginState();
            pushNotice('error', getErrorMessage(error, '读取本地数据失败，请重新登录'));
          }
        }
      } catch (error) {
        pushNotice('error', getErrorMessage(error, '初始化失败，请刷新页面'));
      } finally {
        if (mounted) {
          setBusy(false);
          setReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, [clearLoginState, hydrateAfterLogin, pushNotice]);

  const handleAuthSubmit = useCallback(async () => {
    if (authSubmitting) {
      return;
    }

    if (!username.trim()) {
      pushNotice('error', '请输入用户名');
      return;
    }

    if (!password.trim()) {
      pushNotice('error', '请输入密码');
      return;
    }

    if (authMode === 'REGISTER') {
      if (!nickname.trim()) {
        pushNotice('error', '请输入昵称');
        return;
      }
      if (password !== confirmPassword) {
        pushNotice('error', '两次密码不一致');
        return;
      }
    }

    try {
      setAuthSubmitting(true);

      if (authMode === 'LOGIN') {
        await appClient.login({username: username.trim(), password});
      } else {
        await appClient.register({
          username: username.trim(),
          password,
          nickname: nickname.trim(),
        });
      }

      const nextSession = await appClient.getSession();
      setSession(nextSession);
      setActiveTab('home');
      setBillFilterType('ALL');
      await hydrateAfterLogin('ALL');

      setPassword('');
      setConfirmPassword('');
      pushNotice('success', authMode === 'LOGIN' ? '登录成功' : '注册成功');
    } catch (error) {
      pushNotice('error', getErrorMessage(error));
    } finally {
      setAuthSubmitting(false);
    }
  }, [
    authMode,
    authSubmitting,
    confirmPassword,
    hydrateAfterLogin,
    nickname,
    password,
    pushNotice,
    username,
  ]);

  const handleLogout = useCallback(async () => {
    try {
      await appClient.logout();
    } finally {
      clearLoginState();
      pushNotice('success', '已退出登录');
    }
  }, [clearLoginState, pushNotice]);

  const handleChangeBillFilter = useCallback(
    async (nextType: FilterType) => {
      if (nextType === billFilterType || refreshing) {
        return;
      }

      try {
        setRefreshing(true);
        setBillFilterType(nextType);
        await loadBillsData(nextType);
      } catch (error) {
        pushNotice('error', getErrorMessage(error));
      } finally {
        setRefreshing(false);
      }
    },
    [billFilterType, loadBillsData, pushNotice, refreshing],
  );

  const handleAddBill = useCallback(async () => {
    if (refreshing) {
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      pushNotice('error', '请输入大于 0 的金额');
      return;
    }

    try {
      setRefreshing(true);

      let defaultCategory = categories.find(category => category.type === newBillType);
      if (!defaultCategory) {
        const fetched = await appClient.getCategories(newBillType);
        defaultCategory = fetched[0];
      }

      if (!defaultCategory) {
        throw new Error('当前没有可用分类');
      }

      const payload: BillInput = {
        type: newBillType,
        amount: parsedAmount,
        categoryId: defaultCategory.id,
        accountType: 'WECHAT',
        billTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        remark: remark.trim(),
      };

      await appClient.addBill(payload);
      await Promise.all([loadHomeData(), loadBillsData(billFilterType)]);

      setAmount('');
      setRemark('');
      pushNotice('success', '账单已添加');
    } catch (error) {
      pushNotice('error', getErrorMessage(error, '新增账单失败'));
    } finally {
      setRefreshing(false);
    }
  }, [amount, billFilterType, categories, loadBillsData, loadHomeData, newBillType, pushNotice, refreshing, remark]);

  const handleDeleteBill = useCallback(
    async (billId: number) => {
      if (!window.confirm('删除后不可恢复，是否继续？')) {
        return;
      }

      try {
        setRefreshing(true);
        await appClient.deleteBill(billId);
        await Promise.all([loadHomeData(), loadBillsData(billFilterType)]);
        pushNotice('success', '账单已删除');
      } catch (error) {
        pushNotice('error', getErrorMessage(error, '删除失败，请稍后重试'));
      } finally {
        setRefreshing(false);
      }
    },
    [billFilterType, loadBillsData, loadHomeData, pushNotice],
  );

  const handleSaveNickname = useCallback(async () => {
    if (profileSaving) {
      return;
    }

    if (!nicknameDraft.trim()) {
      pushNotice('error', '昵称不能为空');
      return;
    }

    try {
      setProfileSaving(true);
      const nextUser = await appClient.updateProfileNickname(nicknameDraft.trim());
      if (!nextUser) {
        throw new Error('保存失败');
      }
      setUser(nextUser);
      setNicknameDraft(nextUser.nickname);
      pushNotice('success', '昵称已更新');
    } catch (error) {
      pushNotice('error', getErrorMessage(error, '保存失败，请稍后重试'));
    } finally {
      setProfileSaving(false);
    }
  }, [nicknameDraft, profileSaving, pushNotice]);

  const openHomeFromBills = useCallback(() => {
    setActiveTab('home');
  }, []);

  if (!ready) {
    return (
      <main className="app-shell">
        <section className="splash card-like">
          <h1>记账本 Web</h1>
          <p>{busy ? '正在初始化本地数据...' : '准备中...'}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {notice ? <div className={`notice notice-${notice.tone}`}>{notice.text}</div> : null}

      {!isAuthenticated ? (
        <section className="auth-layout">
          <article className="auth-card card-like">
            <header className="auth-header">
              <p className="eyebrow">离线优先 · Web</p>
              <h1>你的跨端账本</h1>
              <p>
                当前运行模式：
                <strong>{DATA_MODE === 'local' ? '本地离线' : '后端接口'}</strong>
              </p>
            </header>

            <div className="auth-mode-row">
              <button
                className={`ghost-btn ${authMode === 'LOGIN' ? 'is-active' : ''}`}
                onClick={() => setAuthMode('LOGIN')}>
                登录
              </button>
              <button
                className={`ghost-btn ${authMode === 'REGISTER' ? 'is-active' : ''}`}
                onClick={() => setAuthMode('REGISTER')}>
                注册
              </button>
            </div>

            {authMode === 'REGISTER' ? (
              <label className="field">
                <span>昵称</span>
                <input
                  value={nickname}
                  onChange={event => setNickname(event.target.value)}
                  placeholder="输入昵称"
                  autoComplete="nickname"
                />
              </label>
            ) : null}

            <label className="field">
              <span>用户名</span>
              <input
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="至少 3 位"
                autoComplete="username"
              />
            </label>

            <label className="field">
              <span>密码</span>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="至少 6 位"
                autoComplete={authMode === 'LOGIN' ? 'current-password' : 'new-password'}
              />
            </label>

            {authMode === 'REGISTER' ? (
              <label className="field">
                <span>确认密码</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                />
              </label>
            ) : null}

            <button className="primary-btn" onClick={handleAuthSubmit} disabled={authSubmitting}>
              {authSubmitting
                ? '提交中...'
                : authMode === 'LOGIN'
                  ? '登录并进入'
                  : '注册并进入'}
            </button>
          </article>
        </section>
      ) : (
        <>
          <header className="top-banner card-like">
            <div>
              <p className="eyebrow">Web App</p>
              <h1>记账本</h1>
              <p className="muted">同一份业务模型，多端展示；当前默认离线可用。</p>
            </div>
            <div className="top-meta">
              <span className={`status-chip status-${DATA_MODE}`}>
                {DATA_MODE === 'local' ? 'LOCAL 模式' : 'REMOTE 模式'}
              </span>
              <span className="status-chip status-user">{user?.nickname ?? '未命名用户'}</span>
            </div>
          </header>

          <nav className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'home' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('home')}>
              首页
            </button>
            <button
              className={`tab-btn ${activeTab === 'bills' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('bills')}>
              账单
            </button>
            <button
              className={`tab-btn ${activeTab === 'mine' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('mine')}>
              我的
            </button>
          </nav>

          {activeTab === 'home' ? (
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
                  <button className="text-btn" onClick={() => setActiveTab('bills')}>
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
          ) : null}

          {activeTab === 'bills' ? (
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
                      onClick={() => {
                        void handleChangeBillFilter(type);
                      }}>
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

                <button className="primary-btn" onClick={() => void handleAddBill()} disabled={refreshing}>
                  新增账单
                </button>
              </article>

              <article className="card-like">
                <div className="section-head">
                  <h3>账单列表</h3>
                  <button className="text-btn" onClick={openHomeFromBills}>
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
                          <button className="danger-btn" onClick={() => void handleDeleteBill(bill.id)}>
                            删除
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </section>
          ) : null}

          {activeTab === 'mine' ? (
            <section className="panel-grid">
              <article className="card-like">
                <h3>{user?.nickname ?? '未登录用户'}</h3>
                <p className="muted">@{user?.username ?? '-'}</p>
                <p className="muted small">
                  数据模式：{DATA_MODE} ｜ 接口地址：{API_BASE_URL}
                </p>
              </article>

              <article className="card-like">
                <h3>个人设置</h3>
                <label className="field">
                  <span>昵称</span>
                  <input
                    value={nicknameDraft}
                    onChange={event => setNicknameDraft(event.target.value)}
                    placeholder="输入新的昵称"
                  />
                </label>
                <div className="inline-buttons compact-gap">
                  <button
                    className="primary-btn"
                    onClick={() => void handleSaveNickname()}
                    disabled={profileSaving}>
                    {profileSaving ? '保存中...' : '保存昵称'}
                  </button>
                  <button className="ghost-btn" onClick={() => setActiveTab('home')}>
                    回首页
                  </button>
                </div>
              </article>

              <article className="card-like">
                <button className="danger-btn" onClick={() => void handleLogout()}>
                  退出登录
                </button>
              </article>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
