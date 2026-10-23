import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { AgentProcessing } from '../components/match/AgentProcessing';
import { DeckDropzone } from '../components/match/DeckDropzone';
import { DemoBadge } from '../components/match/DemoBadge';
import { EuroField } from '../components/match/EuroField';
import { ExcludedList } from '../components/match/ExcludedList';
import { LiveRegion } from '../components/match/LiveRegion';
import { MatchCard } from '../components/match/MatchCard';
import { MatchSteps } from '../components/match/MatchSteps';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ProposalCounter } from '../components/match/ProposalCounter';
import { ScoreExplainer } from '../components/match/ScoreExplainer';
import { SegmentedField } from '../components/match/SegmentedField';
import { SelectField } from '../components/match/SelectField';
import { TeaserCard } from '../components/match/TeaserCard';
import { DEMO_INVESTORS, EXAMPLE_STARTUP_FORM } from '../data/matchDemo';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { FONTE_LABEL, mockExtract, type DeckMeta, type Extraction, type Fonte, type StartupForm } from '../lib/deck';
import { formatEuro } from '../lib/format';
import { matchInvestors } from '../lib/matching';
import { ownStartup, startupFromQuery, startupToQuery, type StartupCore } from '../lib/matchQuery';
import {
  FASE_LABEL,
  FASI,
  isFase,
  isRegione,
  isSettore,
  ONE_LINER_MAX,
  REGIONE_LABEL,
  REGIONI,
  SETTORE_LABEL,
  SETTORI,
  TIPO_LABEL,
  type StartupProfile,
} from '../lib/matchTaxonomy';
import { canPropose, consume, counterFor, monthKey, MONTHLY_PROPOSAL_LIMIT, teaserOf } from '../lib/optin';

type Step = 'dati' | 'analisi' | 'profilo' | 'match';
const STEPS: Step[] = ['dati', 'analisi', 'profilo', 'match'];
const STEP_LABELS = ['Dati e deck', 'Lettura del deck', 'Conferma del profilo', 'I tuoi match'];
const DESCR_MAX = 600;

interface Draft {
  nome: string;
  founder: string;
  settore: string;
  fase: string;
  regione: string;
  round: number | null;
  oneLiner: string;
  fonti: Partial<Record<keyof Extraction, Fonte>>;
}

const EMPTY_FORM: StartupForm = { settore: '', fase: '', regione: '', round: null, descrizione: '' };

function draftFrom(x: Extraction, names: { nome: string; founder: string }): Draft {
  return {
    ...names,
    settore: x.settore.value,
    fase: x.fase.value,
    regione: x.regione.value,
    round: x.round.value,
    oneLiner: x.oneLiner.value,
    fonti: {
      settore: x.settore.fonte,
      fase: x.fase.fonte,
      regione: x.regione.fonte,
      round: x.round.fonte,
      oneLiner: x.oneLiner.fonte,
    },
  };
}

function coreOf(d: Draft): StartupCore | null {
  if (!isSettore(d.settore) || !isFase(d.fase) || !isRegione(d.regione) || !d.round || d.round <= 0) return null;
  return { settore: d.settore, fase: d.fase, regione: d.regione, round: d.round };
}

