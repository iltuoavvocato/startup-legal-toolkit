import type { Teaser } from '../../lib/optin';

interface Props {
  teaser: Teaser;
  label?: string;
}

/** Anonymous startup teaser: what an investor sees before both sides agree. */
export function TeaserCard({ teaser, label = 'Teaser anonimo' }: Props) {
  return (
    <article className="mi-teaser" aria-label={label}>
      <div className="mi-teaser-name">
        <span className="mi-redacted" aria-hidden="true" />
        <span className="mi-teaser-lock">
          <LockIcon />
          Nome riservato fino all’intro
        </span>
      </div>
      <p className="mi-teaser-line">{teaser.oneLiner || 'La frase di presentazione comparirà qui.'}</p>
      <dl className="mi-facts">
        <div>
          <dt>Settore</dt>
          <dd>{teaser.settore}</dd>
        </div>
        <div>
          <dt>Fase</dt>
          <dd>{teaser.fase}</dd>
        </div>
        <div>
          <dt>Regione</dt>
          <dd>{teaser.regione}</dd>
        </div>
        <div>
          <dt>Round</dt>
          <dd>{teaser.importo}</dd>
        </div>
      </dl>
    </article>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
