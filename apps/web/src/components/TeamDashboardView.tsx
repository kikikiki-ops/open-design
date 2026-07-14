// Team analytics dashboard (demo).
//
// UC-10: owner/admin-visible workspace data overview. Demo-only data for
// product review; no backend calls yet.

import { Icon } from './Icon';

const DASHBOARD_STATS = [
  { label: '创建的设计数', value: '128', delta: '+18 本周', icon: 'grid' },
  { label: '创建的 Design System 数', value: '12', delta: '+3 本月', icon: 'palette' },
  { label: '活跃成员', value: '5', delta: '过去 7 天', icon: 'share' },
] as const;

const TOKEN_RANKING = [
  { name: '琼羽（你）', role: 'Owner', tokens: '1.42M' },
  { name: '张伟', role: 'Manager', tokens: '980K' },
  { name: '李娜', role: 'Editor', tokens: '640K' },
  { name: '王芳', role: 'Reviewer', tokens: '420K' },
] as const;

const MEMBER_CREDITS = [
  { name: '琼羽（你）', role: 'Owner', remaining: '18,400', used: '41,600', status: '充足' },
  { name: '张伟', role: 'Manager', remaining: '9,800', used: '24,200', status: '正常' },
  { name: '李娜', role: 'Editor', remaining: '1,200', used: '18,900', status: '偏低' },
  { name: '王芳', role: 'Viewer', remaining: '320', used: '6,700', status: '需续额' },
] as const;

export type TeamDashboardAutoRechargeTarget =
  | { kind: 'team' }
  | { kind: 'member'; name: string; role: string };

type TeamDashboardViewProps = {
  isAdmin?: boolean;
  isTeamPlan?: boolean;
  onAutoRecharge?: (target: TeamDashboardAutoRechargeTarget) => void;
};

export function TeamDashboardView({ isAdmin = true, isTeamPlan = false, onAutoRecharge }: TeamDashboardViewProps) {
  function creditStatusClass(status: string) {
    if (status === '需续额') return 'is-critical';
    if (status === '偏低') return 'is-muted';
    return 'is-brand';
  }

  return (
    <div className="entry-section team-dashboard">
      <header className="entry-section__head team-dashboard__head">
        <div>
          <h1 className="entry-section__title">数据大盘</h1>
        </div>
      </header>

      {isTeamPlan && isAdmin ? (
        <section className="team-dashboard__recharge-callout" aria-label="自动充值引导">
          <span className="team-dashboard__recharge-icon" aria-hidden>
            <Icon name="refresh" size={17} />
          </span>
          <div>
            <h2>开启自动充值，避免团队协作中断</h2>
            <p>团队版升级后建议设置额度阈值。当团队额度低于阈值时自动补充，避免 Agent 任务和多人协作被打断。</p>
          </div>
          <button type="button" onClick={() => onAutoRecharge?.({ kind: 'team' })}>开启自动充值</button>
        </section>
      ) : null}

      <section className="team-dashboard__hero" aria-label="数据大盘">
        <div className="team-dashboard__hero-copy">
          <h2>Nexu 团队</h2>
          <p>汇总团队产出、Design System 沉淀、活跃协作和 token 消耗结构。</p>
        </div>
        <div className="team-dashboard__hero-meta" aria-label="数据范围">
          <span>Owner / Manager</span>
          <span>最近 30 天</span>
          <span>Demo data</span>
        </div>
      </section>

      <section className="team-dashboard__credit-card" aria-label="团队额度">
        <div className="team-dashboard__token-head">
          <div>
            <h2>{isAdmin ? '团队成员额度' : '我的额度'}</h2>
          </div>
          <span>{isAdmin ? 'Admin' : 'Member'}</span>
        </div>
        {isAdmin ? (
          <div className="team-dashboard__credit-table">
            {MEMBER_CREDITS.map((member) => (
              <div className="team-dashboard__credit-row" key={member.name}>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
                <div>
                  <span>剩余</span>
                  <strong>{member.remaining}</strong>
                </div>
                <div>
                  <span>本周期已用</span>
                  <strong>{member.used}</strong>
                </div>
                <em className={creditStatusClass(member.status)}>{member.status}</em>
                <button
                  type="button"
                  onClick={() => onAutoRecharge?.({ kind: 'member', name: member.name, role: member.role })}
                >
                  续额度
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="team-dashboard__member-credit">
            <strong>剩余额度 320</strong>
            <p>你当前是 Member，不能自行续额度。需要更多额度时，请联系团队 Admin。</p>
            <button type="button">提醒 Admin 提额</button>
          </div>
        )}
      </section>

      <div className="team-dashboard__metric-grid">
        {DASHBOARD_STATS.map((stat) => (
          <article className="team-dashboard__metric-card" key={stat.label}>
            <span className="team-dashboard__metric-icon" aria-hidden>
              <Icon name={stat.icon} size={16} />
            </span>
            <span className="team-dashboard__metric-label">{stat.label}</span>
            <strong className="team-dashboard__metric-value">{stat.value}</strong>
            <span className="team-dashboard__metric-delta">{stat.delta}</span>
          </article>
        ))}
      </div>

      <section className="team-dashboard__token-card" aria-label="Token 消耗排名">
        <div className="team-dashboard__token-head">
          <div>
            <h2>Token 消耗排名</h2>
          </div>
          <span>Top 4</span>
        </div>

        <div className="team-dashboard__token-list">
          {TOKEN_RANKING.map((person, index) => (
            <div className="team-dashboard__token-row" key={person.name}>
              <span className="team-dashboard__token-rank">{index + 1}</span>
              <div className="team-dashboard__token-person">
                <strong>{person.name}</strong>
                <span>{person.role}</span>
              </div>
              <span className="team-dashboard__token-value">{person.tokens}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
