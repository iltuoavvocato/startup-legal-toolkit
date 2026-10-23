import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { DemoBadge } from '../components/match/DemoBadge';
import { LiveRegion } from '../components/match/LiveRegion';
import { OptInBoard } from '../components/match/OptInBoard';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ProposalCounter } from '../components/match/ProposalCounter';
import { SelectField } from '../components/match/SelectField';
import { DEMO_INVESTORS, DEMO_STARTUPS, demoInvestors, demoStartups } from '../data/matchDemo';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import { evaluate } from '../lib/matching';
import {
  ownInvestor,
  ownStartup,
  startupFromQuery,
  startupToQuery,
  thesisFromQuery,
  thesisToQuery,
  YOUR_ID,
  type StartupCore,
  type Thesis,
} from '../lib/matchQuery';
import type { Investor, StartupProfile } from '../lib/matchTaxonomy';
import {
  consume,
  counterFor,
  monthKey,
  MONTHLY_PROPOSAL_LIMIT,
  stateSteps,
  transition,
  type OptInEvent,
  type OptInState,
  type ProposalCounter as Counter,
} from '../lib/optin';

interface NavState {
  startup?: { nome?: string; founder?: string; oneLiner?: string };
  investor?: { nome?: string; referente?: string };
  counter?: Counter;
  sent?: boolean;
}

function readNavState(raw: unknown): NavState {
  if (!raw || typeof raw !== 'object') return {};
  const s = raw as Record<string, unknown>;
  const str = (o: unknown, k: string) =>
    o && typeof o === 'object' && typeof (o as Record<string, unknown>)[k] === 'string'
      ? ((o as Record<string, unknown>)[k] as string)
      : undefined;
  const c = s.counter as Counter | undefined;
  return {
    startup: s.startup ? { nome: str(s.startup, 'nome'), founder: str(s.startup, 'founder'), oneLiner: str(s.startup, 'oneLiner') } : undefined,
    investor: s.investor ? { nome: str(s.investor, 'nome'), referente: str(s.investor, 'referente') } : undefined,
    counter: c && typeof c.month === 'string' && Number.isInteger(c.used) && c.used >= 0 ? c : undefined,
    sent: s.sent === true,
  };
}

const MESSAGE_KEY: Record<OptInState, 'proposta' | 'attesa' | 'chiusaInvestitore' | 'chiusaStartup' | 'intro'> = {
  proposta: 'proposta',
  'attesa-startup': 'attesa',
  'chiusa-investitore': 'chiusaInvestitore',
  'chiusa-startup': 'chiusaStartup',
  intro: 'intro',
};

const REACHED: Record<OptInState, number> = {
  proposta: 0,
  'chiusa-investitore': 0,
  'attesa-startup': 1,
  'chiusa-startup': 1,
  intro: 2,
};

