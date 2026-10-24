import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useDirectoryMock, useInvestorSummary } from '../shared/useMockScreens';
import { Masthead } from './parts';

/** The investor directory as a magazine index: a type filter set as a contents line, entries in two columns. */
export function Directory() {
  const { t } = useI18n();
  const d = t.directory.dir;
  const c = t.variants.directoryMock;
  const dir = useDirectoryMock();
  const summary = useInvestorSummary();
  const id = useId();
  const listRef = useRef<HTMLOListElement>(null);

  const onShowMore = () => {
    const next = dir.shown.length;
    dir.showMore();
    // Focus the first newly shown entry once it renders.
    requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>('.v1-dir-entry')[next]?.focus());
  };

  return (
    <article className="v1-page v1-directory">
      <header className="v1-cover v1-cover-sm">
        <Masthead />
        <p className="v1-kicker">{d.eyebrow}</p>
        <h1 id="page-title" tabIndex={-1} className="v1-display v1-display-sm">
          {d.title}
        </h1>
        <p className="v1-standfirst">{c.lead}</p>
      </header>

      <fieldset className="v1-column v1-dir-filter">
        <legend className="v1-smallcaps">{c.filterLabel}</legend>
        <div className="v1-dir-options">
          {dir.options.map((o) => (
            <label key={o.id} className={`v1-dir-option${dir.tipo === o.id ? ' is-on' : ''}`}>
              <input type="radio" name={`${id}-tipo`} value={o.id} checked={dir.tipo === o.id} onChange={() => dir.setTipo(o.id)} />
              <span>{o.label}</span> <span className="v1-dir-count">{o.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="v1-column v1-smallcaps v1-dir-countline" role="status" aria-live="polite">
        {dir.countLine}
      </p>

      <ol className="v1-dir-list" ref={listRef}>
        {dir.shown.map((i) => {
          const s = summary(i);
          return (
            <li key={i.id} className="v1-dir-entry" tabIndex={-1}>
              <p className="v1-meta">
                {s.tipo}
                {s.sede ? ` · ${s.sede}` : ''}
              </p>
              <h2 className="v1-headline v1-headline-sm">{i.nome}</h2>
              <p className="v1-dir-tesi">{i.tesi}</p>
              <dl className="v1-dir-facts">
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
                  <dd className="v1-dir-num">{s.ticket}</dd>
                </div>
                <div>
                  <dt>{d.card.aree}</dt>
                  <dd>{s.aree}</dd>
                </div>
              </dl>
              <Link className="v1-textlink" to={dir.profileHref(i.id)}>
                {d.card.open}
                <span className="v1-sr">{d.card.openSr(i.nome)}</span> <span aria-hidden="true">→</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="v1-column v1-mock-foot">
        {dir.more > 0 ? (
          <button type="button" className="v1-textbtn v1-textbtn-strong" onClick={onShowMore}>
            {c.showMore(dir.more)}
          </button>
        ) : null}
        <p className="v1-note">{c.note}</p>
        <p>
          <Link className="v1-textlink" to={dir.directoryHref}>
            {c.openReal} <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </article>
  );
}
