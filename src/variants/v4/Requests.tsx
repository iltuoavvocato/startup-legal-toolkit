// V4 double opt-in inbox (mock): a segmented pill toggle switches role, each request is a rounded card with a coloured
// status stripe and badge. A row shows only the fields the hook hands over: on the founder side a declined proposal is
// "waiting" like an unanswered one, so it looks exactly the same.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useRequestsMock } from '../shared/useRound3';

/** Status glyph, decorative: keyed only by the status, so it reveals nothing the badge text does not. */
const GLYPH: Record<string, string> = { waiting: '…', 'your-turn': '!', intro: '✓', expired: '×', 'declined-by-you': '–' };

/** The mock requests page of V4: role toggle, request cards, small print and the link to the real page. */
export function Requests() {
  const { t } = useI18n();
  const c = t.variants.requestsMock;
  const r = useRequestsMock();

  return (
    <div className="v4-page v4-req">
      <header className="v4-head">
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.requests}
        </h1>
        <p className="v4-lead">{c.lead}</p>
        <p className="v4-profile v4-req-profile">{r.profileLine}</p>
      </header>

      <div className="v4-req-tabs" role="group" aria-label={c.tabsLabel}>
        {r.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="v4-req-tab"
            aria-pressed={r.tab === tab.id}
            onClick={() => r.setTab(tab.id)}
          >
            {tab.label} <span className="v4-req-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <ul className="v4-req-list">
        {r.rows.map((row) => (
          <li className="vx-req v4-req-card" data-status={row.status} key={row.id}>
            <span className="v4-req-glyph" aria-hidden="true">
              {GLYPH[row.status] ?? '•'}
            </span>
            <div className="v4-req-body">
              <h2 className="v4-req-title">{row.title}</h2>
              <p className="v4-req-detail">{row.detail}</p>
              <p className="v4-req-meta">
                <span className="v4-req-badge">{row.label}</span>
                {row.due ? <span className="v4-req-due">{row.due}</span> : null}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="v4-note v4-req-small">{r.note}</p>
      <p className="v4-note">{c.note}</p>
      <div className="v4-ctas">
        <Link className="v4-cta v4-cta-primary" to={r.realHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
