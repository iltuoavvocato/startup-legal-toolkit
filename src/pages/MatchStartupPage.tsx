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
import { demoInvestors, EXAMPLE_STARTUP_FORM } from '../data/matchDemo';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import { fonteLabels, mockExtract, startupFlowSteps, type DeckMeta, type Extraction, type Fonte, type StartupForm } from '../lib/deck';
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
import { canPropose, consume, counterFor, monthKey, MONTHLY_PROPOSAL_LIMIT, teaserOf } from '../lib/optin';

type Step = 'dati' | 'analisi' | 'profilo' | 'match';
const STEPS: Step[] = ['dati', 'analisi', 'profilo', 'match'];
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
  const { locale, t } = useI18n();
  const u = t.match.ui.startup;
  const own = t.match.own;
  const L = labelsFor(locale);
  const fonti = fonteLabels(locale);
  const [initial] = useState(() => startupFromQuery(readQuery()));
  const [step, setStep] = useState<Step>(initial ? 'match' : 'dati');
  const [form, setForm] = useState<StartupForm>(EMPTY_FORM);
  const [deck, setDeck] = useState<DeckMeta | null>(null);
  const [names, setNames] = useState({ nome: '', founder: '' });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [profile, setProfile] = useState<StartupProfile | null>(() =>
    initial ? ownStartup(initial, undefined, locale) : null,
  );
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

  const stepLabels = startupFlowSteps(locale, Boolean(deck));

  const go = (next: Step) => {
    moved.current = true;
    setStep(next);
    const n = STEPS.indexOf(next);
    setMessage(u.stepAnnounce(n + 1, STEPS.length, stepLabels[n]!));
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
    if (form.round !== null && form.round <= 0) {
      setErrors({ round: u.roundError });
      return;
    }
    setErrors({});
    go('analisi');
  };

  const finishAnalysis = () => {
    setDraft(draftFrom(mockExtract(deck, form, locale), names));
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
    setProposed([]);
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
      });
    }
    go('profilo');
  };

  const propose = (investorId: string, investorName: string) => {
    const r = consume(counter, MONTHLY_PROPOSAL_LIMIT, locale);
    if (!r.ok) {
      setMessage(r.reason);
      return;
    }
    setCounter(r.counter);
    setProposed((p) => [...p, investorId]);
    setMessage(u.proposalSent(investorName, MONTHLY_PROPOSAL_LIMIT - r.counter.used));
  };

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
                  <DeckDropzone id={`${id}-deck`} file={deck} onChange={setDeck} />
                </div>
                <div className="mi-form-actions">
                  <p className="field-hint">{u.nothingLeaves}</p>
                  <button type="submit" className="btn btn-navy">
                    {deck ? u.submitDeck : u.submitNoDeck} <span aria-hidden="true">→</span>
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
                {deck ? u.readingDeck : u.preparing}
              </h2>
              <AgentProcessing hasDeck={Boolean(deck)} onDone={finishAnalysis} />
            </div>
          )}

          {step === 'profilo' && draft && (
            <form className="card mi-flow-narrow" onSubmit={confirmProfile} noValidate>
              <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                {deck ? u.reviewTitleDeck : u.reviewTitle}
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
                  hint={draft.fonti.settore ? u.source(fonti[draft.fonti.settore]) : undefined}
                />
                <SelectField
                  id={`${id}-r-regione`}
                  label={u.regione}
                  value={draft.regione}
                  options={regioneOptions}
                  onChange={(v) => setDraft({ ...draft, regione: v })}
                  hint={draft.fonti.regione ? u.source(fonti[draft.fonti.regione]) : undefined}
                />
              </div>
              <SegmentedField
                id={`${id}-r-fase`}
                legend={u.fase}
                options={faseOptions}
                value={draft.fase}
                onChange={(v) => setDraft({ ...draft, fase: v })}
              />
              {draft.fonti.fase && <p className="field-hint mi-legend-hint">{u.source(fonti[draft.fonti.fase])}</p>}
              <EuroField
                id={`${id}-r-round`}
                label={u.round}
                value={draft.round}
                onChange={(v) => setDraft({ ...draft, round: v })}
                hint={draft.fonti.round ? u.source(fonti[draft.fonti.round]) : undefined}
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
                  {draft.fonti.oneLiner && u.oneLinerSource(fonti[draft.fonti.oneLiner])}
                </p>
              </div>
              <div className="mi-form-actions">
                <button type="button" className="btn btn-text" onClick={() => go('dati')}>
                  <span aria-hidden="true">←</span> {u.back}
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
  counter: ReturnType<typeof counterFor>;
  proposed: string[];
  onPropose: (id: string, name: string) => void;
  onEdit: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
}

function Results({ profile, counter, proposed, onPropose, onEdit, headingRef }: ResultsProps) {
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
      </div>

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
                evaluation={evaluation}
                actions={
                  sent ? (
                    <>
                      <span className="mi-sent">{u.sent}</span>
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
