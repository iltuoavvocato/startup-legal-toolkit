import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { ConsentExplainer } from '../components/match/ConsentExplainer';
import { LegalLimits } from '../components/match/LegalLimits';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import { MONTHLY_PROPOSAL_LIMIT } from '../lib/optin';

export function MatchLandingPage() {
  const { t, path } = useI18n();
  const l = t.match.ui.landing;
  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={l.eyebrow} title={<Rich text={l.title} />}>
        <p>{l.lead}</p>
        <div className="mi-hero-actions">
          <Link to={path('matchStartup')} className="btn btn-gold btn-lg">
            {l.ctaStartup}
            <span aria-hidden="true" className="btn-arrow">
              →
            </span>
          </Link>
          <Link to={path('matchInvestor')} className="btn btn-ghost btn-lg">
            {l.ctaInvestor}
          </Link>
        </div>
      </PageHero>

      <section className="section section-cream" aria-labelledby="how-title">
        <div className="container">
          <div className="section-head">
            <h2 id="how-title">{l.howTitle}</h2>
            <p className="section-lead">{l.howLead}</p>
          </div>
          <ol className="mi-how">
            {l.steps.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <ConsentExplainer />
        </div>
      </section>

      <section className="section section-white" aria-labelledby="doors-title">
        <div className="container">
          <div className="section-head">
            <h2 id="doors-title">{l.doorsTitle}</h2>
            <p className="section-lead">{l.doorsLead}</p>
          </div>
          <div className="mi-doors">
            <article className="card mi-door">
              <h3>{l.startupDoor.title}</h3>
              <p>{l.startupDoor.lead}</p>
              <ul>
                {l.startupDoor.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>{l.startupDoor.limit(MONTHLY_PROPOSAL_LIMIT)}</li>
              </ul>
              <div className="mi-door-actions">
                <Link to={path('matchStartup')} className="btn btn-navy">
                  {l.startupDoor.cta} <span aria-hidden="true">→</span>
                </Link>
                <Link to={path('matchAgentStartup')} className="btn btn-outline">
                  {t.intake.ui.talk}
                </Link>
              </div>
            </article>
            <article className="card mi-door door-investor">
              <h3>{l.investorDoor.title}</h3>
              <p>{l.investorDoor.lead}</p>
              <ul>
                {l.investorDoor.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mi-door-actions">
                <Link to={path('matchInvestor')} className="btn btn-outline">
                  {l.investorDoor.cta} <span aria-hidden="true">→</span>
                </Link>
                <Link to={path('matchAgentInvestor')} className="btn btn-text">
                  {t.intake.ui.talk}
                </Link>
              </div>
            </article>
          </div>
          <p className="center mi-board-note mi-landing-links">
            <Link to={path('matchDirectory')}>{t.directory.dir.landingDirectory}</Link>
            <Link to={path('matchRequests')}>{t.directory.dir.requestsLink}</Link>
            <Link to={path('matchOptIn')}>{l.simulatorLink}</Link>
            <Link to={path('matchGuidedDemo')}>{t.guidedDemo.landingLink}</Link>
          </p>
        </div>
      </section>

      <section className="section section-cream" aria-labelledby="limits-title">
        <div className="container">
          <LegalLimits headingId="limits-title" />
          <Disclaimer />
          <CtaPanel campaign="match" title={l.ctaTitle} text={l.ctaText} />
        </div>
      </section>
    </>
  );
}
