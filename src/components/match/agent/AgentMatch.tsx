import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { demoInvestors, demoStartups } from '../../../data/matchDemo';
import { useI18n } from '../../../i18n/context';
import { agentFounderStatus, answerFromAgent, proposeFromAgent } from '../../../lib/agentInbox';
import { proposalCounter, timeTravel } from '../../../lib/inbox';
import {
  explainInvestorMatch,
  explainStartupMatch,
  investorProfileOf,
  investorStatus,
  matchIdsOf,
  startupProfileOf,
  type Action,
  type Explanation,
  type IntakeState,
} from '../../../lib/intakeAgent';
import { TIME_TRAVEL_DAYS } from '../../../lib/matchConfig';
import { evaluate } from '../../../lib/matching';
import { labelsFor } from '../../../lib/matchTaxonomy';
import { canPropose, introEmail, MONTHLY_PROPOSAL_LIMIT, teaserOf } from '../../../lib/optin';
import { IntroEmailPreview } from '../IntroEmailPreview';
import { ScoreMeter } from '../ScoreMeter';
import { TeaserCard } from '../TeaserCard';
import { updateInbox, useInbox } from '../useInbox';

interface Props {
  state: IntakeState;
  id: string;
  rank: number;
  dispatch: (a: Action) => void;
}

/** One match, as the agent presents it: who or what, why it fits, what doesn't, next step and the opt-in actions. */
export function AgentMatch(props: Props) {
  return props.state.mode === 'startup' ? <FounderMatch {...props} /> : <InvestorMatch {...props} />;
}

/**
 * Founder side: proposals and answers go through the shared requests inbox (same monthly counter as the form results
 * and the directory); the investor's simulated answer arrives on the inbox's demo clock.
 */
function FounderMatch({ state, id, rank, dispatch }: Props) {
  const { locale, t, path } = useI18n();
  const u = t.intake.ui;
  const L = labelsFor(locale);
  const hid = useId();
  const { store, now } = useInbox();
  const [limitHit, setLimitHit] = useState(false);
  const p = startupProfileOf(state, locale);
  const inv = demoInvestors(locale).find((x) => x.id === id);
  if (!p || !inv) return null;
  const ev = evaluate(p, inv, 'startup', locale);
  const status = agentFounderStatus(store, id, state.passed, now);
  const e = explainInvestorMatch(p, inv, ev, status, locale);
  const sr = <span className="sr-only">{u.actionSr(inv.nome)}</span>;
  const can = canPropose(proposalCounter(store, now));

  const propose = () => {
    let refused = false;
    updateInbox((s, at) => {
      const r = proposeFromAgent(s, state.answers, id, matchIdsOf(state), at);
      refused = !r.ok && r.reason === 'limit';
      return r.ok ? r.store : s;
    });
    setLimitHit(refused);
  };
  const reply = (yes: boolean) => updateInbox((s, at) => answerFromAgent(s, id, yes, at));

  return (
    <Card hid={hid} title={`${rank}. ${inv.nome}`} meta={L.tipo[inv.tipo]} score={ev.score} e={e}>
      {(status === 'idle' || status === 'expired') && (
        <>
          <button type="button" className="btn btn-navy btn-sm" disabled={!can} onClick={propose}>
            {status === 'expired' ? u.actions.proposeAgain : u.actions.propose}
            {sr}
          </button>
          {status === 'idle' && (
            <button type="button" className="btn btn-text btn-sm" onClick={() => dispatch({ type: 'PASS', id })}>
              {u.actions.pass}
              {sr}
            </button>
          )}
        </>
      )}
      {status === 'waiting' && (
        <>
          <Link to={path('matchRequests')} className="btn btn-outline btn-sm">
            {t.directory.dir.requestsLink}
          </Link>
          <button type="button" className="btn btn-text btn-sm" onClick={() => updateInbox((s) => timeTravel(s, TIME_TRAVEL_DAYS))}>
            {t.directory.inbox.travel(TIME_TRAVEL_DAYS)}
          </button>
        </>
      )}
      {status === 'request' && (
        <>
          <button type="button" className="btn btn-navy btn-sm" onClick={() => reply(true)}>
            {u.actions.introYes}
            {sr}
          </button>
          <button type="button" className="btn btn-text btn-sm" onClick={() => reply(false)}>
            {u.actions.introNo}
            {sr}
          </button>
        </>
      )}
      {limitHit && !can && (
        <p className="mi-error mi-agent-limit" role="alert">
          {u.limitReached(MONTHLY_PROPOSAL_LIMIT)}
        </p>
      )}
      {status === 'intro' && <Email email={introEmail(p, inv, locale)} />}
    </Card>
  );
}

