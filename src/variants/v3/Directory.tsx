// V3 investor directory (mock): the agent presents the demo investors, filtered by type with chips.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useDirectoryMock, useInvestorSummary } from '../shared/useMockScreens';
import { AgentBubble, Avatar } from './parts';

export function Directory() {
  const { t } = useI18n();
  const d = t.directory.dir;
  const c = t.variants.directoryMock;
  const v3 = t.variants.v3;
  const dir = useDirectoryMock();
  const summary = useInvestorSummary();

  return (
    <div className="v3-page">
      <header className="v3-pagehead">
        <p className="v3-eyebrow">{t.variants.variants.v3.name}</p>
        <h1 id="page-title" tabIndex={-1}>
          {d.title}
        </h1>
        <p className="v3-lead">{c.note}</p>
      </header>
      <section className="v3-chat" aria-label={d.title}>
        <header className="v3-chat-head">
          <Avatar small />
          <div className="v3-chat-who">
            <p className="v3-chat-name">{v3.agentName}</p>
            <p className="v3-chat-role">{v3.agentRole}</p>
          </div>
          <p className="v3-chat-status" aria-live="polite">
            {dir.countLine}
          </p>
        </header>
        <ol className="v3-log">
          <AgentBubble wide>
            <p>{c.lead}</p>
          </AgentBubble>
        </ol>
        <div className="v3-chips" role="group" aria-label={c.filterLabel}>
          {dir.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`v3-chip${dir.tipo === o.id ? ' is-primary' : ''}`}
              aria-pressed={dir.tipo === o.id}
              onClick={() => dir.setTipo(o.id)}
            >
              {o.label} <span className="v3-mock-count">{o.count}</span>
            </button>
          ))}
        </div>
      </section>

      <ul className="v3-mock-dir">
        {dir.shown.map((i) => {
          const s = summary(i);
          return (
            <li key={i.id} className="v3-card v3-mock-dcard">
              <h2 className="v3-card-name">{i.nome}</h2>
              <p className="v3-card-meta">
                {s.tipo}
                {s.sede ? ` · ${s.sede}` : ''}
              </p>
              <dl className="v3-mock-facts">
                <div>
                  <dt>{d.card.settori}</dt>
                  <dd>{s.settori}</dd>
                </div>
                <div>
                  <dt>{d.card.fasi}</dt>
                  <dd>{s.fasi}</dd>
                </div>
                <div>
                  <dt>{d.card.ticket}</dt>
                  <dd>{s.ticket}</dd>
                </div>
                <div>
                  <dt>{d.card.aree}</dt>
                  <dd>{s.aree}</dd>
                </div>
              </dl>
              <Link className="v3-mock-open" to={dir.profileHref(i.id)}>
                {d.card.open}
                <span className="sr-only">{d.card.openSr(i.nome)}</span> <span aria-hidden="true">→</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="v3-ctas">
        {dir.more > 0 && (
          <button type="button" className="v3-cta" onClick={dir.showMore}>
            {c.showMore(dir.more)}
          </button>
        )}
        <Link className="v3-cta is-primary v3-mock-link" to={dir.directoryHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
