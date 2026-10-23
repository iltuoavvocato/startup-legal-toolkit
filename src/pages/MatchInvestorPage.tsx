import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { ChoiceChips } from '../components/match/ChoiceChips';
import { DemoBadge } from '../components/match/DemoBadge';
import { EuroField } from '../components/match/EuroField';
import { ExcludedList } from '../components/match/ExcludedList';
import { LiveRegion } from '../components/match/LiveRegion';
import { MatchCard } from '../components/match/MatchCard';
import { MatchSteps } from '../components/match/MatchSteps';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ScoreExplainer } from '../components/match/ScoreExplainer';
import { SelectField } from '../components/match/SelectField';
import { TeaserCard } from '../components/match/TeaserCard';
import { DEMO_STARTUPS, EXAMPLE_INVESTOR_FORM } from '../data/matchDemo';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { formatEuro } from '../lib/format';
import { matchStartups } from '../lib/matching';
import { ownInvestor, thesisErrors, thesisFromQuery, thesisToQuery, type Thesis } from '../lib/matchQuery';
import {
  AREA_LABEL,
  AREE,
  FASE_LABEL,
  FASI,
  isArea,
  isFase,
  isRegione,
  isSettore,
  REGIONE_LABEL,
  REGIONI,
  SETTORE_LABEL,
  SETTORI,
} from '../lib/matchTaxonomy';
import { teaserOf } from '../lib/optin';
import '../styles/match.css';

const STEP_LABELS = ['La tua tesi', 'I tuoi match', 'Doppio consenso'];
const ITALIA = 'italia';
const AREA_OPTIONS = [...AREE, { value: ITALIA, label: 'Tutta Italia' }];

interface FormState {
  settori: string[];
  fasi: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  aree: string[];
  sede: string;
  nome: string;
}

const EMPTY: FormState = { settori: [], fasi: [], ticketMin: null, ticketMax: null, aree: [], sede: '', nome: '' };

function formFromThesis(t: Thesis): FormState {
  return {
    settori: t.settori,
    fasi: t.fasi,
    ticketMin: t.ticketMin,
    ticketMax: t.ticketMax,
    aree: t.aree === 'italia' ? [ITALIA] : t.aree,
    sede: t.sede ?? '',
    nome: '',
  };
}

function thesisOf(f: FormState): Thesis | null {
  if (Object.keys(thesisErrors(f)).length) return null;
  return {
    settori: f.settori.filter(isSettore),
    fasi: f.fasi.filter(isFase),
    ticketMin: f.ticketMin ?? 0,
    ticketMax: f.ticketMax ?? 0,
    aree: f.aree.includes(ITALIA) ? 'italia' : f.aree.filter(isArea),
    sede: isRegione(f.sede) ? f.sede : null,
  };
}

