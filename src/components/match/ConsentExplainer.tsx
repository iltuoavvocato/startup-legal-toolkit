import { Link } from 'react-router-dom';
import { useId } from 'react';
import { useI18n } from '../../i18n/context';

/** Step glyphs: teaser card, envelope with a check, two linked keys. Decorative. */
function StepArt({ step }: { step: number }) {
  return (
    <svg className="mi-consent-art" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="22" className="mi-consent-ring" />
      {step === 0 && (
        <>
          <rect x="12" y="15" width="24" height="18" rx="3" className="mi-consent-shape" />
          <path d="M16 21h10M16 26h16" className="mi-consent-line" />
          <circle cx="31" cy="21" r="2" className="mi-consent-accent" />
        </>
      )}
      {step === 1 && (
        <>
          <rect x="12" y="16" width="24" height="17" rx="3" className="mi-consent-shape" />
          <path d="M12.5 17.5l11.5 9 11.5-9" className="mi-consent-line" />
          <circle cx="34" cy="15" r="5" className="mi-consent-accent" />
        </>
      )}
      {step === 2 && (
        <>
          <circle cx="18" cy="24" r="6" className="mi-consent-shape" />
          <circle cx="30" cy="24" r="6" className="mi-consent-accent mi-consent-accent-fill" />
          <path d="M21 24h6" className="mi-consent-line" />
        </>
      )}
    </svg>
  );
}

/** "Come funziona il doppio consenso": three illustrated steps, reused on landing, results and inbox. */
export function ConsentExplainer({ compact = false, showLink = true }: { compact?: boolean; showLink?: boolean }) {
  const { t, path } = useI18n();
  const x = t.polish.consent;
  const id = useId();
  return (
    <section className={`mi-consent${compact ? ' is-compact' : ''}`} aria-labelledby={`${id}-title`}>
      <div className="mi-consent-head">
        <h2 id={`${id}-title`} className="mi-consent-title">
          {x.title}
        </h2>
        <p className="mi-consent-lead">{x.lead}</p>
      </div>
      <ol className="mi-consent-steps">
        {x.steps.map((s, i) => (
          <li key={s.title}>
            <StepArt step={i} />
            <div>
              <h3>
                <span className="mi-consent-num">{i + 1}</span> {s.title}
              </h3>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {showLink && (
        <p className="mi-consent-link">
          <Link to={path('matchOptIn')}>
            {x.link} <span aria-hidden="true">→</span>
          </Link>
        </p>
      )}
    </section>
  );
}
