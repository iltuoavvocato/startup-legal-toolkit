// V2 Dashboard: teaser one-pager as a spec sheet — mono header strip, sections in a two-column grid of key/value panels.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useExportMock } from '../shared/useRound3';
import { Eyebrow } from './parts';

/** Preview of the anonymous teaser built by the real export: no startup name, only whitelisted fields. */
export function Export() {
  const { t } = useI18n();
  const c = t.variants.exportMock;
  const { doc, realHref } = useExportMock();

  return (
    <div className="v2-page v2-export">
      <header className="v2-head">
        <div>
          <Eyebrow>{t.variants.v2.landing.eyebrow}</Eyebrow>
          <h1 id="page-title" tabIndex={-1} className="v2-h1">
            {t.variants.screens.export}
          </h1>
          <p className="v2-muted">{c.lead}</p>
        </div>
      </header>

      <article className="v2-exp-sheet" aria-labelledby="v2-exp-title">
        <div className="v2-exp-strip">
          <span className="v2-exp-brand">{doc.brand}</span>
          <span className="v2-num">{doc.date}</span>
        </div>
        <div className="v2-exp-top">
          <h2 id="v2-exp-title" className="v2-h2 v2-exp-title">
            {doc.title}
          </h2>
          <p className="v2-exp-sub">{doc.subtitle}</p>
          {doc.tags.length > 0 && (
            <ul className="v2-tags v2-exp-tags">
              {doc.tags.map((tag) => (
                <li key={tag} className="v2-tag">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="v2-exp-grid">
          {doc.sections.map((s) => (
            <section key={s.id} className={`v2-exp-sec v2-exp-sec-${s.id}`} aria-labelledby={`v2-exp-${s.id}`}>
              <h3 id={`v2-exp-${s.id}`} className="v2-exp-h">
                {s.title}
              </h3>
              {s.rows && s.rows.length > 0 && (
                <dl className="v2-exp-rows">
                  {s.rows.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd className="v2-num">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {s.items && s.items.length > 0 && (
                <ul className="v2-exp-items">
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {s.paragraphs?.map((para) => (
                <p key={para} className="v2-exp-p">
                  {para}
                </p>
              ))}
              {s.note && <p className="v2-exp-note">{s.note}</p>}
            </section>
          ))}
        </div>
        <footer className="v2-exp-foot">
          <p>{doc.limits}</p>
          <p className="v2-exp-disclaimer">{doc.disclaimer}</p>
          <p className="v2-num">{doc.footer}</p>
        </footer>
      </article>

      <div className="v2-exp-after">
        <p className="v2-muted v2-small">{c.note}</p>
        <Link className="v2-btn v2-btn-primary v2-exp-real" to={realHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