export function MatchInvestorPage() {
  const [initial] = useState(() => thesisFromQuery(readQuery()));
  const [form, setForm] = useState<FormState>(() => (initial ? formFromThesis(initial) : EMPTY));
  const [thesis, setThesis] = useState<Thesis | null>(initial);
  const [showErrors, setShowErrors] = useState(false);
  const [message, setMessage] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const id = useId();
  const step = thesis ? 1 : 0;

  useSyncQuery(thesis ? thesisToQuery(thesis) : null);

  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus();
  }, [step]);

  const errors = showErrors ? thesisErrors(form) : {};

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = thesisOf(form);
    if (!t) {
      setShowErrors(true);
      setMessage('Controlla i campi segnalati.');
      return;
    }
    moved.current = true;
    setThesis(t);
    setMessage(`Passo 2 di ${STEP_LABELS.length}: i tuoi match.`);
  };

  const edit = () => {
    moved.current = true;
    setThesis(null);
    setMessage(`Passo 1 di ${STEP_LABELS.length}: la tua tesi.`);
  };

  const useExample = () => {
    setForm({
      settori: [...EXAMPLE_INVESTOR_FORM.settori],
      fasi: [...EXAMPLE_INVESTOR_FORM.fasi],
      ticketMin: EXAMPLE_INVESTOR_FORM.ticketMin,
      ticketMax: EXAMPLE_INVESTOR_FORM.ticketMax,
      aree: [...EXAMPLE_INVESTOR_FORM.aree],
      sede: '',
      nome: EXAMPLE_INVESTOR_FORM.nome,
    });
    setShowErrors(false);
    setMessage('Modulo compilato con i dati di esempio.');
  };

  const setAree = (next: string[]) => {
    // "Tutta Italia" excludes the single areas and vice versa.
    const added = next.find((v) => !form.aree.includes(v));
    setForm((f) => ({ ...f, aree: added === ITALIA ? [ITALIA] : next.filter((v) => v !== ITALIA) }));
  };

  return (
    <>
      <PrototypeBanner />
      <PageHero
        eyebrow="Match investitori · investitore"
        title={
          <>
            Startup in linea <em>con la tua tesi</em>
          </>
        }
      >
        <p>
          Indica settori, fasi, ticket e aree. Ricevi solo teaser anonimi di startup compatibili: il nome arriva con
          l’intro, se dite sì entrambi. Prototipo dimostrativo con dati di esempio.
        </p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container">
          <LiveRegion message={message} />
          <MatchSteps steps={STEP_LABELS} current={step} label="Passaggi" />

          {!thesis ? (
            <form className="card mi-flow-narrow" onSubmit={submit} noValidate>
              <div className="mi-card-head">
                <div>
                  <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                    La tua tesi di investimento
                  </h2>
                  <p>Poche scelte: servono a filtrare e ordinare le startup.</p>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={useExample}>
                  Usa un esempio
                </button>
              </div>
              {showErrors && Object.keys(errors).length > 0 && (
                <p className="mi-error mi-error-summary" role="alert">
                  Mancano alcune informazioni: {Object.values(errors).join(' ')}
                </p>
              )}
              <ChoiceChips
                id={`${id}-settori`}
                legend="Settori"
                hint="Il primo che scegli conta come settore principale."
                options={SETTORI}
                selected={form.settori}
                onChange={(v) => setForm((f) => ({ ...f, settori: v }))}
                error={errors.settori}
              />
              <ChoiceChips
                id={`${id}-fasi`}
                legend="Fasi"
                options={FASI}
                selected={form.fasi}
                onChange={(v) => setForm((f) => ({ ...f, fasi: v }))}
                error={errors.fasi}
              />
              <div className="mi-grid-2">
                <EuroField
                  id={`${id}-min`}
                  label="Ticket minimo"
                  value={form.ticketMin}
                  onChange={(v) => setForm((f) => ({ ...f, ticketMin: v }))}
                  error={errors.ticket && !form.ticketMin ? errors.ticket : undefined}
                />
                <EuroField
                  id={`${id}-max`}
                  label="Ticket massimo"
                  value={form.ticketMax}
                  onChange={(v) => setForm((f) => ({ ...f, ticketMax: v }))}
                  error={errors.ticket && form.ticketMin ? errors.ticket : undefined}
                />
              </div>
              <ChoiceChips
                id={`${id}-aree`}
                legend="Aree geografiche"
                options={AREA_OPTIONS}
                selected={form.aree}
                onChange={setAree}
                error={errors.aree}
              />
              <div className="mi-grid-2">
                <SelectField
                  id={`${id}-sede`}
                  label="Regione della tua sede (facoltativo)"
                  value={form.sede}
                  placeholder="Non indicata"
                  options={REGIONI}
                  onChange={(v) => setForm((f) => ({ ...f, sede: v }))}
                  hint="Le startup della stessa regione ottengono qualche punto in più."
                />
                <div className="field mi-field">
                  <label htmlFor={`${id}-nome`}>Nome del veicolo o del gruppo (facoltativo)</label>
                  <input
                    id={`${id}-nome`}
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mi-form-actions">
                <p className="field-hint">Nessun dato lascia il tuo browser.</p>
                <button type="submit" className="btn btn-navy">
                  Trova startup in linea <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          ) : (
            <InvestorResults thesis={thesis} nome={form.nome} onEdit={edit} headingRef={headingRef} />
          )}

          <Disclaimer />
          <CtaPanel
            campaign="match"
            title="Investi in una startup italiana?"
            text="Per i primi round le startup usano spesso un SAFE adattato al diritto italiano. ilTuoAvvocato.com offre servizi legali online per startup."
          />
        </div>
      </section>
    </>
  );
}

