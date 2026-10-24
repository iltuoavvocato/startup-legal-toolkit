// V3 building blocks: avatar, bubbles, score pill, score parts, investor card and anonymous teaser card.
import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/context';
import { scoreBand, WEIGHTS, type Evaluation } from '../../lib/matching';
import { labelsFor, type Investor, type StartupProfile } from '../../lib/matchTaxonomy';
import { teaserOf } from '../../lib/optin';

export function Avatar({ small = false }: { small?: boolean }) {
  return (
    <span className={`v3-avatar${small ? ' v3-avatar-sm' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 40 40" focusable="false">
        <circle cx="20" cy="20" r="20" fill="#14532d" />
        <path d="M10 27V13l6 8 6-8v14" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M29 11.5l1.4 2.9 3.1.4-2.3 2.1.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.1 3.1-.4z" fill="#fcd34d" />
      </svg>
    </span>
  );
}

interface BubbleProps {
  children: ReactNode;
  /** Hide the avatar for consecutive agent messages. */
  continued?: boolean;
  isNew?: boolean;
  wide?: boolean;
  id?: string;
}

export function AgentBubble({ children, continued = false, isNew = false, wide = false, id }: BubbleProps) {
  const { t } = useI18n();
  return (
    <li className={`v3-msg v3-msg-agent${continued ? ' is-continued' : ''}${isNew ? ' is-new' : ''}`} id={id}>
      {continued ? <span className="v3-avatar-gap" aria-hidden="true" /> : <Avatar />}
      <div className={`v3-bubble${wide ? ' v3-bubble-wide' : ''}`}>
        <span className="sr-only">{t.variants.v3.agentSays} </span>
        {children}
      </div>
    </li>
  );
}

export function UserBubble({ children, isNew = false, id }: Omit<BubbleProps, 'continued' | 'wide'>) {
  const { t } = useI18n();
  return (
    <li className={`v3-msg v3-msg-user${isNew ? ' is-new' : ''}`} id={id}>
      <div className="v3-bubble">
        <span className="sr-only">{t.variants.v3.youSay} </span>
        {children}
      </div>
    </li>
  );
}

export function ScorePill({ score }: { score: number }) {
  const { locale, t } = useI18n();
  const band = scoreBand(score, locale);
  return (
    <p className={`v3-score v3-band-${band.band}`}>
      <span aria-hidden="true">
        <strong>{t.variants.v3.score(score)}</strong> · {band.label}
      </span>
      <span className="sr-only">{t.variants.v3.scoreSr(score, band.label)}</span>
    </p>
  );
}

export function PartsList({ evaluation }: { evaluation: Evaluation }) {
  const { t, f } = useI18n();
  const rows = t.match.ui.explainer.rows;
  const keys = ['settore', 'ticket', 'fase', 'area'] as const;
  return (
    <div className="v3-parts">
      <p className="v3-parts-title">{t.variants.v3.partsLabel}</p>
      <ul>
        {keys.map((k) => {
          const got = evaluation.parts[k];
          return (
            <li key={k}>
              <span className="v3-parts-name">{rows[k]}</span>
              <span className="v3-parts-bar" aria-hidden="true">
                <span style={{ width: `${(got / WEIGHTS[k]) * 100}%` }} />
              </span>
              <span className="v3-parts-num">{t.variants.v3.part(f.number(got, 0), WEIGHTS[k])}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReasonsList({ reasons }: { reasons: readonly string[] }) {
  const { t } = useI18n();
  return (
    <ul className="v3-reasons" aria-label={t.match.ui.reasonsLabel}>
      {reasons.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  );
}

export function InvestorCard({ investor, evaluation, badge }: { investor: Investor; evaluation: Evaluation; badge?: string }) {
  const { locale, t, f } = useI18n();
  const L = labelsFor(locale);
  return (
    <article className="v3-card" aria-label={investor.nome}>
      <div className="v3-card-head">
        <div className="v3-card-id">
          <p className="v3-card-name">{investor.nome}</p>
          <p className="v3-card-meta">
            {L.tipo[investor.tipo]} · {t.variants.v3.ticket(f.euro(investor.ticketMin), f.euro(investor.ticketMax))}
          </p>
        </div>
        <ScorePill score={evaluation.score} />
      </div>
      <p className="v3-card-thesis">{investor.tesi}</p>
      {badge && <p className="v3-badge">{badge}</p>}
    </article>
  );
}

export function TeaserCard({
  startup,
  evaluation,
  revealed,
  status,
}: {
  startup: StartupProfile;
  evaluation: Evaluation;
  revealed: boolean;
  status?: string;
}) {
  const { locale, t } = useI18n();
  const tz = teaserOf(startup, locale);
  const T = t.match.ui.teaser;
  const facts: [string, string][] = [
    [T.settore, tz.settore],
    [T.fase, tz.fase],
    [T.regione, tz.regione],
    [T.round, tz.importo],
  ];
  return (
    <article className={`v3-card v3-teaser${revealed ? ' is-revealed' : ''}`} aria-label={revealed ? startup.nome : T.label}>
      <div className="v3-card-head">
        <div className="v3-card-id">
          {revealed ? (
            <p className="v3-card-name">{t.variants.introReveal(startup.nome, startup.founder)}</p>
          ) : (
            <p className="v3-card-name v3-lock">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
                <path d="M5.2 7V5.2a2.8 2.8 0 015.6 0V7" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              {T.label}
            </p>
          )}
          {!revealed && <p className="v3-card-meta">{T.lock}</p>}
        </div>
        <ScorePill score={evaluation.score} />
      </div>
      <dl className="v3-facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="v3-card-thesis">{tz.oneLiner}</p>
      {status && <p className="v3-badge">{status}</p>}
    </article>
  );
}
