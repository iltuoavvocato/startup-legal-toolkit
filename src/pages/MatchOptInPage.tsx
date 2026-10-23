import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { DemoBadge } from '../components/match/DemoBadge';
import { LiveRegion } from '../components/match/LiveRegion';
import { OptInBoard } from '../components/match/OptInBoard';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ProposalCounter } from '../components/match/ProposalCounter';
import { SelectField } from '../components/match/SelectField';
import { DEMO_INVESTORS, DEMO_STARTUPS } from '../data/matchDemo';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
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
  STATE_STEPS,
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

const MESSAGES: Record<OptInState, string> = {
  proposta: 'Proposta inviata: ora tocca all’investitore.',
  'attesa-startup': 'L’investitore ha detto sì. Ora tocca alla startup.',
  'chiusa-investitore': 'L’investitore ha detto no. La startup non ne viene informata.',
  'chiusa-startup': 'La startup ha detto no. L’investitore non ne viene informato.',
  intro: 'Avete detto sì entrambi: ecco l’email di presentazione.',
};

const REACHED: Record<OptInState, number> = {
  proposta: 0,
  'chiusa-investitore': 0,
  'attesa-startup': 1,
  'chiusa-startup': 1,
  intro: 2,
};

export function MatchOptInPage() {
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

  const yourStartup: StartupProfile | null = setup.ownS ? ownStartup(setup.ownS, setup.nav.startup) : null;
  const yourInvestor: Investor | null = setup.ownT ? ownInvestor(setup.ownT, setup.nav.investor) : null;
  const startups = yourStartup ? [yourStartup, ...DEMO_STARTUPS] : DEMO_STARTUPS;
  const investors = yourInvestor ? [yourInvestor, ...DEMO_INVESTORS] : DEMO_INVESTORS;

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

  const startup = startups.find((x) => x.id === startupId) ?? DEMO_STARTUPS[0]!;
  const investor = investors.find((x) => x.id === investorId) ?? DEMO_INVESTORS[0]!;
  const counter = counterFor(month, counters[startup.id]);
  const evaluation = evaluate(startup, investor);

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
    setMessage('Nuova coppia selezionata: la proposta non è ancora stata inviata.');
  };

  const send = () => {
    const r = consume(counter);
    if (!r.ok) {
      setMessage(r.reason);
      return;
    }
    setCounters((c) => ({ ...c, [startup.id]: r.counter }));
    moved.current = true;
    setSent(true);
    setState('proposta');
    setMessage(MESSAGES.proposta);
  };

  const onEvent = (e: OptInEvent) => {
    const next = transition(state, e);
    setState(next);
    setMessage(MESSAGES[next]);
  };

  const restart = () => {
    setState(transition(state, 'RESET'));
    setMessage('Simulazione ricominciata: la proposta è di nuovo in attesa dell’investitore.');
  };

  const limitReached = counter.used >= MONTHLY_PROPOSAL_LIMIT;

  return (
    <>
      <PrototypeBanner />
      <PageHero
        eyebrow="Match investitori · doppio consenso"
        title={
          <>
            L’intro arriva <em>solo se dite sì entrambi</em>
          </>
        }
      >
        <p>
          Simula una proposta dal punto di vista di entrambe le parti. L’investitore vede un teaser anonimo; se dice sì,
          tocca alla startup. Un no non viene mai comunicato all’altra parte.
        </p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container">
          <LiveRegion message={message} />

          <div className="mi-results-bar">
            <div className="card">
              <div className="mi-card-head">
                <h2 className="card-title">Scegli la coppia</h2>
                <DemoBadge />
              </div>
              <div className="mi-scenario">
                <SelectField
                  id={`${id}-s`}
                  label="Startup"
                  value={startup.id}
                  options={startups.map((x) => ({ value: x.id, label: x.id === YOUR_ID ? `${x.nome} (tu)` : x.nome }))}
                  onChange={(v) => choose('s', v)}
                />
                <SelectField
                  id={`${id}-i`}
                  label="Investitore"
                  value={investor.id}
                  options={investors.map((x) => ({ value: x.id, label: x.id === YOUR_ID ? `${x.nome} (tu)` : x.nome }))}
                  onChange={(v) => choose('i', v)}
                />
              </div>
              {evaluation.eligible ? (
                <p className="field-hint">
                  Affinità {evaluation.score}/100. {evaluation.reasons.slice(0, 2).join('. ')}.
                </p>
              ) : (
                <p className="notice">
                  L’agente non proporrebbe questa coppia: {evaluation.whyNot.join('; ')}. Scegli un’altra coppia.
                </p>
              )}
            </div>
            <ProposalCounter counter={counter} limit={MONTHLY_PROPOSAL_LIMIT} />
          </div>

          {!sent ? (
            <div className="card mi-flow-narrow">
              <h2 className="card-title">Proposta non ancora inviata</h2>
              <p className="mi-aside-text">
                Inviando la proposta, l’investitore riceve il teaser anonimo {startup.id === YOUR_ID ? 'della tua startup' : `di ${startup.nome}`}.
                Ogni proposta conta per il limite mensile della startup.
              </p>
              <button
                type="button"
                className="btn btn-navy"
                onClick={send}
                disabled={!evaluation.eligible || limitReached}
                aria-describedby={limitReached ? `${id}-limit` : undefined}
              >
                Invia la proposta <span aria-hidden="true">→</span>
              </button>
              {limitReached && (
                <p className="mi-error" id={`${id}-limit`}>
                  Hai raggiunto il limite di {MONTHLY_PROPOSAL_LIMIT} proposte per questo mese (valore provvisorio).
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="mi-results-head">
                <h2 tabIndex={-1} ref={boardRef}>
                  Cosa vede ciascuna parte
                </h2>
                <button type="button" className="btn btn-text btn-sm" onClick={restart} disabled={state === 'proposta'}>
                  Ricomincia la simulazione
                </button>
              </div>
              <ol className="mi-timeline" aria-label="Stato della proposta">
                {STATE_STEPS.map((s, i) => (
                  <li key={s.state} className={i <= REACHED[state] ? 'is-reached' : undefined}>
                    {s.label}
                    {i === REACHED[state] && <span className="sr-only"> (stato attuale)</span>}
                  </li>
                ))}
              </ol>
              <OptInBoard state={state} startup={startup} investor={investor} onEvent={onEvent} />
              <p className="notice mi-board-note">
                Qui vedi entrambe le parti per capire il meccanismo: nella realtà ciascuno vede solo il proprio riquadro.
                In questo prototipo le richieste senza risposta non scadono; in una versione reale potrebbero scadere dopo
                un periodo da definire, e per l’investitore una scadenza sarebbe indistinguibile da un no.
              </p>
            </div>
          )}

          <p className="mi-board-note">
            <Link to="/match-investitori/startup/">Prova il percorso startup</Link> ·{' '}
            <Link to="/match-investitori/investitore/">Prova il percorso investitore</Link> ·{' '}
            <Link to="/match-investitori/note-legali/">Note legali</Link>
          </p>
          <Disclaimer />
          <CtaPanel
            campaign="match"
            title="Arrivati all’intro, servono i documenti giusti"
            text="SAFE, patti tra fondatori, vesting e cessione della proprietà intellettuale: ilTuoAvvocato.com offre servizi legali online per startup."
          />
        </div>
      </section>
    </>
  );
}