interface ResultsProps {
  thesis: Thesis;
  nome: string;
  onEdit: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
}

function InvestorResults({ thesis, nome, onEdit, headingRef }: ResultsProps) {
  const investor = ownInvestor(thesis, { nome });
  const { matches, excluded } = matchStartups(investor, DEMO_STARTUPS);
  const aree = thesis.aree === 'italia' ? 'Tutta Italia' : thesis.aree.map((a) => AREA_LABEL[a]).join(', ');

  return (
    <div>
      <div className="mi-results-bar">
        <ul className="mi-filters" aria-label="La tua tesi">
          <li className="mi-filter">
            <span>Settori</span> {thesis.settori.map((s) => SETTORE_LABEL[s]).join(', ')}
          </li>
          <li className="mi-filter">
            <span>Fasi</span> {thesis.fasi.map((f) => FASE_LABEL[f]).join(', ')}
          </li>
          <li className="mi-filter">
            <span>Ticket</span> {formatEuro(thesis.ticketMin)}–{formatEuro(thesis.ticketMax)}
          </li>
          <li className="mi-filter">
            <span>Aree</span> {aree}
          </li>
          {thesis.sede && (
            <li className="mi-filter">
              <span>Sede</span> {REGIONE_LABEL[thesis.sede]}
            </li>
          )}
          <li>
            <button type="button" className="btn btn-text btn-sm" onClick={onEdit}>
              Modifica la tesi
            </button>
          </li>
        </ul>
      </div>

      <div className="mi-results-head">
        <h2 tabIndex={-1} ref={headingRef}>
          I tuoi match: {matches.length} startup
        </h2>
        <DemoBadge />
      </div>
      <p className="mi-aside-text">Vedi solo teaser anonimi: il nome della startup arriva con l’intro, se dite sì entrambi.</p>

      {matches.length === 0 ? (
        <div className="card mi-empty">
          <p>Nessuna startup di esempio è compatibile con questa tesi. Prova ad allargare fasi, aree o ticket.</p>
        </div>
      ) : (
        <ol className="mi-matches">
          {matches.map(({ item, evaluation }, i) => (
            <MatchCard
              key={item.id}
              rank={i + 1}
              title={`Startup ${SETTORE_LABEL[item.settore]} in ${REGIONE_LABEL[item.regione]}`}
              meta={`${FASE_LABEL[item.fase]} · cerca ${formatEuro(item.round)}`}
              evaluation={evaluation}
              actions={
                <Link
                  to={{
                    pathname: '/match-investitori/doppio-consenso/',
                    search: `?${new URLSearchParams({ s: item.id, i: 'tu', ...thesisToQuery(thesis) }).toString()}`,
                  }}
                  state={{ investor: { nome: investor.nome, referente: investor.referente }, sent: true }}
                  className="btn btn-outline btn-sm"
                >
                  Simula il doppio consenso <span aria-hidden="true">→</span>
                </Link>
              }
            >
              <TeaserCard teaser={teaserOf(item)} />
            </MatchCard>
          ))}
        </ol>
      )}
      <ExcludedList
        noun="startup"
        items={excluded.map((x) => ({
          id: x.item.id,
          name: `Startup ${SETTORE_LABEL[x.item.settore]} in ${REGIONE_LABEL[x.item.regione]}`,
          whyNot: x.evaluation.whyNot,
        }))}
      />
      <ScoreExplainer />
    </div>
  );
}
