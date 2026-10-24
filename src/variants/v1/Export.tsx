// V1 "Editoriale": the anonymous teaser one-pager as a printed broadsheet page.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useExportMock } from '../shared/useRound3';
import { Masthead } from './parts';

/**
 * The teaser one-pager set like a printed page: double rules, a serif title, sections as numbered columns with
 * fact tables. Built by the real export, so no name and no deck text appear.
 */
export function Export() {
  const { t } = useI18n();
  const c = t.variants.exportMock;
  const { doc, realHref } = useExportMock();

  return (
    <article className="v1-page v1-export">
      <header className="v1-cover v1-cover-sm">
        <Masthead />
        <h1 id="page-title" tabIndex={-1} className="v1-display v1-display-sm">
          {t.variants.screens.export}
        </h1>
        <p className="v1-standfirst">{c.lead}</p>
      </header>

      <section className="v1-exp-sheet" aria-labelledby="v1-exp-title">
        <p className="v1-exp-brand">{doc.brand}</p>
        <h2 id="v1-exp-title" className="v1-exp-title">
          {doc.title}
        </h2>
        <p className="v1-exp-subtitle">{doc.subtitle}</p>
        {doc.tags.length > 0 ? (
          <ul className="v1-exp-tags">
            {doc.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}

        {doc.sections.map((s, k) => (
          <section key={s.id} className="v1-exp-section" aria-labelledby={`v1-exp-${s.id}`}>
            <h3 id={`v1-exp-${s.id}`} className="v1-exp-h3">
              <span className="v1-exp-num" aria-hidden="true">
                {String(k + 1).padStart(2, '0')}
              </span>
              {s.title}
            </h3>
            {s.rows?.length ? (
              <dl className="v1-exp-rows">
                {s.rows.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {s.items?.length ? (
              <ul className="v1-prose-list">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {s.paragraphs?.map((p) => (
              <p key={p} className="v1-exp-para">
                {p}
              </p>
            ))}
            {s.note ? <p className="v1-exp-note">{s.note}</p> : null}
          </section>
        ))}

        <p className="v1-exp-limits">{doc.limits}</p>
        <p className="v1-exp-footer">{doc.footer}</p>
      </section>

      <div className="v1-column v1-mock-foot">
        <p className="v1-note">{c.note}</p>
        <p>
          <Link className="v1-textlink" to={realHref}>
            {c.openReal} <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </article>
  );
}
