// V3 teaser one-pager (mock): the agent hands over the anonymous profile as a paper sheet attached to its message.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { useExportMock } from '../shared/useRound3';
import { AgentBubble, Avatar } from './parts';

/** The teaser as an attachment in the chat: an agent message carrying the paper sheet built by the real export. */
export function Export() {
  const { t } = useI18n();
  const c = t.variants.exportMock;
  const v3 = t.variants.v3;
  const { doc, realHref } = useExportMock();

  return (
    <div className="v3-page">
      <header className="v3-pagehead">
        <p className="v3-eyebrow">{t.variants.variants.v3.name}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.export}
        </h1>
        <p className="v3-lead">{c.lead}</p>
      </header>
      <section className="v3-chat" aria-label={t.variants.screens.export}>
        <header className="v3-chat-head">
          <Avatar small />
          <div className="v3-chat-who">
            <p className="v3-chat-name">{v3.agentName}</p>
            <p className="v3-chat-role">{v3.agentRole}</p>
          </div>
        </header>
        <ol className="v3-log">
          <AgentBubble wide>
            <article className="v3-exp-paper" aria-labelledby="v3-exp-title">
              <p className="v3-exp-brand">{doc.brand}</p>
              <h2 id="v3-exp-title" className="v3-exp-title">
                {doc.title}
              </h2>
              <p className="v3-exp-subtitle">{doc.subtitle}</p>
              {doc.tags.length > 0 && (
                <ul className="v3-exp-tags">
                  {doc.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
              {doc.sections.map((s) => (
                <section key={s.id} className="v3-exp-section" aria-labelledby={`v3-exp-${s.id}`}>
                  <h3 id={`v3-exp-${s.id}`}>{s.title}</h3>
                  {s.rows && s.rows.length > 0 && (
                    <dl className="v3-exp-rows">
                      {s.rows.map((row) => (
                        <div key={row.label}>
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {s.items && s.items.length > 0 && (
                    <ul className="v3-exp-items">
                      {s.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  )}
                  {s.paragraphs?.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {s.note && <p className="v3-exp-note">{s.note}</p>}
                </section>
              ))}
              <p className="v3-exp-limits">{doc.limits}</p>
              <p className="v3-exp-footer">{doc.footer}</p>
            </article>
          </AgentBubble>
        </ol>
      </section>
      <p className="v3-small v3-exp-foot">{c.note}</p>
      <div className="v3-ctas">
        <Link className="v3-cta is-primary v3-mock-link" to={realHref}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
