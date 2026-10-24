// V4 investor directory (mock): a scrolling chip row filters by type, the demo investors as a grid of cards. Links go
// to the real directory and profiles.
import { Link } from 'react-router-dom';
import { LiveRegion } from '../../components/match/LiveRegion';
import { useI18n } from '../../i18n/context';
import { useDirectoryMock, useInvestorSummary } from '../shared/useMockScreens';

export function Directory() {
  const { t } = useI18n();
  const d = t.directory.dir;
  const c = t.variants.directoryMock;
  const dir = useDirectoryMock();
  const summary = useInvestorSummary();

  return (
    <div className="v4-page v4-dir">
      <header className="v4-head">
        <p className="v4-eyebrow">{d.eyebrow}</p>
        <h1 id="page-title" tabIndex={-1}>
          {d.title}
        </h1>
        <p className="v4-lead">{c.lead}</p>
      </header>

      <fieldset className="v4-filter">
        <legend className="v4-filter-legend">{c.filterLabel}</legend>
        <div className="v4-filter-row">
          {dir.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="v4-filter-chip"
              aria-pressed={dir.tipo === o.id}
              onClick={() => dir.setTipo(o.id)}
            >
              {o.label} <span className="v4-filter-count">{o.count}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <section aria-labelledby="v4-dir-count">
        <h2 id="v4-dir-count" className="v4-dir-count">
          {dir.countLine}
        </h2>
        <LiveRegion message={dir.countLine} />
        <ul className="v4-dir-grid">
          {dir.shown.map((i) => {
            const s = summary(i);
            return (
              <li key={i.id} className="v4-dir-card">
                <p className="v4-dir-tipo">{s.tipo}</p>
                <h3>{i.nome}</h3>
                <dl className="v4-dir-facts">
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
                <Link className="v4-dir-open" to={dir.profileHref(i.id)}>
                  {d.card.open}
                  <span className="sr-only">{d.card.openSr(i.nome)}</span> <span aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {dir.more > 0 ? (
          <p className="v4-dir-more">
            <button type="button" className="v4-btn v4-btn-ghost" onClick={dir.showMore}>
              {c.showMore(dir.more)}
            </button>
          </p>
        ) : null}
      </section>

      <p className="v4-note">{c.note}</p>
      <div className="v4-ctas">
        <Link className="v4-cta v4-cta-primary" to={dir.directoryHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
