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
import { ModeSwitch } from '../components/match/ModeSwitch';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ScoreExplainer } from '../components/match/ScoreExplainer';
import { SelectField } from '../components/match/SelectField';
import { TeaserCard } from '../components/match/TeaserCard';
import { demoStartups, EXAMPLE_INVESTOR_FORM } from '../data/matchDemo';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import { matchStartups } from '../lib/matching';
import { ownInvestor, thesisErrors, thesisFromQuery, thesisToQuery, type Thesis } from '../lib/matchQuery';
import {
  AREE,
  FASI,
  isArea,
  isFase,
  isRegione,
  isSettore,
  labelsFor,
  optionsOf,
  REGIONI,
  SETTORI,
} from '../lib/matchTaxonomy';
import { teaserOf } from '../lib/optin';

const ITALIA = 'italia';

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
  const { locale, t } = useI18n();
  const u = t.match.ui.investor;
  const L = labelsFor(locale);
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

  const errors = showErrors ? thesisErrors(form, locale) : {};

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = thesisOf(form);
    if (!next) {
      setShowErrors(true);
      setMessage(u.checkFields);
      return;
    }
    moved.current = true;
    setThesis(next);
    setMessage(u.stepAnnounce(2, u.steps.length, u.steps[1]!.toLowerCase()));
  };

  const edit = () => {
    moved.current = true;
    setThesis(null);
    setMessage(u.stepAnnounce(1, u.steps.length, u.steps[0]!.toLowerCase()));
  };

  const useExample = () => {
    setForm({
      settori: [...EXAMPLE_INVESTOR_FORM.settori],
      fasi: [...EXAMPLE_INVESTOR_FORM.fasi],
      ticketMin: EXAMPLE_INVESTOR_FORM.ticketMin,
      ticketMax: EXAMPLE_INVESTOR_FORM.ticketMax,
      aree: [...EXAMPLE_INVESTOR_FORM.aree],
      sede: EXAMPLE_INVESTOR_FORM.sede,
      nome: EXAMPLE_INVESTOR_FORM.nome,
    });
    setShowErrors(false);
    setMessage(t.match.ui.startup.exampleFilled);
  };

  const setAree = (next: string[]) => {
    // "Tutta Italia" excludes the single areas and vice versa.
    const added = next.find((v) => !form.aree.includes(v));
    setForm((f) => ({ ...f, aree: added === ITALIA ? [ITALIA] : next.filter((v) => v !== ITALIA) }));
  };

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={u.eyebrow} title={<Rich text={u.title} />}>
        <p>{u.lead}</p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container">
          <LiveRegion message={message} />
          {!thesis && <ModeSwitch side="investor" current="form" />}
          <MatchSteps steps={u.steps} current={step} label={t.match.ui.startup.stepsLabel} />

          {!thesis ? (
            <form className="card mi-flow-narrow" onSubmit={submit} noValidate>
              <div className="mi-card-head">
                <div>
                  <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
                    {u.formTitle}
                  </h2>
                  <p>{u.formLead}</p>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={useExample}>
                  {t.match.ui.startup.useExample}
                </button>
              </div>
              {showErrors && Object.keys(errors).length > 0 && (
                <p className="mi-error mi-error-summary" role="alert">
                  {u.missing(Object.values(errors).join(' '))}
                </p>
              )}
              <ChoiceChips
                id={`${id}-settori`}
                legend={u.settori}
                hint={u.settoriHint}
                options={optionsOf(SETTORI, L.settore)}
                selected={form.settori}
                onChange={(v) => setForm((f) => ({ ...f, settori: v }))}
                error={errors.settori}
              />
              <ChoiceChips
                id={`${id}-fasi`}
                legend={u.fasi}
                options={optionsOf(FASI, L.fase)}
                selected={form.fasi}
                onChange={(v) => setForm((f) => ({ ...f, fasi: v }))}
                error={errors.fasi}
              />
              <div className="mi-grid-2">
                <EuroField
                  id={`${id}-min`}
                  label={u.ticketMin}
                  value={form.ticketMin}
                  onChange={(v) => setForm((f) => ({ ...f, ticketMin: v }))}
                  error={errors.ticket && !form.ticketMin ? errors.ticket : undefined}
                />
                <EuroField
                  id={`${id}-max`}
                  label={u.ticketMax}
                  value={form.ticketMax}
                  onChange={(v) => setForm((f) => ({ ...f, ticketMax: v }))}
                  error={errors.ticket && form.ticketMin ? errors.ticket : undefined}
                />
              </div>
              <ChoiceChips
                id={`${id}-aree`}
                legend={u.aree}
                options={[...optionsOf(AREE, L.area), { value: ITALIA, label: t.match.taxonomy.allItaly }]}
                selected={form.aree}
                onChange={setAree}
                error={errors.aree}
              />
              <div className="mi-grid-2">
                <SelectField
                  id={`${id}-sede`}
                  label={u.sede}
                  value={form.sede}
                  placeholder={u.sedePlaceholder}
                  options={optionsOf(REGIONI, L.regione)}
                  onChange={(v) => setForm((f) => ({ ...f, sede: v }))}
                  hint={u.sedeHint}
                />
                <div className="field mi-field">
                  <label htmlFor={`${id}-nome`}>{u.name}</label>
                  <input
                    id={`${id}-nome`}
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mi-form-actions">
                <p className="field-hint">{t.match.ui.startup.nothingLeaves}</p>
                <button type="submit" className="btn btn-navy">
                  {u.submit} <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          ) : (
            <InvestorResults thesis={thesis} nome={form.nome} onEdit={edit} headingRef={headingRef} />
          )}

          <Disclaimer />
          <CtaPanel campaign="match" title={u.ctaTitle} text={u.ctaText} />
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
  const { locale, t, f, path } = useI18n();
  const u = t.match.ui.investor;
  const L = labelsFor(locale);
  const investor = ownInvestor(thesis, { nome }, locale);
  const { matches, excluded } = matchStartups(investor, demoStartups(locale), locale);
  const aree = thesis.aree === 'italia' ? t.match.taxonomy.allItaly : thesis.aree.map((a) => L.area[a]).join(', ');

  return (
    <div>
      <div className="mi-results-bar">
        <ul className="mi-filters" aria-label={u.thesisLabel}>
          <li className="mi-filter">
            <span>{u.chipSettori}</span> {thesis.settori.map((s) => L.settore[s]).join(', ')}
          </li>
          <li className="mi-filter">
            <span>{u.chipFasi}</span> {thesis.fasi.map((x) => L.fase[x]).join(', ')}
          </li>
          <li className="mi-filter">
            <span>{u.chipTicket}</span> {f.euro(thesis.ticketMin)}–{f.euro(thesis.ticketMax)}
          </li>
          <li className="mi-filter">
            <span>{u.chipAree}</span> {aree}
          </li>
          {thesis.sede && (
            <li className="mi-filter">
              <span>{u.chipSede}</span> {L.regione[thesis.sede]}
            </li>
          )}
          <li>
            <button type="button" className="btn btn-text btn-sm" onClick={onEdit}>
              {u.editThesis}
            </button>
          </li>
        </ul>
      </div>

      <div className="mi-results-head">
        <h2 tabIndex={-1} ref={headingRef}>
          {u.resultsTitle(matches.length)}
        </h2>
        <DemoBadge />
      </div>
      <p className="mi-aside-text">{u.anonymousNote}</p>

      {matches.length === 0 ? (
        <div className="card mi-empty">
          <p>{u.empty}</p>
        </div>
      ) : (
        <ol className="mi-matches">
          {matches.map(({ item, evaluation }, i) => (
            <MatchCard
              key={item.id}
              rank={i + 1}
              title={u.startupTitle(L.settore[item.settore], L.regione[item.regione])}
              meta={u.startupMeta(L.fase[item.fase], f.euro(item.round))}
              evaluation={evaluation}
              actions={
                <Link
                  to={{
                    pathname: path('matchOptIn'),
                    search: `?${new URLSearchParams({ s: item.id, i: 'tu', ...thesisToQuery(thesis) }).toString()}`,
                  }}
                  state={{ investor: { nome: investor.nome, referente: investor.referente }, sent: true }}
                  className="btn btn-outline btn-sm"
                >
                  {u.simulate} <span aria-hidden="true">→</span>
                </Link>
              }
            >
              <TeaserCard teaser={teaserOf(item, locale)} />
            </MatchCard>
          ))}
        </ol>
      )}
      <ExcludedList
        summary={t.match.ui.excluded.startups(excluded.length)}
        items={excluded.map((x) => ({
          id: x.item.id,
          name: u.startupTitle(L.settore[x.item.settore], L.regione[x.item.regione]),
          whyNot: x.evaluation.whyNot,
        }))}
      />
      <ScoreExplainer />
    </div>
  );
}
