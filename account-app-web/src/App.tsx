import {Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import dayjs from 'dayjs';
import {
  AuthPanelLazy,
  BillsPanelLazy,
  HomePanelLazy,
  MinePanelLazy,
  prefetchAuthedRoutes,
  prefetchByTabIntent,
  prefetchUnauthedRoutes,
  type WebTabKey,
} from '@/modules/lazy';
import {warmupApiOrigin} from '@/performance/networkHints';
import {
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
type TabKey = WebTabKey;
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

function PanelFallback(): React.JSX.Element {
  return (
    <section className="card-like panel-loading">
      <p className="muted">页面加载中...</p>
    </section>
  );
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
    [loadHomeData, loadBillsData],
  );

  const clearLoginState = useCallback(() => {
    setSession({currentUserId: null, token: null});
    setActiveTab('home');
    resetAuthedData();
  }, [resetAuthedData]);

  useEffect(() => {
    if (DATA_MODE === 'remote') {
      warmupApiOrigin(API_BASE_URL);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (isAuthenticated) {
      prefetchAuthedRoutes(activeTab);
      return;
    }

    prefetchUnauthedRoutes();
  }, [activeTab, isAuthenticated, ready]);

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

  const warmTab = useCallback((tab: TabKey) => {
    prefetchByTabIntent(tab);
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
        <Suspense fallback={<PanelFallback />}>
          <AuthPanelLazy
            authMode={authMode}
            setAuthMode={setAuthMode}
            nickname={nickname}
            setNickname={setNickname}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            authSubmitting={authSubmitting}
            onSubmit={() => {
              void handleAuthSubmit();
            }}
            dataMode={DATA_MODE}
          />
        </Suspense>
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
              onClick={() => setActiveTab('home')}
              onMouseEnter={() => warmTab('home')}
              onFocus={() => warmTab('home')}>
              首页
            </button>
            <button
              className={`tab-btn ${activeTab === 'bills' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('bills')}
              onMouseEnter={() => warmTab('bills')}
              onFocus={() => warmTab('bills')}>
              账单
            </button>
            <button
              className={`tab-btn ${activeTab === 'mine' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('mine')}
              onMouseEnter={() => warmTab('mine')}
              onFocus={() => warmTab('mine')}>
              我的
            </button>
          </nav>

          <Suspense fallback={<PanelFallback />}>
            {activeTab === 'home' ? (
              <HomePanelLazy
                user={user}
                overview={overview}
                budget={budget}
                recentBills={recentBills}
                categoryNameMap={categoryNameMap}
                onOpenBills={() => setActiveTab('bills')}
              />
            ) : null}

            {activeTab === 'bills' ? (
              <BillsPanelLazy
                refreshing={refreshing}
                bills={bills}
                billFilterType={billFilterType}
                onChangeBillFilter={type => {
                  void handleChangeBillFilter(type);
                }}
                newBillType={newBillType}
                setNewBillType={setNewBillType}
                amount={amount}
                setAmount={setAmount}
                remark={remark}
                setRemark={setRemark}
                onAddBill={() => {
                  void handleAddBill();
                }}
                onDeleteBill={billId => {
                  void handleDeleteBill(billId);
                }}
                categoryNameMap={categoryNameMap}
                onBackHome={openHomeFromBills}
              />
            ) : null}

            {activeTab === 'mine' ? (
              <MinePanelLazy
                user={user}
                dataMode={DATA_MODE}
                apiBaseUrl={API_BASE_URL}
                nicknameDraft={nicknameDraft}
                setNicknameDraft={setNicknameDraft}
                onSaveNickname={() => {
                  void handleSaveNickname();
                }}
                profileSaving={profileSaving}
                onBackHome={() => setActiveTab('home')}
                onLogout={() => {
                  void handleLogout();
                }}
              />
            ) : null}
          </Suspense>
        </>
      )}
    </main>
  );
}