export function MatchOptInPage() {
  const { locale, t } = useI18n();
  const u = t.match.ui.optinPage;
  const location = useLocation();
  const [setup] = useState(() => {
    const q = readQuery();
    const nav = readNavState(location.state);
    const ownS: StartupCore | null = q.get('s') === YOUR_ID ? startupFromQuery(q) : null;
    const ownT: Thesis | null = q.get('i') === YOUR_ID ? thesisFromQuery(q) : null;
    const s = ownS ? YOUR_ID : DEMO_STARTUPS.some((x) => x.id === q.get('s')) ? q.get('s')! : DEMO_STARTUPS[0]!.id;
    const i = ownT ? YOUR_ID : DEMO_INVESTORS.some((x) => x.id === q.get('i')) ? q.get('i')! : DEMO_INVESTORS[0]!.id;
    return { ownS, ownT, nav, s, i, fromResults: nav.sent === true && (Boolean(ownS) || Boolean(ownT)) };
  });

  const yourStartup: StartupProfile | null = setup.ownS ? ownStartup(setup.ownS, setup.nav.startup, locale) : null;
  const yourInvestor: Investor | null = setup.ownT ? ownInvestor(setup.ownT, setup.nav.investor, locale) : null;
  const startups = yourStartup ? [yourStartup, ...demoStartups(locale)] : demoStartups(locale);
  const investors = yourInvestor ? [yourInvestor, ...demoInvestors(locale)] : demoInvestors(locale);

  const month = monthKey(new Date());
  const [startupId, setStartupId] = useState(setup.s);
  const [investorId, setInvestorId] = useState(setup.i);
  const [sent, setSent] = useState(setup.fromResults);
  const [state, setState] = useState<OptInState>('proposta');
  const [counters, setCounters] = useState<Record<string, Counter>>(() => {
    const initial: Record<string, Counter> = {};
    if (setup.nav.counter && setup.ownS) initial[YOUR_ID] = counterFor(month, setup.nav.counter);
    return initial;
  });
  const [message, setMessage] = useState('');
  const boardRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const id = useId();

  const startup = startups.find((x) => x.id === startupId) ?? startups[0]!;
  const investor = investors.find((x) => x.id === investorId) ?? investors[0]!;
  const counter = counterFor(month, counters[startup.id]);
  const evaluation = evaluate(startup, investor, 'startup', locale);

  useSyncQuery({
    s: startup.id,
    i: investor.id,
    ...(startup.id === YOUR_ID ? startupToQuery(startup) : {}),
    ...(investor.id === YOUR_ID && setup.ownT ? thesisToQuery(setup.ownT) : {}),
  });

  useEffect(() => {
    if (moved.current) boardRef.current?.focus();
  }, [sent]);

  const choose = (kind: 's' | 'i', value: string) => {
    if (kind === 's') setStartupId(value);
    else setInvestorId(value);
    setSent(false);
    setState('proposta');
    setMessage(u.newPair);
  };

  const send = () => {
    const r = consume(counter, MONTHLY_PROPOSAL_LIMIT, locale);
    if (!r.ok) {
      setMessage(r.reason);
      return;
    }
    setCounters((c) => ({ ...c, [startup.id]: r.counter }));
    moved.current = true;
    setSent(true);
    setState('proposta');
    setMessage(u.messages.proposta);
  };

  const onEvent = (e: OptInEvent) => {
    const next = transition(state, e);
    setState(next);
    setMessage(u.messages[MESSAGE_KEY[next]]);
  };

  const restart = () => {
    setState(transition(state, 'RESET'));
    setMessage(u.restarted);
  };

  const limitReached = counter.used >= MONTHLY_PROPOSAL_LIMIT;

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={u.eyebrow} title={<Rich text={u.title} />}>
        <p>{u.lead}</p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container">
          <LiveRegion message={message} />

          <div className="mi-results-bar">
            <div className="card">
              <div className="mi-card-head">
                <h2 className="card-title">{u.pairTitle}</h2>
                <DemoBadge />
              </div>
              <div className="mi-scenario">
                <SelectField
                  id={`${id}-s`}
                  label={u.startup}
                  value={startup.id}
                  options={startups.map((x) => ({ value: x.id, label: x.id === YOUR_ID ? u.you(x.nome) : x.nome }))}
                  onChange={(v) => choose('s', v)}
                />
                <SelectField
                  id={`${id}-i`}
                  label={u.investor}
                  value={investor.id}
                  options={investors.map((x) => ({ value: x.id, label: x.id === YOUR_ID ? u.you(x.nome) : x.nome }))}
                  onChange={(v) => choose('i', v)}
                />
              </div>
              {evaluation.eligible ? (
                <p className="field-hint">{u.fit(evaluation.score, evaluation.reasons.slice(0, 2).join('. '))}</p>
              ) : (
                <p className="notice">{u.notProposed(evaluation.whyNot.join('; '))}</p>
              )}
            </div>
            <ProposalCounter counter={counter} limit={MONTHLY_PROPOSAL_LIMIT} />
          </div>

          {!sent ? (
            <div className="card mi-flow-narrow">
              <h2 className="card-title">{u.notSentTitle}</h2>
              <p className="mi-aside-text">
                {u.notSentText(startup.id === YOUR_ID ? u.yourStartup : u.ofStartup(startup.nome))}
              </p>
              <button
                type="button"
                className="btn btn-navy"
                onClick={send}
                disabled={!evaluation.eligible || limitReached}
                aria-describedby={limitReached ? `${id}-limit` : undefined}
              >
                {u.send} <span aria-hidden="true">→</span>
              </button>
              {limitReached && (
                <p className="mi-error" id={`${id}-limit`}>
                  {t.match.optin.limitReached(MONTHLY_PROPOSAL_LIMIT)}
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="mi-results-head">
                <h2 tabIndex={-1} ref={boardRef}>
                  {u.boardTitle}
                </h2>
                <button type="button" className="btn btn-text btn-sm" onClick={restart} disabled={state === 'proposta'}>
                  {u.restart}
                </button>
              </div>
              <ol className="mi-timeline" aria-label={u.stateLabel}>
                {stateSteps(locale).map((s, i) => (
                  <li key={s.state} className={i <= REACHED[state] ? 'is-reached' : undefined}>
                    {s.label}
                    {i === REACHED[state] && <span className="sr-only">{u.current}</span>}
                  </li>
                ))}
              </ol>
              <OptInBoard state={state} startup={startup} investor={investor} onEvent={onEvent} />
              <p className="notice mi-board-note">{u.note}</p>
            </div>
          )}

          <p className="mi-board-note">
            <Rich text={u.links} />
          </p>
          <Disclaimer />
          <CtaPanel campaign="match" title={u.ctaTitle} text={u.ctaText} />
        </div>
      </section>
    </>
  );
}
