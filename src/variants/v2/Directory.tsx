// V2 Dashboard: investor directory as a dense table with a type filter in the sidebar (mock, links to the real one).
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useDirectoryMock, useInvestorSummary } from '../shared/useMockScreens';
import { Eyebrow } from './parts';

export function Directory() {
  const { t } = useI18n();
  const d = t.directory.dir;
  const c = t.variants.directoryMock;
  const cols = t.variants.v2.results.cols;
  const dir = useDirectoryMock();
  const summary = useInvestorSummary();

  return (
    <div className="v2-page v2-directory">
      <header className="v2-head">
        <div>
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <h1 id="page-title" tabIndex={-1} className="v2-h1">
            {d.title}
          </h1>
          <p className="v2-muted">{c.lead}</p>
        </div>
        <Link className="v2-btn" to={dir.directoryHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </header>

      <div className="v2-layout">
        <aside className="v2-side" aria-label={d.filtersTitle}>
          <fieldset className="v2-panel v2-dir-filter">
            <legend className="v2-panel-h">{c.filterLabel}</legend>
            {dir.options.map((o) => (
              <label key={o.id} className={`v2-dir-opt${dir.tipo === o.id ? ' is-on' : ''}`}>
                <input type="radio" name="v2-dir-tipo" value={o.id} checked={dir.tipo === o.id} onChange={() => dir.setTipo(o.id)} />
                <span className="v2-dir-opt-label">{o.label}</span>
                <span className="v2-num v2-muted">{o.count}</span>
              </label>
            ))}
          </fieldset>
          <p className="v2-panel v2-muted v2-small">{c.note}</p>
        </aside>

        <section className="v2-main" aria-label={d.title}>
          <p className="v2-small v2-num v2-dir-count" role="status" aria-live="polite">
            {dir.countLine}
          </p>
          <div className="v2-scroll" tabIndex={0} role="region" aria-label={dir.countLine}>
            <table className="v2-table v2-table-dir">
              <thead>
                <tr>
                  <th scope="col">{cols.nome}</th>
                  <th scope="col">{d.tipo}</th>
                  <th scope="col">{d.card.settori}</th>
                  <th scope="col">{d.card.fasi}</th>
                  <th scope="col" className="v2-c-num">
                    {d.card.ticket}
                  </th>
                  <th scope="col">{d.card.aree}</th>
                  <th scope="col">{cols.action}</th>
                </tr>
              </thead>
              <tbody>
                {dir.shown.map((i) => {
                  const s = summary(i);
                  return (
                    <tr key={i.id}>
                      <th scope="row" className="v2-name">
                        {i.nome}
                      </th>
                      <td data-label={d.tipo}>{s.tipo}</td>
                      <td className="v2-dir-wrap" data-label={d.card.settori}>
                        {s.settori}
                      </td>
                      <td data-label={d.card.fasi}>{s.fasi}</td>
                      <td className="v2-c-num v2-num" data-label={d.card.ticket}>
                        {s.ticket}
                      </td>
                      <td className="v2-dir-wrap" data-label={d.card.aree}>
                        {s.aree}
                      </td>
                      <td className="v2-dir-act">
                        <Link className="v2-link" to={dir.profileHref(i.id)}>
                          {d.card.open}
                          <span className="sr-only">{d.card.openSr(i.nome)}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {dir.more > 0 && (
            <p>
              <button type="button" className="v2-btn v2-btn-sm" onClick={dir.showMore}>
                {c.showMore(dir.more)}
              </button>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
