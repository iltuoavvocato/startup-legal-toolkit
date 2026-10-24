// V3 double opt-in inbox (mock): the agent keeps the thread of requests, one message-card per request, roles as chips.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useRequestsMock } from '../shared/useRound3';
import { AgentBubble, Avatar } from './parts';

/** The inbox as a chat thread: role chips on top, every request a card whose look depends only on its status. */
export function Requests() {
  const { t } = useI18n();
  const c = t.variants.requestsMock;
  const v3 = t.variants.v3;
  const r = useRequestsMock();

  return (
    <div className="v3-page">
      <header className="v3-pagehead">
        <p className="v3-eyebrow">{t.variants.variants.v3.name}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.requests}
        </h1>
        <p className="v3-lead">{c.lead}</p>
        <p className="v3-small v3-req-profile">{r.profileLine}</p>
      </header>
      <section className="v3-chat" aria-label={t.variants.screens.requests}>
        <header className="v3-chat-head">
          <Avatar small />
          <div className="v3-chat-who">
            <p className="v3-chat-name">{v3.agentName}</p>
            <p className="v3-chat-role">{v3.agentRole}</p>
          </div>
        </header>
        <div className="v3-chips v3-req-tabs" role="group" aria-label={c.tabsLabel}>
          {r.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`v3-chip v3-req-tab${r.tab === tab.id ? ' is-primary' : ''}`}
              aria-pressed={r.tab === tab.id}
              onClick={() => r.setTab(tab.id)}
            >
              {tab.label} <span className="v3-mock-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <ol className="v3-log">
          <AgentBubble wide>
            <p className="v3-req-note">{r.note}</p>
          </AgentBubble>
        </ol>
        <ul className="v3-req-list">
          {r.rows.map((row) => (
            <li className="vx-req v3-req" data-status={row.status} key={row.id}>
              <div className="v3-req-head">
                <p className="v3-req-title">{row.title}</p>
                <p className="v3-req-badge">{row.label}</p>
              </div>
              <p className="v3-req-detail">{row.detail}</p>
              {row.due && <p className="v3-req-due">{row.due}</p>}
            </li>
          ))}
        </ul>
      </section>
      <p className="v3-small v3-req-foot">{c.note}</p>
      <div className="v3-ctas">
        <Link className="v3-cta is-primary v3-mock-link" to={r.realHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
