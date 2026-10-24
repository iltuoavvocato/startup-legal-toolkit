// V1 "Editoriale": the double opt-in inbox as a magazine "letters" column.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useRequestsMock } from '../shared/useRound3';
import { Masthead } from './parts';

/**
 * The double opt-in requests as a correspondence column: the role switch is a contents line, each request a letter
 * with its status set in small caps. A row is drawn only from its title, detail, status and due date, so a declined
 * proposal looks exactly like one still waiting.
 */
export function Requests() {
  const { t } = useI18n();
  const c = t.variants.requestsMock;
  const r = useRequestsMock();

  return (
    <article className="v1-page v1-requests">
      <header className="v1-cover v1-cover-sm">
        <Masthead />
        <p className="v1-kicker">{r.profileLine}</p>
        <h1 id="page-title" tabIndex={-1} className="v1-display v1-display-sm">
          {t.variants.screens.requests}
        </h1>
        <p className="v1-standfirst">{c.lead}</p>
      </header>

      <div className="v1-column v1-req-tabs" role="group" aria-label={c.tabsLabel}>
        {r.tabs.map((tab) => (
          <button key={tab.id} type="button" className="v1-req-tab" aria-pressed={r.tab === tab.id} onClick={() => r.setTab(tab.id)}>
            {tab.label} <span className="v1-req-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <ol className="v1-column v1-req-list">
        {r.rows.map((row) => (
          <li className="vx-req v1-req" data-status={row.status} key={row.id}>
            <p className="v1-req-status">
              <span className="v1-req-badge">{row.label}</span>
              {row.due ? <span className="v1-req-due">{row.due}</span> : null}
            </p>
            <h2 className="v1-req-title">{row.title}</h2>
            <p className="v1-req-detail">{row.detail}</p>
          </li>
        ))}
      </ol>

      <div className="v1-column v1-mock-foot">
        <p className="v1-note v1-req-note">{r.note}</p>
        <p className="v1-note">{c.note}</p>
        <p>
          <Link className="v1-textlink" to={r.realHref}>
            {c.openReal} <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </article>
  );
}
