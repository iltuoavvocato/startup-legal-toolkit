import { Link } from 'react-router-dom';
import { ChecklistIcon, PieIcon, TimelineIcon } from '../components/Icons';
import { HeroVisual } from '../components/HeroVisual';
import { LawyerCta } from '../components/LawyerCta';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';

const TOOL_ICONS = { equity: PieIcon, vesting: TimelineIcon, quiz: ChecklistIcon } as const;
const TOOL_IDS = ['equity', 'vesting', 'quiz'] as const;

export function HomePage() {
  const { t, path } = useI18n();
  const h = t.home;
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">{h.eyebrow}</p>
          <h1 tabIndex={-1} id="page-title">
            <Rich text={h.title} />
          </h1>
          <p className="hero-lead">{h.lead}</p>
          <div className="hero-actions">
            <Link to={path('quiz')} className="btn btn-gold btn-lg">
              {h.ctaQuiz}
              <span aria-hidden="true" className="btn-arrow">
                →
              </span>
            </Link>
            <Link to={path('equity')} className="btn btn-ghost btn-lg">
              {h.ctaEquity}
            </Link>
          </div>
          <p className="hero-note">{h.note}</p>
          <HeroVisual />
        </div>
      </section>

      <section className="section section-cream" aria-labelledby="tools-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow-dark">{h.toolsEyebrow}</p>
            <h2 id="tools-title">{h.toolsTitle}</h2>
          </div>
          <ul className="tool-grid">
            {TOOL_IDS.map((id) => {
              const Icon = TOOL_ICONS[id];
              return (
                <li key={id}>
                  <Link to={path(id)} className="tool-card">
                    <span className="tool-icon">
                      <Icon />
                    </span>
                    <h3>{h.tools[id].title}</h3>
                    <p>{h.tools[id].text}</p>
                    <span className="tool-link">
                      {h.openTool} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section section-cream mi-section-tight" aria-labelledby="match-band-title">
        <div className="container">
          <div className="mi-home-band">
            <div>
              <span className="mi-banner-tag">{h.matchBand.tag}</span>
              <h2 id="match-band-title">{h.matchBand.title}</h2>
              <p>{h.matchBand.text}</p>
            </div>
            <Link to={path('match')} className="btn btn-gold">
              {h.matchBand.cta} <span aria-hidden="true" className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-white" aria-labelledby="why-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow-dark">{h.whyEyebrow}</p>
            <h2 id="why-title">
              <Rich text={h.whyTitle} />
            </h2>
          </div>
          <ol className="reasons">
            {h.reasons.map((r, i) => (
              <li key={r.title}>
                <span className="reason-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-navy" aria-labelledby="docs-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">{h.docsEyebrow}</p>
            <h2 id="docs-title">{h.docsTitle}</h2>
            <p className="section-lead">{h.docsLead}</p>
          </div>
          <ul className="doc-grid">
            {h.docs.map((d) => (
              <li key={d.title} className="doc-card">
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </li>
            ))}
          </ul>
          <div className="center">
            <Link to={path('quiz')} className="btn btn-outline-light">
              {h.docsCta} <span aria-hidden="true" className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <div className="container cta-band-inner">
          <div>
            <h2 id="cta-title">
              <Rich text={h.ctaTitle} />
            </h2>
            <p>{h.ctaText}</p>
          </div>
          <LawyerCta campaign="home" className="btn-lg" />
        </div>
      </section>
    </>
  );
}
