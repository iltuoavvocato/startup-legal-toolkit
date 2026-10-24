// V5 "Dark premium" mock of the teaser one-pager: a light printed sheet laid on the black desk, mono labels.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useExportMock } from '../shared/useRound3';

/** V5 export preview: the anonymous teaser as a paper sheet (sections as numbered blocks, rows as a mono ledger). */
export function Export() {
  const { t } = useI18n();
  const c = t.variants.exportMock;
  const { doc, realHref } = useExportMock();

  return (
    <div className="v5-page v5-exp">
      <header className="v5-agent-head">
        <p className="v5-micro">{t.variants.v5.label.product}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.export}
        </h1>
        <p className="v5-lead v5-exp-lead">{c.lead}</p>
      </header>

      <article className="v5-exp-sheet" aria-labelledby="v5-exp-title">
        <header className="v5-exp-head">
          <p className="v5-exp-brand">{doc.brand}</p>
          <h2 id="v5-exp-title" className="v5-exp-title">
            {doc.title}
          </h2>
          <p className="v5-exp-sub">{doc.subtitle}</p>
          {doc.tags.length > 0 && (
            <ul className="v5-exp-tags">
              {doc.tags.map((tag) => (
                <li key={tag} className="v5-exp-tag">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        {doc.sections.map((s) => (
          <section key={s.id} className="v5-exp-section" aria-labelledby={`v5-exp-${s.id}`}>
            <h3 id={`v5-exp-${s.id}`} className="v5-exp-h3">
              {s.title}
            </h3>
            {s.rows && s.rows.length > 0 && (
              <dl className="v5-exp-rows">
                {s.rows.map((row) => (
                  <div key={row.label} className="v5-exp-row">
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {s.items && s.items.length > 0 && (
              <ul className="v5-exp-items">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {s.paragraphs?.map((p) => (
              <p key={p} className="v5-exp-p">
                {p}
              </p>
            ))}
            {s.note && <p className="v5-exp-note">{s.note}</p>}
          </section>
        ))}

        <footer className="v5-exp-foot">
          <p className="v5-exp-limits">{doc.limits}</p>
          <p className="v5-exp-footer">{doc.footer}</p>
        </footer>
      </article>

      <p className="v5-muted v5-small v5-mock-note">{c.note}</p>
      <div className="v5-ctas v5-exp-actions">
        <Link className="v5-btn v5-btn-primary" to={realHref}>
          {c.openReal}
        </Link>
      </div>
    </div>
  );
}
