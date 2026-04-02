import type {DataMode} from '@/api/config';

type AuthMode = 'LOGIN' | 'REGISTER';

interface AuthPanelProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  nickname: string;
  setNickname: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  authSubmitting: boolean;
  onSubmit: () => void;
  dataMode: DataMode;
}

export default function AuthPanel({
  authMode,
  setAuthMode,
  nickname,
  setNickname,
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  authSubmitting,
  onSubmit,
  dataMode,
}: AuthPanelProps): React.JSX.Element {
  return (
    <section className="auth-layout">
      <article className="auth-card card-like">
        <header className="auth-header">
          <p className="eyebrow">离线优先 · Web</p>
          <h1>你的跨端账本</h1>
          <p>
            当前运行模式：
            <strong>{dataMode === 'local' ? '本地离线' : '后端接口'}</strong>
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

        <button className="primary-btn" onClick={onSubmit} disabled={authSubmitting}>
          {authSubmitting
            ? '提交中...'
            : authMode === 'LOGIN'
              ? '登录并进入'
              : '注册并进入'}
        </button>
      </article>
    </section>
  );
}