export function MatchStartupPage() {
  const [initial] = useState(() => startupFromQuery(readQuery()));
  const [step, setStep] = useState<Step>(initial ? 'match' : 'dati');
  const [form, setForm] = useState<StartupForm>(EMPTY_FORM);
  const [deck, setDeck] = useState<DeckMeta | null>(null);
  const [names, setNames] = useState({ nome: '', founder: '' });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [profile, setProfile] = useState<StartupProfile | null>(() => (initial ? ownStartup(initial) : null));
  const [counter, setCounter] = useState(() => counterFor(monthKey(new Date())));
  const [proposed, setProposed] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ round?: string; review?: string }>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const id = useId();

  useSyncQuery(step === 'match' && profile ? startupToQuery(profile) : null);

  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus();
  }, [step]);

  const go = (next: Step) => {
    moved.current = true;
    setStep(next);
    setMessage(`Passo ${STEPS.indexOf(next) + 1} di ${STEPS.length}: ${STEP_LABELS[STEPS.indexOf(next)]}.`);
  };

  const useExample = () => {
    setForm({
      settore: EXAMPLE_STARTUP_FORM.settore,
      fase: EXAMPLE_STARTUP_FORM.fase,
      regione: EXAMPLE_STARTUP_FORM.regione,
      round: EXAMPLE_STARTUP_FORM.round,
      descrizione: EXAMPLE_STARTUP_FORM.descrizione,
    });
    setNames({ nome: EXAMPLE_STARTUP_FORM.nome, founder: EXAMPLE_STARTUP_FORM.founder });
    setDeck({ name: 'contoverde-deck-seed.pdf', type: 'application/pdf', size: 2_516_582 });
    setErrors({});
    setMessage('Modulo compilato con i dati di esempio.');
  };

  const submitData = (e: FormEvent) => {
    e.preventDefault();
    if (form.round !== null && form.round <= 0) {
      setErrors({ round: 'Indica un importo maggiore di zero, oppure lascia vuoto.' });
      return;
    }
    setErrors({});
    go('analisi');
  };

  const finishAnalysis = () => {
    setDraft(draftFrom(mockExtract(deck, form), names));
    go('profilo');
  };

  const confirmProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const core = coreOf(draft);
    if (!core) {
      setErrors({ review: 'Completa settore, fase, regione e un importo del round maggiore di zero.' });
      return;
    }
    setErrors({});
    setProfile(ownStartup(core, { nome: draft.nome, founder: draft.founder, oneLiner: draft.oneLiner }));
    setProposed([]);
    go('match');
  };

  const editProfile = () => {
    if (!draft && profile) {
      setDraft({
        nome: profile.id === 'tu' && profile.nome === 'La tua startup' ? '' : profile.nome,
        founder: profile.founder === 'Founder' ? '' : profile.founder,
        settore: profile.settore,
        fase: profile.fase,
        regione: profile.regione,
        round: profile.round,
        oneLiner: profile.oneLiner === 'Descrizione non indicata.' ? '' : profile.oneLiner,
        fonti: {},
      });
    }
    go('profilo');
  };

  const propose = (investorId: string, investorName: string) => {
    const r = consume(counter);
    if (!r.ok) {
      setMessage(r.reason);
      return;
    }
    setCounter(r.counter);
    setProposed((p) => [...p, investorId]);
    const left = MONTHLY_PROPOSAL_LIMIT - r.counter.used;
    setMessage(`Proposta inviata a ${investorName}. ${left === 1 ? 'Resta 1 proposta' : `Restano ${left} proposte`} questo mese.`);
  };

  const stepIndex = STEPS.indexOf(step);
  const previewTeaser = teaserOf({
    settore: isSettore(form.settore) ? form.settore : 'saas-b2b',
    fase: isFase(form.fase) ? form.fase : 'seed',
    regione: isRegione(form.regione) ? form.regione : 'lombardia',
    round: form.round ?? 0,
    oneLiner: form.descrizione ? form.descrizione.slice(0, ONE_LINER_MAX) : '',
  });
  if (!isSettore(form.settore)) previewTeaser.settore = '—';
  if (!isFase(form.fase)) previewTeaser.fase = '—';
  if (!isRegione(form.regione)) previewTeaser.regione = '—';
  if (!form.round) previewTeaser.importo = '—';

  return (
    <>
      <PrototypeBanner />
      <PageHero
        eyebrow="Match investitori · startup"
        title={
          <>
            Trova gli investitori <em>in linea con il tuo round</em>
          </>
        }
      >
        <p>
          Inserisci i dati essenziali e, se vuoi, il deck. L’agente prepara il profilo, tu lo confermi e ricevi i match con
          le motivazioni. Prototipo dimostrativo con dati di esempio.
        </p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container">
          <LiveRegion message={message} />
          <MatchSteps steps={STEP_LABELS} current={stepIndex} label="Passaggi" />

          {step === 'dati' && (
            <div className="mi-flow">
              <form className="card mi-flow-main" onSubmit={submitData} noValidate>
                <div className="mi-card-head">
                  <div>
                    <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                      La tua startup in breve
                    </h2>
                    <p>Bastano pochi dati: quello che manca lo propone l’agente e tu lo correggi al passo successivo.</p>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={useExample}>
                    Usa un esempio
                  </button>
                </div>
                <div>
                  <div className="mi-grid-2">
                    <SelectField
                      id={`${id}-settore`}
                      label="Settore"
                      value={form.settore}
                      placeholder="Scegli un settore"
                      options={SETTORI}
                      onChange={(v) => setForm((f) => ({ ...f, settore: v }))}
                    />
                    <SelectField
                      id={`${id}-regione`}
                      label="Regione della sede"
                      value={form.regione}
                      placeholder="Scegli una regione"
                      options={REGIONI}
                      onChange={(v) => setForm((f) => ({ ...f, regione: v }))}
                    />
                  </div>
                  <SegmentedField
                    id={`${id}-fase`}
                    legend="Fase"
                    options={FASI}
                    value={form.fase}
                    onChange={(v) => setForm((f) => ({ ...f, fase: v }))}
                  />
                  <EuroField
                    id={`${id}-round`}
                    label="Importo del round"
                    value={form.round}
                    onChange={(v) => setForm((f) => ({ ...f, round: v }))}
                    hint="Quanto vuoi raccogliere in questo round, in euro."
                    error={errors.round}
                  />
                  <div className="field mi-field">
                    <div className="mi-counter-line">
                      <label htmlFor={`${id}-descr`}>Breve descrizione</label>
                      <span className="field-hint" aria-hidden="true">
                        {form.descrizione.length}/{DESCR_MAX}
                      </span>
                    </div>
                    <textarea
                      id={`${id}-descr`}
                      className="mi-textarea"
                      maxLength={DESCR_MAX}
                      value={form.descrizione}
                      aria-describedby={`${id}-descr-hint`}
                      onChange={(e) => setForm((f) => ({ ...f, descrizione: e.target.value }))}
                    />
                    <p className="field-hint" id={`${id}-descr-hint`}>
                      Cosa fate e per chi, in due o tre frasi. La prima frase diventa la presentazione anonima per gli
                      investitori.
                    </p>
                  </div>
                  <DeckDropzone id={`${id}-deck`} file={deck} onChange={setDeck} />
                </div>
                <div className="mi-form-actions">
                  <p className="field-hint">Nessun dato lascia il tuo browser.</p>
                  <button type="submit" className="btn btn-navy">
                    {deck ? 'Fai leggere il deck all’agente' : 'Prepara il profilo'} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
              <aside className="mi-flow-aside" aria-labelledby={`${id}-preview`}>
                <div>
                  <h2 className="mi-aside-title" id={`${id}-preview`}>
                    Cosa vede l’investitore
                  </h2>
                  <p className="mi-aside-text">
                    Prima del doppio consenso l’investitore vede solo questo: nessun nome, nessun contatto.
                  </p>
                  <TeaserCard teaser={previewTeaser} label="Anteprima del teaser anonimo" />
                </div>
              </aside>
            </div>
          )}

          {step === 'analisi' && (
            <div className="card mi-flow-narrow">
              <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                {deck ? 'L’agente sta leggendo il deck' : 'L’agente sta preparando il profilo'}
              </h2>
              <AgentProcessing hasDeck={Boolean(deck)} onDone={finishAnalysis} />
            </div>
          )}

          {step === 'profilo' && draft && (
            <form className="card mi-flow-narrow" onSubmit={confirmProfile} noValidate>
              <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                {deck ? 'L’agente ha letto il deck: controlla il profilo' : 'Controlla il profilo'}
              </h2>
              <p className="notice mi-review-note">
                L’agente propone, tu decidi: correggi quello che non va. Il profilo viene usato solo dopo la tua conferma.
              </p>
              {errors.review && (
                <p className="mi-error mi-error-summary" role="alert">
                  {errors.review}
                </p>
              )}
              <div className="mi-grid-2">
                <div className="field mi-field">
                  <label htmlFor={`${id}-nome`}>
                    Nome della startup <span className="mi-muted">(facoltativo)</span>
                  </label>
                  <input
                    id={`${id}-nome`}
                    type="text"
                    autoComplete="organization"
                    value={draft.nome}
                    onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
                  />
                </div>
                <div className="field mi-field">
                  <label htmlFor={`${id}-founder`}>
                    Il tuo nome <span className="mi-muted">(facoltativo)</span>
                  </label>
                  <input
                    id={`${id}-founder`}
                    type="text"
                    autoComplete="name"
                    value={draft.founder}
                    onChange={(e) => setDraft({ ...draft, founder: e.target.value })}
                  />
                </div>
              </div>
              <p className="field-hint mi-legend-hint">
                Nome e contatti restano riservati: l’investitore li vede solo nell’email di presentazione.
              </p>
              <div className="mi-grid-2">
                <SelectField
                  id={`${id}-r-settore`}
                  label="Settore"
                  value={draft.settore}
                  options={SETTORI}
                  onChange={(v) => setDraft({ ...draft, settore: v })}
                  hint={draft.fonti.settore ? `Fonte: ${FONTE_LABEL[draft.fonti.settore]}` : undefined}
                />
                <SelectField
                  id={`${id}-r-regione`}
                  label="Regione della sede"
                  value={draft.regione}
                  options={REGIONI}
                  onChange={(v) => setDraft({ ...draft, regione: v })}
                  hint={draft.fonti.regione ? `Fonte: ${FONTE_LABEL[draft.fonti.regione]}` : undefined}
                />
              </div>
              <SegmentedField
                id={`${id}-r-fase`}
                legend="Fase"
                options={FASI}
                value={draft.fase}
                onChange={(v) => setDraft({ ...draft, fase: v })}
              />
              {draft.fonti.fase && (
                <p className="field-hint mi-legend-hint">
                  Fonte: {FONTE_LABEL[draft.fonti.fase]}
                </p>
              )}
              <EuroField
                id={`${id}-r-round`}
                label="Importo del round"
                value={draft.round}
                onChange={(v) => setDraft({ ...draft, round: v })}
                hint={draft.fonti.round ? `Fonte: ${FONTE_LABEL[draft.fonti.round]}` : undefined}
              />
              <div className="field mi-field">
                <div className="mi-counter-line">
                  <label htmlFor={`${id}-r-line`}>Presentazione anonima</label>
                  <span className="field-hint" aria-hidden="true">
                    {draft.oneLiner.length}/{ONE_LINER_MAX}
                  </span>
                </div>
                <textarea
                  id={`${id}-r-line`}
                  className="mi-textarea"
                  maxLength={ONE_LINER_MAX}
                  value={draft.oneLiner}
                  aria-describedby={`${id}-r-line-hint`}
                  onChange={(e) => setDraft({ ...draft, oneLiner: e.target.value })}
                />
                <p className="field-hint" id={`${id}-r-line-hint`}>
                  Una frase, senza il nome della startup: è ciò che legge l’investitore nel teaser.
                  {draft.fonti.oneLiner && ` Fonte: ${FONTE_LABEL[draft.fonti.oneLiner]}.`}
                </p>
              </div>
              <div className="mi-form-actions">
                <button type="button" className="btn btn-text" onClick={() => go('dati')}>
                  <span aria-hidden="true">←</span> Torna ai dati
                </button>
                <button type="submit" className="btn btn-navy">
                  Conferma il profilo <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          )}

          {step === 'match' && profile && (
            <Results
              profile={profile}
              counter={counter}
              proposed={proposed}
              onPropose={propose}
              onEdit={editProfile}
              headingRef={headingRef}
            />
          )}

          <Disclaimer />
          <CtaPanel
            campaign="match"
            title="Prima di parlare con gli investitori"
            text="Patti tra fondatori, vesting, SAFE e proprietà intellettuale in ordine rendono il round più semplice. ilTuoAvvocato.com ti aiuta online."
          />
        </div>
      </section>
    </>
  );
}

