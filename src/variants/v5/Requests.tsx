// V5 "Dark premium" mock of the double opt-in inbox: a ruled ledger with mono status codes, one look per status.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useRequestsMock } from '../shared/useRound3';
import { pad2 } from './logic';

/**
 * V5 requests inbox: role switch as underlined mono tabs, then a numbered ledger of requests. Each row is drawn only
 * from title, detail, label and due, and styled only by its status (a declined proposal reads as "waiting").
 */
export function Requests() {
  const { t } = useI18n();
  const c = t.variants.requestsMock;
  const r = useRequestsMock();

  return (
    <div className="v5-page v5-req">
      <header className="v5-agent-head">
        <p className="v5-micro">{t.variants.v5.label.product}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.requests}
        </h1>
        <p className="v5-lead v5-req-lead">{c.lead}</p>
        <p className="v5-muted v5-small v5-req-profile">{r.profileLine}</p>
      </header>

      <div className="v5-req-tabs" role="group" aria-label={c.tabsLabel}>
        {r.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="v5-req-tab"
            aria-pressed={r.tab === tab.id}
            onClick={() => r.setTab(tab.id)}
          >
            {tab.label} <span className="v5-req-tab-count">{pad2(tab.count)}</span>
          </button>
        ))}
      </div>

      <ol className="v5-req-list">
        {r.rows.map((row) => (
          <li className="vx-req v5-req-row" data-status={row.status} key={row.id}>
            {/* The ledger number comes from a CSS counter, so no row carries its position (a declined row stays identical to a waiting one). */}
            <span className="v5-req-idx" aria-hidden="true" />
            <div className="v5-req-main">
              <h2 className="v5-req-title">{row.title}</h2>
              <p className="v5-req-detail">{row.detail}</p>
            </div>
            <p className="v5-req-state">
              <span className="v5-req-badge">{row.label}</span>
              {row.due && <span className="v5-req-due">{row.due}</span>}
            </p>
          </li>
        ))}
      </ol>

      <p className="v5-micro v5-req-note">{r.note}</p>
      <div className="v5-ctas v5-req-actions">
        <Link className="v5-btn v5-btn-primary" to={r.realHref}>
          {c.openReal}
        </Link>
      </div>
      <p className="v5-muted v5-small v5-mock-note">{c.note}</p>
    </div>
  );
}
