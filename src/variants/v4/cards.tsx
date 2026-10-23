// V4: card contents (investor card for founders, anonymous teaser card for investors) and the score ring.
import { useEffect, useRef, type ReactNode } from 'react';
import { LockIcon } from '../../components/match/TeaserCard';
import { useI18n } from '../../i18n/context';
import { scoreBand, WEIGHTS, type Evaluation, type Parts } from '../../lib/matching';
import { labelsFor, type Investor, type StartupProfile } from '../../lib/matchTaxonomy';
import { teaserOf } from '../../lib/optin';

export function ScoreRing({ score, small = false }: { score: number; small?: boolean }) {
  const { locale, t } = useI18n();
  const band = scoreBand(score, locale);
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <div className={`v4-ring band-${band.band}${small ? ' v4-ring-sm' : ''}`}>
      <div className="v4-ring-dial">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle className="v4-ring-track" cx="32" cy="32" r={r} />
          <circle
            className="v4-ring-fill"
            cx="32"
            cy="32"
            r={r}
            strokeDasharray={`${(circ * score) / 100} ${circ}`}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <p className="v4-ring-num">
          {score}
          <span className="sr-only">{t.match.ui.score.sr(band.label)}</span>
        </p>
      </div>
      <span className="v4-ring-band" aria-hidden="true">
        {band.label}
      </span>
    </div>
  );
}

function PartsDetails({ parts }: { parts: Parts }) {
  const { t } = useI18n();
  const c = t.variants.v4.card;
  const rows = t.match.ui.explainer.rows;
  const keys = Object.keys(WEIGHTS) as (keyof Parts)[];
  return (
    <details className="v4-parts">
      <summary>{c.parts}</summary>
      <ul>
        {keys.map((k) => {
          const pts = Math.round(parts[k]);
          return (
            <li key={k}>
              <span className="v4-part-name">{rows[k]}</span>
              <span className="v4-part-bar" aria-hidden="true">
                <span style={{ width: `${(parts[k] / WEIGHTS[k]) * 100}%` }} />
              </span>
              <span className="v4-part-val">{c.partValue(pts, WEIGHTS[k])}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

interface InvestorCardProps {
  investor: Investor;
  evaluation: Evaluation;
  /** Number of reasons to show (top ones first). */
  reasons?: number;
  compact?: boolean;
  status?: ReactNode;
  headingLevel?: 2 | 3;
}

/** Founder side: one investor per card. */
export function InvestorCard({ investor: i, evaluation, reasons = 3, compact = false, status, headingLevel = 2 }: InvestorCardProps) {
  const { locale, t, f } = useI18n();
  const c = t.variants.v4.card;
  const L = labelsFor(locale);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className={`v4-card${compact ? ' v4-card-compact' : ''}`}>
      <header className="v4-card-head">
        <div className="v4-card-id">
          <span className="v4-avatar" aria-hidden="true">
            {i.nome
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')}
          </span>
          <div>
            <H className="v4-card-title">{i.nome}</H>
            <p className="v4-card-meta">
              {L.tipo[i.tipo]}
              {i.sede ? ` · ${c.based(L.regione[i.sede])}` : ''}
            </p>
          </div>
        </div>
        <ScoreRing score={evaluation.score} small={compact} />
      </header>
      {!compact && <p className="v4-thesis">{i.tesi}</p>}
      <dl className="v4-facts">
        <div>
          <dt>{c.ticket}</dt>
          <dd>{c.ticketRange(f.euro(i.ticketMin), f.euro(i.ticketMax))}</dd>
        </div>
        <div>
          <dt>{c.fasi}</dt>
          <dd>{i.fasi.map((x) => L.fase[x]).join(', ')}</dd>
        </div>
      </dl>
      <div className="v4-reasons">
        <p className="v4-reasons-label">{t.match.ui.reasonsLabel}</p>
        <ul>
          {evaluation.reasons.slice(0, reasons).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      {!compact && <PartsDetails parts={evaluation.parts} />}
      {status}
    </article>
  );
}

interface TeaserProps {
  startup: StartupProfile;
  evaluation: Evaluation;
  status?: ReactNode;
}

/** Investor side: an anonymous teaser. Never shows the startup's name, founder or contact. */
export function TeaserDeckCard({ startup, evaluation, status }: TeaserProps) {
  const { locale, t } = useI18n();
  const x = t.match.ui.teaser;
  const teaser = teaserOf(startup, locale);
  return (
    <article className="v4-card v4-card-teaser">
      <header className="v4-card-head">
        <div className="v4-card-id">
          <span className="v4-avatar v4-avatar-anon" aria-hidden="true">
            <LockIcon />
          </span>
          <div>
            <p className="v4-redact">
              <span className="v4-redact-bar" aria-hidden="true" />
              <span className="v4-redact-text">{x.lock}</span>
            </p>
            <h2 className="v4-card-title">{t.match.ui.investor.startupTitle(teaser.settore, teaser.regione)}</h2>
          </div>
        </div>
        <ScoreRing score={evaluation.score} />
      </header>
      <p className="v4-oneliner">{teaser.oneLiner || x.placeholder}</p>
      <dl className="v4-facts v4-facts-4">
        <div>
          <dt>{x.settore}</dt>
          <dd>{teaser.settore}</dd>
        </div>
        <div>
          <dt>{x.fase}</dt>
          <dd>{teaser.fase}</dd>
        </div>
        <div>
          <dt>{x.regione}</dt>
          <dd>{teaser.regione}</dd>
        </div>
        <div>
          <dt>{x.round}</dt>
          <dd>{teaser.importo}</dd>
        </div>
      </dl>
      <div className="v4-reasons">
        <p className="v4-reasons-label">{t.variants.v4.investor.reasons}</p>
        <ul>
          {evaluation.reasons.slice(0, 3).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      <PartsDetails parts={evaluation.parts} />
      {status}
    </article>
  );
}

/** Heading that takes focus when it mounts if focus was lost (the deck's buttons disappear when it finishes). */
export function FocusHeading({ children, className, level = 2 }: { children: ReactNode; className?: string; level?: 2 | 3 }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body) ref.current?.focus();
  }, []);
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <H ref={ref} tabIndex={-1} className={className}>
      {children}
    </H>
  );
}
