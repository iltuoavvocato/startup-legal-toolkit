// V4 teaser one-pager (mock): the anonymous export of the sample startup as one big rounded card, a navy brand band on
// top, tags as pills, each section as a soft inner tile. Built by the real export, so no startup name appears.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useExportMock } from '../shared/useRound3';

/** The mock export page of V4: the teaser sheet as a card, then the small print and the link to the real export. */
export function Export() {
  const { t } = useI18n();
  const c = t.variants.exportMock;
  const { doc, realHref } = useExportMock();

  return (
    <div className="v4-page v4-exp">
      <header className="v4-head">
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.export}
        </h1>
        <p className="v4-lead">{c.lead}</p>
      </header>

      <article className="v4-exp-sheet" aria-labelledby="v4-exp-title">
        <div className="v4-exp-band">
          <p className="v4-exp-brand">{doc.brand}</p>
          <h2 id="v4-exp-title" className="v4-exp-title">
            {doc.title}
          </h2>
          <p className="v4-exp-subtitle">{doc.subtitle}</p>
        </div>
        {doc.tags.length > 0 ? (
          <ul className="v4-exp-tags">
            {doc.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
        <div className="v4-exp-sections">
          {doc.sections.map((s) => (
            <section key={s.id} className="v4-exp-section" aria-labelledby={`v4-exp-${s.id}`}>
              <h3 id={`v4-exp-${s.id}`}>{s.title}</h3>
              {s.rows && s.rows.length > 0 ? (
                <dl className="v4-exp-rows">
                  {s.rows.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {s.items && s.items.length > 0 ? (
                <ul className="v4-exp-items">
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {s.paragraphs?.map((p) => (
                <p key={p} className="v4-exp-p">
                  {p}
                </p>
              ))}
              {s.note ? <p className="v4-exp-note">{s.note}</p> : null}
            </section>
          ))}
        </div>
        <p className="v4-exp-limits">{doc.limits}</p>
        <p className="v4-exp-footer">{doc.footer}</p>
      </article>

      <p className="v4-note">{c.note}</p>
      <div className="v4-ctas">
        <Link className="v4-cta v4-cta-primary" to={realHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
