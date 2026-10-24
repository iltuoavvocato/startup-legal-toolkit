import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useDirectoryMock, useInvestorSummary } from '../shared/useMockScreens';
import { pad2 } from './logic';

/** V5 investor directory: a minimal ruled list with mono ticket figures and a type filter. */
export function Directory() {
  const { t } = useI18n();
  const d = t.directory.dir;
  const c = t.variants.directoryMock;
  const dir = useDirectoryMock();
  const summary = useInvestorSummary();

  return (
    <div className="v5-page v5-dir">
      <header className="v5-agent-head">
        <p className="v5-micro">{t.variants.v5.label.product}</p>
        <h1 id="page-title" tabIndex={-1}>
          {d.title}
        </h1>
        <p className="v5-lead">{c.lead}</p>
      </header>

      <fieldset className="v5-dir-filter">
        <legend className="v5-micro">{c.filterLabel}</legend>
        <div className="v5-dir-options">
          {dir.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="v5-dir-option"
              aria-pressed={dir.tipo === o.id}
              onClick={() => dir.setTipo(o.id)}
            >
              {o.label} <span className="v5-dir-count">{o.count}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <p className="v5-micro v5-dir-total" role="status" aria-live="polite">
        {dir.countLine}
      </p>

      <ol className="v5-dir-list">
        {dir.shown.map((i, k) => {
          const s = summary(i);
          return (
            <li key={i.id} className="v5-dir-row">
              <span className="v5-dir-idx" aria-hidden="true">
                {pad2(k + 1)}
              </span>
              <div className="v5-dir-who">
                <h2 className="v5-dir-name">{i.nome}</h2>
                <p className="v5-muted v5-small">
                  {s.tipo}
                  {s.sede ? ` · ${s.sede}` : ''}
                </p>
                <p className="v5-small v5-dir-meta">
                  {s.settori} · {s.fasi} · {s.aree}
                </p>
              </div>
              <p className="v5-dir-ticket">
                <span className="v5-micro">{d.card.ticket}</span>
                <span className="v5-dir-fig">{s.ticket}</span>
              </p>
              <Link className="v5-text-btn v5-dir-open" to={dir.profileHref(i.id)}>
                {d.card.open}
                <span className="sr-only">{d.card.openSr(i.nome)}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="v5-ctas v5-dir-actions">
        {dir.more > 0 && (
          <button type="button" className="v5-btn v5-btn-ghost" onClick={dir.showMore}>
            {c.showMore(dir.more)}
          </button>
        )}
        <Link className="v5-btn v5-btn-primary" to={dir.directoryHref}>
          {c.openReal}
        </Link>
      </div>
      <p className="v5-muted v5-small v5-mock-note">{c.note}</p>
    </div>
  );
}