interface ResultsProps {
  profile: StartupProfile;
  counter: ReturnType<typeof counterFor>;
  proposed: string[];
  onPropose: (id: string, name: string) => void;
  onEdit: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
}

function Results({ profile, counter, proposed, onPropose, onEdit, headingRef }: ResultsProps) {
  const { matches, excluded } = matchInvestors(profile, DEMO_INVESTORS);
  const can = canPropose(counter);
  const optInLink = (investorId: string) => ({
    pathname: '/match-investitori/doppio-consenso/',
    search: `?${new URLSearchParams({ s: 'tu', i: investorId, ...startupToQuery(profile) }).toString()}`,
  });
  const optInState = {
    startup: { nome: profile.nome, founder: profile.founder, oneLiner: profile.oneLiner },
    counter,
    sent: true,
  };

  return (
    <div>
      <div className="mi-results-bar">
        <div>
          <ul className="mi-filters" aria-label="Il tuo profilo">
            <li className="mi-filter">
              <span>Settore</span> {SETTORE_LABEL[profile.settore]}
            </li>
            <li className="mi-filter">
              <span>Fase</span> {FASE_LABEL[profile.fase]}
            </li>
            <li className="mi-filter">
              <span>Regione</span> {REGIONE_LABEL[profile.regione]}
            </li>
            <li className="mi-filter">
              <span>Round</span> {formatEuro(profile.round)}
            </li>
            <li>
              <button type="button" className="btn btn-text btn-sm" onClick={onEdit}>
                Modifica il profilo
              </button>
            </li>
          </ul>
        </div>
        <ProposalCounter counter={counter} limit={MONTHLY_PROPOSAL_LIMIT} />
      </div>

      <div className="mi-results-head">
        <h2 tabIndex={-1} ref={headingRef}>
          I tuoi match: {matches.length} {matches.length === 1 ? 'investitore' : 'investitori'}
        </h2>
        <DemoBadge />
      </div>

      {matches.length === 0 ? (
        <div className="card mi-empty">
          <p>
            Nessun investitore di esempio è compatibile con questo profilo. Guarda sotto perché sono stati esclusi, oppure
            modifica fase, area o importo del round.
          </p>
        </div>
      ) : (
        <ol className="mi-matches">
          {matches.map(({ item, evaluation }, i) => {
            const sent = proposed.includes(item.id);
            return (
              <MatchCard
                key={item.id}
                rank={i + 1}
                title={item.nome}
                meta={`${TIPO_LABEL[item.tipo]}${item.sede ? ` · sede in ${REGIONE_LABEL[item.sede]}` : ''}`}
                evaluation={evaluation}
                actions={
                  sent ? (
                    <>
                      <span className="mi-sent">✓ Proposta inviata</span>
                      <Link to={optInLink(item.id)} state={optInState} className="btn btn-outline btn-sm">
                        Simula il doppio consenso <span aria-hidden="true">→</span>
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-navy btn-sm"
                      disabled={!can}
                      onClick={() => onPropose(item.id, item.nome)}
                    >
                      Proponi il profilo<span className="sr-only"> a {item.nome}</span>
                    </button>
                  )
                }
              >
                <p className="mi-match-meta">{item.tesi}</p>
              </MatchCard>
            );
          })}
        </ol>
      )}
      {!can && (
        <p className="notice mi-board-note">
          Hai raggiunto il limite di {MONTHLY_PROPOSAL_LIMIT} proposte per questo mese (valore provvisorio).
        </p>
      )}
      <ExcludedList
        noun="investitori"
        items={excluded.map((x) => ({ id: x.item.id, name: x.item.nome, whyNot: x.evaluation.whyNot }))}
      />
      <ScoreExplainer />
    </div>
  );
}
