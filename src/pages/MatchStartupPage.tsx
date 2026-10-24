import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { AgentProcessing } from '../components/match/AgentProcessing';
import { DeckDropzone } from '../components/match/DeckDropzone';
import { DeckFindingsReview } from '../components/match/DeckFindingsReview';
import { useDeckReader } from '../components/match/useDeckReader';
import { readExportStore, saveStartupSheet } from '../components/match/useExportStore';
import { ExportLink } from '../components/match/ExportLink';
import { updateInbox, useInbox } from '../components/match/useInbox';
import { DemoBadge } from '../components/match/DemoBadge';
import { EuroField } from '../components/match/EuroField';
import { ExcludedList } from '../components/match/ExcludedList';
import { LiveRegion } from '../components/match/LiveRegion';
import { MatchCard } from '../components/match/MatchCard';
import { MatchSteps } from '../components/match/MatchSteps';
import { ModeSwitch } from '../components/match/ModeSwitch';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ProposalCounter } from '../components/match/ProposalCounter';
import { ScoreExplainer } from '../components/match/ScoreExplainer';
import { SegmentedField } from '../components/match/SegmentedField';
import { SelectField } from '../components/match/SelectField';
import { TeaserCard } from '../components/match/TeaserCard';
import { demoInvestors, EXAMPLE_STARTUP_FORM } from '../data/matchDemo';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import {
  draftExtraction,
  fonteLabels,
  startupFlowSteps,
  type AcceptedDeck,
  type DeckMeta,
  type Extraction,
  type Fonte,
  type StartupForm,
} from '../lib/deck';
import { countFindings } from '../lib/deckExtract';
import {
  annotateReasons,
  applyDecisions,
  deckSignals,
  deckSources,
  findingText,
  sourcesSummary,
  type Decisions,
  type DeckSources,
} from '../lib/deckSignals';
import { matchInvestors } from '../lib/matching';
import { ownStartup, startupFromQuery, startupToQuery, type StartupCore } from '../lib/matchQuery';
import {
  FASI,
  isFase,
  isRegione,
  isSettore,
  labelsFor,
  ONE_LINER_MAX,
  optionsOf,
  REGIONI,
  SETTORI,
  type StartupProfile,
} from '../lib/matchTaxonomy';
import { activeProposal, proposalCounter, propose as proposeTo, withProfile } from '../lib/inbox';
import { canPropose, MONTHLY_PROPOSAL_LIMIT, teaserOf, type ProposalCounter as Counter } from '../lib/optin';

type Step = 'dati' | 'analisi' | 'trovato' | 'profilo' | 'match';
const STEPS_DECK: Step[] = ['dati', 'analisi', 'trovato', 'profilo', 'match'];
const STEPS_NO_DECK: Step[] = ['dati', 'analisi', 'profilo', 'match'];
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
  /** Deck page for fields taken from the deck. */
  pagine: Partial<Record<keyof Extraction, number>>;
}

interface DeckInfo {
  sources: DeckSources;
  signals: string[];
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
    pagine: Object.fromEntries(
      (['settore', 'fase', 'regione', 'round', 'oneLiner'] as const).flatMap((k) => (x[k].page ? [[k, x[k].page]] : [])),
    ),
  };
}

function coreOf(d: Draft): StartupCore | null {
  if (!isSettore(d.settore) || !isFase(d.fase) || !isRegione(d.regione) || !d.round || d.round <= 0) return null;
  return { settore: d.settore, fase: d.fase, regione: d.regione, round: d.round };
}