function InvestorMatch({ state, id, rank, dispatch }: Props) {
  const { locale, t, f } = useI18n();
  const u = t.intake.ui;
  const L = labelsFor(locale);
  const hid = useId();

  const inv = investorProfileOf(state, locale);
  const st = demoStartups(locale).find((x) => x.id === id);
  if (!inv || !st) return null;
  const ev = evaluate(st, inv, 'investitore', locale);
  const status = investorStatus(state, id);
  const e = explainStartupMatch(st, inv, ev, status, locale);
  const title = status === 'intro' ? st.nome : t.match.ui.investor.startupTitle(L.settore[st.settore], L.regione[st.regione]);
  const sr = <span className="sr-only">{u.actionSr(title)}</span>;
  return (
    <Card
      hid={hid}
      title={`${rank}. ${title}`}
      meta={t.match.ui.investor.startupMeta(L.fase[st.fase], f.euro(st.round))}
      score={ev.score}
      e={e}
      teaser={status === 'intro' ? undefined : <TeaserCard teaser={teaserOf(st, locale)} />}
    >
      {status === 'idle' && (
        <>
          <button type="button" className="btn btn-navy btn-sm" onClick={() => dispatch({ type: 'INTERESTED', id })}>
            {u.actions.interested}
            {sr}
          </button>
          <button type="button" className="btn btn-text btn-sm" onClick={() => dispatch({ type: 'PASS', id })}>
            {u.actions.passInvestor}
            {sr}
          </button>
        </>
      )}
      {status === 'waiting' && (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => dispatch({ type: 'SIMULATE', id })}>
          {u.actions.simulateStartup}
          {sr}
        </button>
      )}
      {status === 'intro' && <Email email={introEmail(st, inv, locale)} />}
    </Card>
  );
}

interface CardProps {
  hid: string;
  title: string;
  meta: string;
  score: number;
  e: Explanation;
  teaser?: ReactNode;
  children: ReactNode;
}

function Card({ hid, title, meta, score, e, teaser, children }: CardProps) {
  const { t } = useI18n();
  const u = t.intake.ui;
  return (
    <article className="mi-agent-match" aria-labelledby={`${hid}-h`}>
      <header className="mi-agent-match-head">
        <div>
          <h3 id={`${hid}-h`}>{title}</h3>
          <p className="mi-agent-match-meta">{meta}</p>
        </div>
        <ScoreMeter score={score} />
      </header>
      <p className="mi-agent-match-lead">{e.lead}</p>
      {teaser}
      <p>
        <strong>{u.whyTitle}.</strong> {e.fits}
      </p>
      <div className="mi-agent-gaps">
        <strong>{u.gapsTitle}.</strong>
        <ul>
          {e.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
      <p className="mi-agent-next" aria-live="polite">
        <strong>{u.nextTitle}.</strong> {e.next}
      </p>
      <div className="mi-agent-match-actions">{children}</div>
    </article>
  );
}

function Email({ email }: { email: ReturnType<typeof introEmail> }) {
  const { t } = useI18n();
  return (
    <details className="details mi-agent-email">
      <summary>{t.intake.ui.emailToggle}</summary>
      <IntroEmailPreview email={email} />
    </details>
  );
}
