import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';

export function MatchLegalPage() {
  const { t } = useI18n();
  const l = t.match.ui.legal;
  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={l.eyebrow} title={l.title}>
        <p>{l.lead}</p>
      </PageHero>
      <section className="section section-cream">
        <div className="container">
          <div className="prose mi-legal">
            <h2>{l.doesTitle}</h2>
            <p>
              <Rich text={l.does} />
            </p>

            <h2>{l.doesNotTitle}</h2>
            <ul>
              {l.doesNot.map((item) => (
                <li key={item}>
                  <Rich text={item} />
                </li>
              ))}
            </ul>

            <h2>{l.agentTitle}</h2>
            <p>{l.agent}</p>

            <h2>{l.dataTitle}</h2>
            <p>{l.data}</p>

            <div className="notice">
              <Rich text={l.checkIntro} />
              <ul>
                {l.checks.map((item) => (
                  <li key={item}>
                    <Rich text={item} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="mi-callout">
              <h2>{l.realTitle}</h2>
              <p>{l.real}</p>
            </div>

            <p>
              <Rich text={l.links} />
            </p>
          </div>
          <Disclaimer />
          <CtaPanel campaign="match" title={l.ctaTitle} text={l.ctaText} />
        </div>
      </section>
    </>
  );
}