export function MatchStartupPage() {
  const { locale, t } = useI18n();
  const u = t.match.ui.startup;
  const own = t.match.own;
  const L = labelsFor(locale);
  const fonti = fonteLabels(locale);
  const [initial] = useState(() => startupFromQuery(readQuery()));
  const [step, setStep] = useState<Step>(initial ? 'match' : 'dati');
  const [form, setForm] = useState<StartupForm>(EMPTY_FORM);
  const [deck, setDeck] = useState<DeckMeta | null>(null);
  const reader = useDeckReader();
  const [decisions, setDecisions] = useState<Decisions>({});
  const [accepted, setAccepted] = useState<AcceptedDeck | null>(null);
  const [deckInfo, setDeckInfo] = useState<DeckInfo>({ sources: {}, signals: [] });
  const [names, setNames] = useState({ nome: '', founder: '' });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [profile, setProfile] = useState<StartupProfile | null>(() =>
    initial ? ownStartup(initial, undefined, locale) : null,
  );
  // Proposals live in the requests inbox (sessionStorage), so the monthly counter is the same on every page.
  const { store, now } = useInbox();
  const counter = proposalCounter(store, now);
  const proposed = store.requests.filter((r) => r.role === 'founder' && activeProposal(store, r.counterpartId, now)).map((r) => r.counterpartId);
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

  // Results opened from a shared URL: the export only knows the enumerated fields (keep richer data for the same profile).
  useEffect(() => {
    if (!initial) return;
    const prev = readExportStore().startup?.core;
    const same = prev && (['settore', 'fase', 'regione', 'round'] as const).every((k) => prev[k] === initial[k]);
    if (!same) saveStartupSheet({ source: 'form', core: initial });
  }, [initial]);

  const read = reader.state;
  // "With a deck" means a deck that was actually read; a failed read falls back to the form-only flow.
  const hasDeck = read.status === 'ready';
  const busyReading = read.status === 'loading' || read.status === 'reading';
  const STEPS = hasDeck ? STEPS_DECK : STEPS_NO_DECK;
  const stepLabels = startupFlowSteps(locale, hasDeck);

  const go = (next: Step) => {
    moved.current = true;
    setStep(next);
    const n = STEPS.indexOf(next);
    setMessage(u.stepAnnounce(n + 1, STEPS.length, stepLabels[n]!));
  };

  const pickDeck = (file: File) => {
    setDeck({ name: file.name, type: file.type, size: file.size });
    setDecisions({});
    setAccepted(null);
    void reader.read(file);
  };
  const removeDeck = () => {
    setDeck(null);
    setDecisions({});
    setAccepted(null);
    reader.reset();
  };

  const useExample = () => {
    setForm({
      settore: EXAMPLE_STARTUP_FORM.settore,
      fase: EXAMPLE_STARTUP_FORM.fase,
      regione: EXAMPLE_STARTUP_FORM.regione,
      round: EXAMPLE_STARTUP_FORM.round,
      descrizione: t.matchDemo.exampleDescription,
    });
    setNames({ nome: EXAMPLE_STARTUP_FORM.nome, founder: EXAMPLE_STARTUP_FORM.founder });
    setErrors({});
    setMessage(u.exampleFilled);
  };

  const submitData = (e: FormEvent) => {
    e.preventDefault();
    if (busyReading) {
      setMessage(u.waitReading);
      return;
    }
    if (form.round !== null && form.round <= 0) {
      setErrors({ round: u.roundError });
      return;
    }
    setErrors({});
    go('analisi');
  };

  const finishAnalysis = () => {
    if (hasDeck) {
      go('trovato');
      return;
    }
    setAccepted(null);
    setDraft(draftFrom(draftExtraction(form, null, locale), names));
    go('profilo');
  };

  const applyFindings = () => {
    if (read.status !== 'ready') return;
    const a = applyDecisions(read.findings, decisions, locale);
    setAccepted(a);
    setDraft(draftFrom(draftExtraction(form, a, locale), names));
    go('profilo');
  };

  const confirmProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const core = coreOf(draft);
    if (!core) {
      setErrors({ review: u.reviewError });
      return;
    }
    setErrors({});
    setProfile(ownStartup(core, { nome: draft.nome, founder: draft.founder, oneLiner: draft.oneLiner }, locale));
    const deckUsed = hasDeck ? accepted : null;
    setDeckInfo({ sources: deckSources(core, deckUsed), signals: deckSignals(deckUsed, locale) });
    updateInbox((s) => withProfile(s, core));
    // For the local export: enumerated fields, the confirmed one-liner and the deck signals the founder accepted.
    saveStartupSheet({
      source: 'form',
      core,
      oneLiner: draft.oneLiner,
      team: deckUsed?.team?.value ?? null,
      traction: deckUsed?.traction.map((x) => x.value) ?? [],
    });
    go('match');
  };

  const editProfile = () => {
    if (!draft && profile) {
      setDraft({
        nome: profile.id === 'tu' && profile.nome === own.startupName ? '' : profile.nome,
        founder: profile.founder === own.founder ? '' : profile.founder,
        settore: profile.settore,
        fase: profile.fase,
        regione: profile.regione,
        round: profile.round,
        oneLiner: profile.oneLiner === own.noDescription ? '' : profile.oneLiner,
        fonti: {},
        pagine: {},
      });
    }
    go('profilo');
  };

  const propose = (investorId: string, investorName: string) => {
    if (!profile) return;
    let result: ReturnType<typeof proposeTo> | null = null;
    updateInbox((s, at) => {
      result = proposeTo(withProfile(s, profile), investorId, at);
      return result.ok ? result.store : s;
    });
    const r = result as ReturnType<typeof proposeTo> | null;
    if (!r?.ok) {
      if (r?.reason === 'limit') setMessage(t.match.optin.limitReached(MONTHLY_PROPOSAL_LIMIT));
      return;
    }
    setMessage(u.proposalSent(investorName, MONTHLY_PROPOSAL_LIMIT - counter.used - 1));
  };

  const sourceHint = (k: keyof Extraction): string | undefined => {
    const fonte = draft?.fonti[k];
    if (!fonte) return undefined;
    const page = draft?.pagine[k];
    return fonte === 'deck' && page ? u.sourceDeck(page) : u.source(fonti[fonte]);
  };

  // What the agent's checklist reports for a read deck: pages, then what each step found.
  const agentDetails = (() => {
    if (read.status !== 'ready') return undefined;
    const x = read.findings;
    const a = t.match.ui.agent;
    const found = (keys: ('settore' | 'fase' | 'regione' | 'round' | 'team')[]) =>
      keys.flatMap((k) => {
        const v = x[k];
        return v ? [findingText(k, v, locale)] : [];
      });
    const step2 = found(['settore', 'fase', 'regione']);
    const step3 = [...found(['round', 'team']), ...(x.traction.length ? [a.tractionFound(x.traction.length)] : [])];
    return [a.pagesRead(read.pages), step2.join(' · ') || '—', step3.join(' · ') || '—', a.found(countFindings(x))];
  })();

  const stepIndex = STEPS.indexOf(step);
  const previewTeaser = teaserOf(
    {
      settore: isSettore(form.settore) ? form.settore : 'saas-b2b',
      fase: isFase(form.fase) ? form.fase : 'seed',
      regione: isRegione(form.regione) ? form.regione : 'lombardia',
      round: form.round ?? 0,
      oneLiner: form.descrizione ? form.descrizione.slice(0, ONE_LINER_MAX) : '',
    },
    locale,
  );
  if (!isSettore(form.settore)) previewTeaser.settore = '—';
  if (!isFase(form.fase)) previewTeaser.fase = '—';
  if (!isRegione(form.regione)) previewTeaser.regione = '—';
  if (!form.round) previewTeaser.importo = '—';

  const settoreOptions = optionsOf(SETTORI, L.settore);
  const faseOptions = optionsOf(FASI, L.fase);
  const regioneOptions = optionsOf(REGIONI, L.regione);

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={u.eyebrow} title={<Rich text={u.title} />}>
        <p>{u.lead}</p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container">
          <LiveRegion message={message} />
          {step === 'dati' && <ModeSwitch side="startup" current="form" />}
          <MatchSteps steps={stepLabels} current={stepIndex} label={u.stepsLabel} />

          {step === 'dati' && (
            <div className="mi-flow">
              <form className="card mi-flow-main" onSubmit={submitData} noValidate>
                <div className="mi-card-head">
                  <div>
                    <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                      {u.formTitle}
                    </h2>
                    <p>{u.formLead}</p>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={useExample}>
                    {u.useExample}
                  </button>
                </div>
                <div>
                  <div className="mi-grid-2">
                    <SelectField
                      id={`${id}-settore`}
                      label={u.settore}
                      value={form.settore}
                      placeholder={u.settorePlaceholder}
                      options={settoreOptions}
                      onChange={(v) => setForm((x) => ({ ...x, settore: v }))}
                    />
                    <SelectField
                      id={`${id}-regione`}
                      label={u.regione}
                      value={form.regione}
                      placeholder={u.regionePlaceholder}
                      options={regioneOptions}
                      onChange={(v) => setForm((x) => ({ ...x, regione: v }))}
                    />
                  </div>
                  <SegmentedField
                    id={`${id}-fase`}
                    legend={u.fase}
                    options={faseOptions}
                    value={form.fase}
                    onChange={(v) => setForm((x) => ({ ...x, fase: v }))}
                  />
                  <EuroField
                    id={`${id}-round`}
                    label={u.round}
                    value={form.round}
                    onChange={(v) => setForm((x) => ({ ...x, round: v }))}
                    hint={u.roundHint}
                    error={errors.round}
                  />
                  <div className="field mi-field">
                    <div className="mi-counter-line">
                      <label htmlFor={`${id}-descr`}>{u.descr}</label>
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
                      onChange={(e) => setForm((x) => ({ ...x, descrizione: e.target.value }))}
                    />
                    <p className="field-hint" id={`${id}-descr-hint`}>
                      {u.descrHint}
                    </p>
                  </div>
                  <DeckDropzone id={`${id}-deck`} file={deck} read={read} onPick={pickDeck} onRemove={removeDeck} />
                </div>
                <div className="mi-form-actions">
                  <p className="field-hint">{busyReading ? u.waitReading : u.nothingLeaves}</p>
                  <button type="submit" className="btn btn-navy" aria-disabled={busyReading || undefined}>
                    {hasDeck ? u.submitDeck : u.submitNoDeck} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
              <aside className="mi-flow-aside" aria-labelledby={`${id}-preview`}>
                <div>
                  <h2 className="mi-aside-title" id={`${id}-preview`}>
                    {u.previewTitle}
                  </h2>
                  <p className="mi-aside-text">{u.previewText}</p>
                  <TeaserCard teaser={previewTeaser} label={u.previewLabel} />
                </div>
              </aside>
            </div>
          )}

          {step === 'analisi' && (
            <div className="card mi-flow-narrow">
              <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                {hasDeck ? u.readingDeck : u.preparing}
              </h2>
              <AgentProcessing hasDeck={hasDeck} onDone={finishAnalysis} details={agentDetails} />
            </div>
          )}

          {step === 'trovato' && read.status === 'ready' && (
            <DeckFindingsReview
              findings={read.findings}
              form={form}
              decisions={decisions}
              onDecisions={setDecisions}
              onBack={() => go('dati')}
              onContinue={applyFindings}
              headingRef={headingRef}
            />
          )}

          {step === 'profilo' && draft && (
            <form className="card mi-flow-narrow" onSubmit={confirmProfile} noValidate>
              <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                {hasDeck ? u.reviewTitleDeck : u.reviewTitle}
              </h2>
              <p className="notice mi-review-note">{u.reviewNote}</p>
              {errors.review && (
                <p className="mi-error mi-error-summary" role="alert">
                  {errors.review}
                </p>
              )}
              <div className="mi-grid-2">
                <div className="field mi-field">
                  <label htmlFor={`${id}-nome`}>
                    {u.startupName} <span className="mi-muted">{u.optional}</span>
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
                    {u.yourName} <span className="mi-muted">{u.optional}</span>
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
              <p className="field-hint mi-legend-hint">{u.namesHint}</p>
              <div className="mi-grid-2">
                <SelectField
                  id={`${id}-r-settore`}
                  label={u.settore}
                  value={draft.settore}
                  options={settoreOptions}
                  onChange={(v) => setDraft({ ...draft, settore: v })}
                  hint={sourceHint('settore')}
                />
                <SelectField
                  id={`${id}-r-regione`}
                  label={u.regione}
                  value={draft.regione}
                  options={regioneOptions}
                  onChange={(v) => setDraft({ ...draft, regione: v })}
                  hint={sourceHint('regione')}
                />
              </div>
              <SegmentedField
                id={`${id}-r-fase`}
                legend={u.fase}
                options={faseOptions}
                value={draft.fase}
                onChange={(v) => setDraft({ ...draft, fase: v })}
              />
              {draft.fonti.fase && <p className="field-hint mi-legend-hint">{sourceHint('fase')}</p>}
              <EuroField
                id={`${id}-r-round`}
                label={u.round}
                value={draft.round}
                onChange={(v) => setDraft({ ...draft, round: v })}
                hint={sourceHint('round')}
              />
              <div className="field mi-field">
                <div className="mi-counter-line">
                  <label htmlFor={`${id}-r-line`}>{u.oneLiner}</label>
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
                  {u.oneLinerHint}
                  {draft.fonti.oneLiner && (draft.fonti.oneLiner === 'deck' && draft.pagine.oneLiner ? ` ${u.sourceDeck(draft.pagine.oneLiner)}.` : u.oneLinerSource(fonti[draft.fonti.oneLiner]))}
                </p>
              </div>
              {hasDeck && accepted && (accepted.team || accepted.traction.length > 0) && (
                <div className="mi-extras">
                  <p className="mi-extras-title">
                    {u.extrasTitle} <span className="mi-muted">{u.extrasNote}</span>
                  </p>
                  <ul>
                    {[...(accepted.team ? [{ value: deckSignals({ team: accepted.team, traction: [] }, locale)[0]!, page: accepted.team.page }] : []), ...accepted.traction].map(
                      (x) => (
                        <li key={x.value}>
                          {x.value} <span className="mi-muted">({t.match.ui.findings.page(x.page)})</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
              <div className="mi-form-actions">
                <button type="button" className="btn btn-text" onClick={() => go(hasDeck ? 'trovato' : 'dati')}>
                  <span aria-hidden="true">←</span> {hasDeck ? t.match.ui.findings.title : u.back}
                </button>
                <button type="submit" className="btn btn-navy">
                  {u.confirm} <span aria-hidden="true">→</span>
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
              deckInfo={deckInfo}
            />
          )}

          <Disclaimer />
          <CtaPanel campaign="match" title={u.ctaTitle} text={u.ctaText} />
        </div>
      </section>
    </>
  );

}

interface ResultsProps {
  profile: StartupProfile;
  counter: Counter;
  proposed: string[];
  onPropose: (id: string, name: string) => void;
  onEdit: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
  deckInfo: DeckInfo;
}

function Results({ profile, counter, proposed, onPropose, onEdit, headingRef, deckInfo }: ResultsProps) {
  const { locale, t, f, path } = useI18n();
  const u = t.match.ui.startup;
  const L = labelsFor(locale);
  const { matches, excluded } = matchInvestors(profile, demoInvestors(locale), locale);
  const can = canPropose(counter);
  const optInLink = (investorId: string) => ({
    pathname: path('matchOptIn'),
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
          <ul className="mi-filters" aria-label={u.profileLabel}>
            <li className="mi-filter">
              <span>{u.chipSettore}</span> {L.settore[profile.settore]}
            </li>
            <li className="mi-filter">
              <span>{u.chipFase}</span> {L.fase[profile.fase]}
            </li>
            <li className="mi-filter">
              <span>{u.chipRegione}</span> {L.regione[profile.regione]}
            </li>
            <li className="mi-filter">
              <span>{u.chipRound}</span> {f.euro(profile.round)}
            </li>
            <li>
              <button type="button" className="btn btn-text btn-sm" onClick={onEdit}>
                {u.editProfile}
              </button>
            </li>
          </ul>
        </div>
        <ProposalCounter counter={counter} limit={MONTHLY_PROPOSAL_LIMIT} />
      </div>

      <div className="mi-results-head">
        <h2 tabIndex={-1} ref={headingRef}>
          {u.resultsTitle(matches.length)}
        </h2>
        <DemoBadge />
        <ExportLink kind="startup" name={profile.nome !== t.match.own.startupName ? profile.nome : null} />
      </div>

      {Object.keys(deckInfo.sources).length > 0 && (
        <p className="notice mi-deck-used">{u.deckUsed(sourcesSummary(deckInfo.sources, locale))}</p>
      )}

      {matches.length === 0 ? (
        <div className="card mi-empty">
          <p>{u.empty}</p>
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
                meta={`${L.tipo[item.tipo]}${item.sede ? u.based(L.regione[item.sede]) : ''}`}
                evaluation={{ ...evaluation, reasons: annotateReasons(evaluation.reasons, deckInfo.sources, locale) }}
                footnote={
                  deckInfo.signals.length > 0 ? <p className="mi-deck-signals">{u.deckSignals(deckInfo.signals.join(' · '))}</p> : undefined
                }
                actions={
                  sent ? (
                    <>
                      <span className="mi-sent">{u.sent}</span>
                      <Link to={path('matchRequests')} className="btn btn-text btn-sm">
                        {t.directory.dir.requestsLink}
                      </Link>
                      <Link to={optInLink(item.id)} state={optInState} className="btn btn-outline btn-sm">
                        {u.simulate} <span aria-hidden="true">→</span>
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-navy btn-sm"
                      disabled={!can}
                      onClick={() => onPropose(item.id, item.nome)}
                    >
                      {u.propose}
                      <span className="sr-only">{u.proposeSr(item.nome)}</span>
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
      {!can && <p className="notice mi-board-note">{t.match.optin.limitReached(MONTHLY_PROPOSAL_LIMIT)}</p>}
      <ExcludedList
        summary={t.match.ui.excluded.investors(excluded.length)}
        items={excluded.map((x) => ({ id: x.item.id, name: x.item.nome, whyNot: x.evaluation.whyNot }))}
      />
      <ScoreExplainer />
    </div>
  );
}
