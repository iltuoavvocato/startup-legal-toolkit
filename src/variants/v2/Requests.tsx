// V2 Dashboard: double opt-in inbox as a work queue — KPI-style role tabs, one dense row per request, a status rail.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useRequestsMock } from '../shared/useRound3';
import { Eyebrow } from './parts';

/**
 * The mock inbox: founder and investor queues behind two counter tabs. Each row is drawn only from the hook's fields
 * (title, detail, status label, due), so a declined proposal and an unanswered one are the same "waiting" row.
 */
export function Requests() {
  const { t } = useI18n();
  const c = t.variants.requestsMock;
  const r = useRequestsMock();

  return (
    <div className="v2-page v2-requests">
      <header className="v2-head">
        <div>
          <Eyebrow>{t.variants.v2.landing.eyebrow}</Eyebrow>
          <h1 id="page-title" tabIndex={-1} className="v2-h1">
            {t.variants.screens.requests}
          </h1>
          <p className="v2-muted">{c.lead}</p>
          <p className="v2-small v2-muted v2-req-profile">{r.profileLine}</p>
        </div>
        <Link className="v2-btn v2-req-real" to={r.realHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </header>

      <div className="v2-req-tabs" role="group" aria-label={c.tabsLabel}>
        {r.tabs.map((tab) => (
          <button key={tab.id} type="button" className="v2-tab v2-req-tab" aria-pressed={r.tab === tab.id} onClick={() => r.setTab(tab.id)}>
            <span className="v2-tab-label">{tab.label}</span> <span className="v2-tab-count v2-num">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="v2-layout v2-req-layout">
        <section className="v2-main" aria-labelledby="v2-req-h">
          <div className="v2-req-panel">
            <div className="v2-req-bar">
              <h2 id="v2-req-h" className="v2-panel-h">
                {r.tabs.find((tab) => tab.id === r.tab)?.label}
              </h2>
              <span className="v2-small v2-num v2-muted">{c.count(r.rows.length)}</span>
            </div>
            <ul className="v2-req-list">
              {r.rows.map((row) => (
                <li key={row.id} className="vx-req v2-req" data-status={row.status}>
                  <span className="v2-req-state">{row.label}</span>
                  <span className="v2-req-body">
                    <span className="v2-name v2-req-title">{row.title}</span>
                    <span className="v2-req-detail">{row.detail}</span>
                  </span>
                  {row.due && <span className="v2-req-due v2-num">{row.due}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="v2-side" aria-label={t.variants.screens.requests}>
          <p className="v2-panel v2-small v2-req-note">{r.note}</p>
          <p className="v2-panel v2-muted v2-small">{c.note}</p>
        </aside>
      </div>
    </div>
  );
}
