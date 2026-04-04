import type {DataMode} from '@/api/config';
import type {UserProfile} from 'account-app-shared';

interface MinePanelProps {
  user: UserProfile | undefined;
  dataMode: DataMode;
  apiBaseUrl: string;
  nicknameDraft: string;
  setNicknameDraft: (value: string) => void;
  onSaveNickname: () => void;
  profileSaving: boolean;
  onBackHome: () => void;
  onLogout: () => void;
}

export default function MinePanel({
  user,
  dataMode,
  apiBaseUrl,
  nicknameDraft,
  setNicknameDraft,
  onSaveNickname,
  profileSaving,
  onBackHome,
  onLogout,
}: MinePanelProps): React.JSX.Element {
  return (
    <section className="panel-grid">
      <article className="card-like">
        <h3>{user?.nickname ?? '未登录用户'}</h3>
        <p className="muted">@{user?.username ?? '-'}</p>
        <p className="muted small">
          数据模式：{dataMode} ｜ 接口地址：{apiBaseUrl}
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
          <button className="primary-btn" onClick={onSaveNickname} disabled={profileSaving}>
            {profileSaving ? '保存中...' : '保存昵称'}
          </button>
          <button className="ghost-btn" onClick={onBackHome}>
            回首页
          </button>
        </div>
      </article>

      <article className="card-like">
        <button className="danger-btn" onClick={onLogout}>
          退出登录
        </button>
      </article>
    </section>
  );
}
