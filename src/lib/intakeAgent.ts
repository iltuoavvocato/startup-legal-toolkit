// Guided intake ("Parla con l'agente" / "Talk to the agent"): a deterministic, rule-based conversation for founders
// and investors. No AI, no network. The state holds data only (question ids, enumerated values, amounts); the UI and
// the explanation helpers below turn it into Italian or English text at render time, so the same conversation can be
// shown in either language.
import { FORMATTERS } from '../i18n/format';
import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';
import type { ExplainCtx } from '../i18n/messages/intake';
import { toOneLiner } from './deck';
import type { DeckFindings, TractionSignal } from './deckExtract';
import { tractionText } from './deckSignals';
import {
  AREA_POINTS,
  coverage,
  FASE_POINTS,
  LEAD_COVERAGE,
  matchInvestors,
  matchStartups,
  SETTORE_POINTS,
  type Evaluation,
  type MatchResult,
} from './matching';
import { ownInvestor, ownStartup, type StartupCore, type Thesis } from './matchQuery';
import {
  AREA_DI,
  AREE,
  FASI,
  isArea,
  isFase,
  isRegione,
  isSettore,
  labelsFor,
  ONE_LINER_MAX,
  REGIONI,
  SETTORI,
  type Area,
  type Fase,
  type Investor,
  type Regione,
  type Settore,
  type StartupProfile,
} from './matchTaxonomy';
import type { RequestView } from './inbox';
import { MAX_DECK_PAGES, type DeckReadErrorCode } from './pdfText';

export type IntakeMode = 'startup' | 'investor';

// ---------------------------------------------------------------- questions

/** Deck findings the founder confirms one by one ("Ho trovato nel deck… confermi?"). */
export const DECK_KEYS = ['settore', 'fase', 'round', 'regione', 'oneLiner', 'extras'] as const;
export type DeckKey = (typeof DECK_KEYS)[number];
export type DeckQuestion = `deck:${DeckKey}`;

export type StartupQuestion = 'deck' | 'settore' | 'fase' | 'round' | 'roundCheck' | 'regione' | 'oneLiner' | 'confirm';
export type InvestorQuestion = 'settori' | 'fasi' | 'ticket' | 'aree' | 'sede' | 'confirm';
export type QuestionId = StartupQuestion | InvestorQuestion | DeckQuestion;

/** Questions whose answer can be changed later with "Modifica" / "Edit". */
export const EDITABLE: readonly QuestionId[] = ['settore', 'fase', 'round', 'regione', 'oneLiner', 'settori', 'fasi', 'ticket', 'aree', 'sede'];

export type InputKind = 'deck' | 'single' | 'multi' | 'amount' | 'range' | 'text' | 'choice' | 'confirm';

export interface QuestionSpec {
  id: QuestionId;
  kind: InputKind;
  /** Option values for chips (single, multi, choice). */
  options: readonly string[];
  /** Can be skipped ("Salta"). */
  optional: boolean;
  /** Multi-select value that excludes every other one ("Tutta Italia"). */
  exclusive?: string;
  maxLength?: number;
}

export const ITALIA = 'italia';
export const DECK_CHOICES = ['accept', 'edit', 'ignore'] as const;
export type DeckChoice = (typeof DECK_CHOICES)[number];

export function questionSpec(q: QuestionId): QuestionSpec {
  const base = { id: q, optional: false, options: [] as readonly string[] };
  switch (q) {
    case 'deck':
      return { ...base, kind: 'deck', options: ['skip'] };
    case 'settore':
      return { ...base, kind: 'single', options: SETTORI };
    case 'fase':
      return { ...base, kind: 'single', options: FASI };
    case 'regione':
      return { ...base, kind: 'single', options: REGIONI };
    case 'round':
      return { ...base, kind: 'amount' };
    case 'roundCheck':
      return { ...base, kind: 'choice', options: ['ok', 'change'] };
    case 'oneLiner':
      return { ...base, kind: 'text', optional: true, maxLength: ONE_LINER_MAX };
    case 'confirm':
      return { ...base, kind: 'confirm', options: ['go'] };
    case 'settori':
      return { ...base, kind: 'multi', options: SETTORI };
    case 'fasi':
      return { ...base, kind: 'multi', options: FASI };
    case 'ticket':
      return { ...base, kind: 'range' };
    case 'aree':
      return { ...base, kind: 'multi', options: [...AREE, ITALIA], exclusive: ITALIA };
    case 'sede':
      return { ...base, kind: 'single', options: REGIONI, optional: true };
    case 'deck:oneLiner':
    case 'deck:extras':
      return { ...base, kind: 'choice', options: q === 'deck:extras' ? ['accept', 'ignore'] : DECK_CHOICES };
    default:
      return { ...base, kind: 'choice', options: DECK_CHOICES };
  }
}

// ---------------------------------------------------------------- state

export interface Range {
  min: number;
  max: number;
}

export interface Answers {
  /** 'read' once a deck was picked (read or failed), 'skip' when the founder continues without one. */
  deck?: 'read' | 'skip';
  settore?: Settore;
  fase?: Fase;
  round?: number;
  /** The founder confirmed a round that is unusual for the stage. */
  roundChecked?: boolean;
  regione?: Regione;
  /** null = skipped. */
  oneLiner?: string | null;
  settori?: Settore[];
  fasi?: Fase[];
  ticket?: Range;
  aree?: Area[] | 'italia';
  /** null = skipped. */
  sede?: Regione | null;
}

/** Deck page each profile field was taken from (only while the value still comes from the deck). */
export type Sources = Partial<Record<'settore' | 'fase' | 'round' | 'regione' | 'oneLiner', number>>;

/** Team size or traction accepted from the deck: structured values, rendered in the current language. */
export type DeckSignal = { kind: 'team'; count: number; page: number } | { kind: 'traction'; signal: TractionSignal; page: number };

export interface DeckState {
  status: 'none' | 'reading' | 'read' | 'error';
  pages: number;
  errorCode?: DeckReadErrorCode;
  /** In memory only: never written to storage (see toStorable). */
  findings: DeckFindings | null;
  decisions: Partial<Record<DeckKey, DeckChoice>>;
  signals: DeckSignal[];
}

/** What the founder saw in a deck question; kept with the message so the transcript survives a reload. */
export interface FindingSnapshot {
  key: DeckKey;
  /** Enumerated id, amount, tagline text (dropped on storage unless accepted) or the extras list. */
  value: string | number | DeckSignal[] | null;
  page: number;
  confidence: number;
  /** The deck text the finding comes from: memory only, never stored. */
  snippet?: string;
  /** City as written in the deck ("Bari"), for regions. */
  place?: string;
  /** Non-euro currency symbol for the round. */
  currency?: string;
  /** The founder had already answered differently. */
  conflict?: string | number;
}

export type AgentBody =
  | { kind: 'hello' }
  | {
      kind: 'ask';
      q: QuestionId;
      edit?: boolean;
      finding?: FindingSnapshot;
      /** Stage the round suggestions are based on. */
      fase?: Fase | null;
      /** Stages the ticket suggestions are based on. */
      fasi?: Fase[];
      /** Round being double-checked (roundCheck). */
      round?: number;
      /** Value proposed by the deck when the founder chose "Modifica". */
      suggested?: string | number;
    }
  | { kind: 'deckReading' }
  | { kind: 'deckRead'; pages: number; found: number }
  | { kind: 'deckError'; code: DeckReadErrorCode; pages?: number }
  | { kind: 'results'; count: number; excluded: number; fromDeck: (keyof Sources)[]; signals: number }
  | { kind: 'match'; id: string; rank: number }
  | { kind: 'wrap'; count: number; excluded: number }
  | { kind: 'excluded' }
  | { kind: 'restored' };

export type AnswerValue = string | string[] | number | Range | null;

export type UserBody =
  | { kind: 'answer'; q: QuestionId; value: AnswerValue }
  | { kind: 'deckPicked' }
  | { kind: 'excluded' };

export type Message = { id: number; from: 'agent'; body: AgentBody } | { id: number; from: 'user'; body: UserBody };

export type ErrorKey = 'required' | 'positive' | 'tooBig' | 'order' | 'tooLong' | 'invalid';

export interface IntakeState {
  version: 1;
  mode: IntakeMode;
  phase: 'intake' | 'results';
  answers: Answers;
  sources: Sources;
  deck: DeckState;
  /** Question on screen (null while a deck is being read and in the results phase). */
  current: QuestionId | null;
  /** The question being changed with "Modifica". */
  editing: QuestionId | null;
  /** Validation error on the current question. */
  error: ErrorKey | null;
  messages: Message[];
  nextId: number;
  /**
   * Founder: investors set aside without proposing. Proposals and answers (both modes) are not kept here: they live in
   * the shared requests inbox (inbox.ts, agentInbox.ts), with the same demo clock as the other matching pages.
   */
  passed: string[];
}

export type Action =
  | { type: 'ANSWER'; value: AnswerValue }
  | { type: 'SKIP' }
  | { type: 'EDIT'; q: QuestionId }
  | { type: 'BACK' }
  | { type: 'DECK_START' }
  | { type: 'DECK_READY'; pages: number; findings: DeckFindings }
  | { type: 'DECK_ERROR'; code: DeckReadErrorCode; pages?: number }
  | { type: 'PASS'; id: string }
  | { type: 'SHOW_EXCLUDED' }
  | { type: 'RESTART' };

/** Matches already computed for the current answers (ids, best first), passed in by the caller. */
export interface ResultIds {
  matches: readonly string[];
  excluded: readonly string[];
}

const EMPTY_DECK: DeckState = { status: 'none', pages: 0, findings: null, decisions: {}, signals: [] };

export function initIntake(mode: IntakeMode): IntakeState {
  const s: IntakeState = {
    version: 1,
    mode,
    phase: 'intake',
    answers: {},
    sources: {},
    deck: EMPTY_DECK,
    current: null,
    editing: null,
    error: null,
    messages: [],
    nextId: 1,
    passed: [],
  };
  return advance(agent(s, { kind: 'hello' }));
}

function agent(s: IntakeState, ...bodies: AgentBody[]): IntakeState {
  const messages = bodies.map((body, k): Message => ({ id: s.nextId + k, from: 'agent', body }));
  return { ...s, messages: [...s.messages, ...messages], nextId: s.nextId + messages.length };
}

function user(s: IntakeState, body: UserBody): IntakeState {
  return { ...s, messages: [...s.messages, { id: s.nextId, from: 'user', body }], nextId: s.nextId + 1 };
}

// ---------------------------------------------------------------- rules

/** Typical round sizes per stage (placeholders): outside them the agent asks for a confirmation. */
export const TYPICAL_ROUND: Record<Fase, Range> = {
  'pre-seed': { min: 50_000, max: 1_500_000 },
  seed: { min: 150_000, max: 5_000_000 },
  'serie-a': { min: 1_000_000, max: 30_000_000 },
};

/** Round sizes offered as chips once the stage is known. */
export function roundSuggestions(fase: Fase | null | undefined): number[] {
  switch (fase) {
    case 'pre-seed':
      return [150_000, 300_000, 500_000];
    case 'seed':
      return [500_000, 1_000_000, 2_000_000];
    case 'serie-a':
      return [3_000_000, 5_000_000, 10_000_000];
    default:
      return [300_000, 500_000, 1_000_000];
  }
}

const TICKETS_BY_FASE: Record<Fase, Range[]> = {
  'pre-seed': [
    { min: 10_000, max: 50_000 },
    { min: 25_000, max: 100_000 },
  ],
  seed: [
    { min: 50_000, max: 250_000 },
    { min: 100_000, max: 500_000 },
  ],
  'serie-a': [
    { min: 250_000, max: 1_000_000 },
    { min: 500_000, max: 2_000_000 },
  ],
};

/** Ticket ranges offered as chips for the chosen stages (in stage order, at most four). */
export function ticketSuggestions(fasi: readonly Fase[] | undefined): Range[] {
  const chosen = FASI.filter((f) => fasi?.includes(f));
  const list = (chosen.length ? chosen : (['pre-seed', 'seed'] as Fase[])).flatMap((f) => TICKETS_BY_FASE[f]);
  return list.slice(0, 4);
}

export function isUnusualRound(fase: Fase | undefined, round: number | undefined): boolean {
  if (!fase || !round) return false;
  const r = TYPICAL_ROUND[fase];
  return round < r.min || round > r.max;
}

export const MAX_AMOUNT = 1_000_000_000;

const sameValue = (a: unknown, b: unknown) => a !== undefined && a === b;

function findingValue(s: IntakeState, k: DeckKey): string | number | null {
  const f = s.deck.findings;
  if (!f) return null;
  switch (k) {
    case 'settore':
      return f.settore?.value ?? null;
    case 'fase':
      return f.fase?.value ?? null;
    case 'round':
      return f.round?.value ?? null;
    case 'regione':
      return f.regione?.value ?? null;
    case 'oneLiner':
      return f.tagline ? toOneLiner(f.tagline.value) : null;
    case 'extras':
      return null;
  }
}

function extrasOf(f: DeckFindings): DeckSignal[] {
  return [
    ...(f.team ? [{ kind: 'team' as const, count: f.team.value, page: f.team.page }] : []),
    ...f.traction.map((t) => ({ kind: 'traction' as const, signal: t.value, page: t.page })),
  ];
}

/** Whether the founder still has to confirm this deck finding. Agreeing answers need no confirmation. */
function needsDeckConfirm(s: IntakeState, k: DeckKey): boolean {
  const f = s.deck.findings;
  if (!f || s.deck.status !== 'read' || s.deck.decisions[k]) return false;
  if (k === 'extras') return extrasOf(f).length > 0;
  const v = findingValue(s, k);
  if (v === null) return false;
  return !sameValue(s.answers[k], v);
}

function isAnswered(s: IntakeState, q: QuestionId): boolean {
  const a = s.answers;
  switch (q) {
    case 'deck':
      return a.deck !== undefined;
    case 'roundCheck':
      return a.roundChecked === true;
    case 'confirm':
      return s.phase === 'results';
    default:
      if (q.startsWith('deck:')) return s.deck.decisions[q.slice(5) as DeckKey] !== undefined;
      return a[q as keyof Answers] !== undefined;
  }
}

/** The questions for the current answers, in order. Answered ones are skipped by nextQuestion(). */
export function plan(s: IntakeState): QuestionId[] {
  if (s.mode === 'investor') return ['settori', 'fasi', 'ticket', 'aree', 'sede', 'confirm'];
  const deckQs = DECK_KEYS.filter((k) => needsDeckConfirm(s, k)).map((k): QuestionId => `deck:${k}`);
  return [
    'deck',
    ...deckQs,
    'settore',
    'fase',
    'round',
    ...(isUnusualRound(s.answers.fase, s.answers.round) ? (['roundCheck'] as const) : []),
    'regione',
    'oneLiner',
    'confirm',
  ];
}

export function nextQuestion(s: IntakeState): QuestionId | null {
  if (s.deck.status === 'reading' || s.phase === 'results') return null;
  return plan(s).find((q) => !isAnswered(s, q)) ?? null;
}

function snapshot(s: IntakeState, k: DeckKey): FindingSnapshot | undefined {
  const f = s.deck.findings;
  if (!f) return undefined;
  const conflict = k !== 'extras' && k !== 'oneLiner' ? s.answers[k] : undefined;
  if (k === 'extras') {
    const list = extrasOf(f);
    return list.length ? { key: k, value: list, page: list[0]!.page, confidence: 1 } : undefined;
  }
  const finding = k === 'oneLiner' ? f.tagline : f[k];
  if (!finding) return undefined;
  const extra = finding as { place?: string; currency?: string };
  return {
    key: k,
    value: findingValue(s, k),
    page: finding.page,
    confidence: finding.confidence,
    snippet: finding.snippet,
    ...(extra.place ? { place: extra.place } : {}),
    ...(extra.currency ? { currency: extra.currency } : {}),
    ...(conflict !== undefined ? { conflict } : {}),
  };
}

/** Asks the next question if it changed (logging it as an agent message). */
function advance(s: IntakeState): IntakeState {
  const next = nextQuestion(s);
  if (next === null || (next === s.current && !s.editing)) return { ...s, current: next };
  const body: AgentBody & { kind: 'ask' } = { kind: 'ask', q: next };
  if (next.startsWith('deck:')) body.finding = snapshot(s, next.slice(5) as DeckKey);
  if (next === 'round') body.fase = s.answers.fase ?? null;
  if (next === 'ticket') body.fasi = s.answers.fasi ?? [];
  if (next === 'roundCheck') {
    body.round = s.answers.round;
    body.fase = s.answers.fase ?? null;
  }
  const deckK = next as DeckKey;
  if (s.deck.decisions[deckK] === 'edit' && next !== 'oneLiner') {
    const v = findingValue(s, deckK);
    if (v !== null) body.suggested = v;
  }
  return agent({ ...s, current: next, editing: null, error: null }, body);
}

// ---------------------------------------------------------------- validation

/** Normalises and validates an answer to `q`. Returns the value to store or an error key. */
export function validate(q: QuestionId, value: AnswerValue): { ok: true; value: AnswerValue } | { ok: false; error: ErrorKey } {
  const spec = questionSpec(q);
  switch (spec.kind) {
    case 'single':
    case 'choice':
    case 'confirm':
      return typeof value === 'string' && spec.options.includes(value) ? { ok: true, value } : { ok: false, error: 'invalid' };
    case 'multi': {
      if (!Array.isArray(value) || value.length === 0) return { ok: false, error: 'required' };
      if (value.some((v) => !spec.options.includes(v))) return { ok: false, error: 'invalid' };
      // Click order matters: the first sector or stage picked is the main one.
      const unique = [...new Set(value)];
      if (spec.exclusive && unique.includes(spec.exclusive)) return { ok: true, value: [spec.exclusive] };
      return { ok: true, value: unique };
    }
    case 'amount': {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return { ok: false, error: 'positive' };
      if (value > MAX_AMOUNT) return { ok: false, error: 'tooBig' };
      return { ok: true, value: Math.round(value) };
    }
    case 'range': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'positive' };
      const { min, max } = value;
      if (![min, max].every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0)) return { ok: false, error: 'positive' };
      if (min > MAX_AMOUNT || max > MAX_AMOUNT) return { ok: false, error: 'tooBig' };
      if (min > max) return { ok: false, error: 'order' };
      return { ok: true, value: { min: Math.round(min), max: Math.round(max) } };
    }
    case 'text': {
      if (typeof value !== 'string') return { ok: false, error: 'invalid' };
      const clean = value.replace(/\s+/g, ' ').trim();
      if (!clean) return { ok: false, error: 'required' };
      if (clean.length > (spec.maxLength ?? Infinity)) return { ok: false, error: 'tooLong' };
      return { ok: true, value: clean };
    }
    case 'deck':
      return value === 'skip' ? { ok: true, value } : { ok: false, error: 'invalid' };
  }
}

// ---------------------------------------------------------------- reducer

function setAnswer(s: IntakeState, q: QuestionId, value: AnswerValue): IntakeState {
  const a: Answers = { ...s.answers };
  const sources: Sources = { ...s.sources };
  const deck = s.deck;
  switch (q) {
    case 'deck':
      a.deck = 'skip';
      break;
    case 'settore':
    case 'fase':
    case 'regione':
      (a as Record<string, unknown>)[q] = value;
      delete sources[q];
      if (q === 'fase') a.roundChecked = undefined;
      break;
    case 'round':
      a.round = value as number;
      a.roundChecked = undefined;
      delete sources.round;
      break;
    case 'roundCheck':
      if (value === 'ok') a.roundChecked = true;
      else {
        a.round = undefined;
        a.roundChecked = undefined;
        delete sources.round;
      }
      break;
    case 'oneLiner':
      a.oneLiner = value as string | null;
      delete sources.oneLiner;
      break;
    case 'settori':
      a.settori = value as Settore[];
      break;
    case 'fasi':
      a.fasi = value as Fase[];
      break;
    case 'ticket':
      a.ticket = value as Range;
      break;
    case 'aree': {
      const v = value as string[];
      a.aree = v.includes(ITALIA) ? 'italia' : (v as Area[]);
      break;
    }
    case 'sede':
      a.sede = value as Regione | null;
      break;
    case 'confirm':
      return { ...s, phase: 'results' };
    default: {
      // Deck confirmations.
      const k = q.slice(5) as DeckKey;
      const choice = value as DeckChoice;
      const decisions = { ...deck.decisions, [k]: choice };
      let signals = deck.signals;
      if (k === 'extras') signals = choice === 'accept' && deck.findings ? extrasOf(deck.findings) : [];
      else if (choice === 'accept') {
        const v = findingValue(s, k);
        const page = snapshot(s, k)?.page;
        (a as Record<string, unknown>)[k] = v;
        if (page) sources[k] = page;
        if (k === 'round' || k === 'fase') a.roundChecked = undefined;
      } else if (choice === 'edit') {
        // The regular question is asked again, with the deck's value as a suggestion.
        (a as Record<string, unknown>)[k] = undefined;
        delete sources[k];
        if (k === 'round') a.roundChecked = undefined;
      }
      return { ...s, answers: a, sources, deck: { ...deck, decisions, signals } };
    }
  }
  return { ...s, answers: a, sources };
}

function resultsMessages(s: IntakeState, ids: ResultIds): IntakeState {
  const fromDeck = (Object.keys(s.sources) as (keyof Sources)[]).filter((k) => s.sources[k]);
  return agent(
    s,
    { kind: 'results', count: ids.matches.length, excluded: ids.excluded.length, fromDeck, signals: s.deck.signals.length },
    ...ids.matches.map((id, i): AgentBody => ({ kind: 'match', id, rank: i + 1 })),
    { kind: 'wrap', count: ids.matches.length, excluded: ids.excluded.length },
  );
}

/**
 * The conversation reducer. `results` gives the ranked match ids for the answers at the moment the founder or investor
 * confirms (the caller runs the matching engine); it is only read by the confirm answer.
 * Actions that don't apply to the current state return the state unchanged.
 */
export function reduce(s: IntakeState, action: Action, results?: (s: IntakeState) => ResultIds): IntakeState {
  switch (action.type) {
    case 'ANSWER':
    case 'SKIP': {
      const q = s.current;
      if (!q) return s;
      const spec = questionSpec(q);
      if (action.type === 'SKIP') {
        if (!spec.optional) return s;
        const done = setAnswer(user(s, { kind: 'answer', q, value: null }), q, null);
        return advance({ ...done, editing: null });
      }
      const v = validate(q, action.value);
      if (!v.ok) return { ...s, error: v.error };
      let next = setAnswer(user({ ...s, error: null }, { kind: 'answer', q, value: v.value }), q, v.value);
      if (q === 'confirm') {
        const ids = results?.(next) ?? { matches: [], excluded: [] };
        next = resultsMessages({ ...next, current: null, editing: null }, ids);
        return next;
      }
      return advance({ ...next, editing: null });
    }
    case 'EDIT': {
      if (!EDITABLE.includes(action.q) || !isAnswered(s, action.q) || s.deck.status === 'reading') return s;
      if (!plan(s).includes(action.q)) return s;
      const back = { ...s, phase: 'intake' as const, current: action.q, editing: action.q, error: null };
      const body: AgentBody & { kind: 'ask' } = { kind: 'ask', q: action.q, edit: true };
      if (action.q === 'round') body.fase = s.answers.fase ?? null;
      if (action.q === 'ticket') body.fasi = s.answers.fasi ?? [];
      return agent(back, body);
    }
    case 'BACK': {
      // Edit the most recent answer to an editable question.
      const last = [...s.messages]
        .reverse()
        .find((m) => m.from === 'user' && m.body.kind === 'answer' && EDITABLE.includes(m.body.q) && m.body.q !== s.current);
      if (!last || last.from !== 'user' || last.body.kind !== 'answer') return s;
      return reduce(s, { type: 'EDIT', q: last.body.q });
    }
    case 'DECK_START': {
      if (s.mode !== 'startup' || s.phase !== 'intake' || s.deck.status === 'reading') return s;
      const withDeck = { ...s, answers: { ...s.answers, deck: 'read' as const }, editing: null, error: null, current: null };
      return agent(user({ ...withDeck, deck: { ...EMPTY_DECK, status: 'reading' } }, { kind: 'deckPicked' }), { kind: 'deckReading' });
    }
    case 'DECK_READY': {
      if (s.deck.status !== 'reading') return s;
      const f = action.findings;
      const found = [f.settore, f.fase, f.round, f.regione, f.team, f.tagline].filter(Boolean).length + f.traction.length;
      const read = { ...s, deck: { ...EMPTY_DECK, status: 'read' as const, pages: action.pages, findings: f } };
      return advance(agent(read, { kind: 'deckRead', pages: action.pages, found }));
    }
    case 'DECK_ERROR': {
      if (s.deck.status !== 'reading') return s;
      const failed = { ...s, deck: { ...EMPTY_DECK, status: 'error' as const, errorCode: action.code } };
      return advance(agent(failed, { kind: 'deckError', code: action.code, ...(action.pages ? { pages: action.pages } : {}) }));
    }
    case 'PASS': {
      // Founder only: "set aside" for an investor with no open proposal. Investors answer through the inbox.
      if (s.phase !== 'results' || s.mode !== 'startup' || s.passed.includes(action.id)) return s;
      return { ...s, passed: [...s.passed, action.id] };
    }
    case 'SHOW_EXCLUDED':
      if (s.phase !== 'results' || s.messages.some((m) => m.body.kind === 'excluded')) return s;
      return agent(user(s, { kind: 'excluded' }), { kind: 'excluded' });
    case 'RESTART':
      // Proposals already sent stay in the inbox (and in this month's counter).
      return initIntake(s.mode);
  }
}

// ---------------------------------------------------------------- per-match status (double opt-in)

export type FounderStatus = 'idle' | 'passed' | 'waiting' | 'request' | 'intro' | 'declined' | 'expired';
export type InvestorStatus = 'idle' | 'passed' | 'waiting' | 'noNews' | 'intro';

/**
 * What the founder sees for one investor, from the inbox view of the latest proposal to it (null: never proposed).
 * The inbox already folds the investor's "no" into silence (waiting until the deadline, then expired), so the agent
 * can't tell them apart either.
 */
export function founderStatus(view: Pick<RequestView, 'status'> | null, passed: boolean): FounderStatus {
  if (!view) return passed ? 'passed' : 'idle';
  switch (view.status) {
    case 'waiting':
      return 'waiting';
    case 'your-turn':
      return 'request';
    case 'intro':
      return 'intro';
    case 'declined-by-you':
      return 'declined';
    case 'expired':
      return 'expired';
  }
}

/**
 * What the investor sees for one teaser, from the inbox view of the latest request about that startup (null: none).
 * The inbox already folds the startup's "no" into silence: waiting until the deadline, then expired ("no news"). A
 * request that expired before the investor answered reads as a new teaser.
 */
export function investorStatus(view: Pick<RequestView, 'status'> | null, answered: boolean): InvestorStatus {
  if (!view) return 'idle';
  switch (view.status) {
    case 'your-turn':
      return 'idle';
    case 'waiting':
      return 'waiting';
    case 'intro':
      return 'intro';
    case 'declined-by-you':
      return 'passed';
    case 'expired':
      return answered ? 'noNews' : 'idle';
  }
}

// ---------------------------------------------------------------- profile objects for the matching engine

export function startupCoreOf(a: Answers): StartupCore | null {
  if (!a.settore || !a.fase || !a.regione || !a.round) return null;
  return { settore: a.settore, fase: a.fase, regione: a.regione, round: a.round };
}

export function startupProfileOf(s: IntakeState, locale: Locale = 'it'): StartupProfile | null {
  const core = startupCoreOf(s.answers);
  return core ? ownStartup(core, { oneLiner: s.answers.oneLiner ?? undefined }, locale) : null;
}

export function thesisOf(a: Answers): Thesis | null {
  if (!a.settori?.length || !a.fasi?.length || !a.ticket || !a.aree || (a.aree !== 'italia' && !a.aree.length)) return null;
  return { settori: a.settori, fasi: a.fasi, ticketMin: a.ticket.min, ticketMax: a.ticket.max, aree: a.aree, sede: a.sede ?? null };
}

export function investorProfileOf(s: IntakeState, locale: Locale = 'it'): Investor | null {
  const t = thesisOf(s.answers);
  return t ? ownInvestor(t, undefined, locale) : null;
}

/** Ids of the matches the agent presented in the latest results (best first). */
export function matchIdsOf(s: Pick<IntakeState, 'messages'>): string[] {
  let start = -1;
  s.messages.forEach((m, i) => {
    if (m.from === 'agent' && m.body.kind === 'results') start = i;
  });
  if (start < 0) return [];
  return s.messages.slice(start).flatMap((m) => (m.from === 'agent' && m.body.kind === 'match' ? [m.body.id] : []));
}

/** Ranked match ids for the current answers, from the given (demo) investors and startups. */
export function resultIdsFor(s: IntakeState, investors: readonly Investor[], startups: readonly StartupProfile[]): ResultIds {
  const ids = <T extends { id: string }>(r: MatchResult<T>): ResultIds => ({
    matches: r.matches.map((m) => m.item.id),
    excluded: r.excluded.map((m) => m.item.id),
  });
  if (s.mode === 'startup') {
    const p = startupProfileOf(s);
    return p ? ids(matchInvestors(p, investors)) : { matches: [], excluded: [] };
  }
  const i = investorProfileOf(s);
  return i ? ids(matchStartups(i, startups)) : { matches: [], excluded: [] };
}

// ---------------------------------------------------------------- live profile summary

export type SummaryKey = 'settore' | 'fase' | 'round' | 'regione' | 'oneLiner' | 'settori' | 'fasi' | 'ticket' | 'aree' | 'sede';

export interface SummaryRow {
  key: SummaryKey;
  /** Answer text in the given language, or null when not answered yet. */
  value: string | null;
  /** Deck page the value comes from. */
  page?: number;
  skipped?: boolean;
  /** Question to reopen with "Modifica" (only when answered and editable now). */
  edit: QuestionId | null;
}

export function answerText(q: QuestionId, value: AnswerValue, locale: Locale = 'it'): string {
  const L = labelsFor(locale);
  const f = FORMATTERS[locale];
  const m = MESSAGES[locale].intake;
  if (value === null) return m.skipped;
  switch (q) {
    case 'settore':
    case 'settori':
      return list((Array.isArray(value) ? value : [value as string]).filter(isSettore).map((v) => L.settore[v]), locale);
    case 'fase':
    case 'fasi':
      return list((Array.isArray(value) ? value : [value as string]).filter(isFase).map((v) => L.fase[v]), locale);
    case 'regione':
    case 'sede':
      return isRegione(value) ? L.regione[value] : String(value);
    case 'aree':
      return value === ITALIA || (Array.isArray(value) && value.includes(ITALIA))
        ? MESSAGES[locale].match.taxonomy.allItaly
        : list((value as string[]).filter(isArea).map((v) => L.area[v]), locale);
    case 'round':
      return f.euro(value as number);
    case 'ticket': {
      const r = value as Range;
      return m.range(f.euro(r.min), f.euro(r.max));
    }
    case 'deck':
      return m.choices.deck.skip;
    case 'roundCheck':
      return m.choices.roundCheck[value as 'ok' | 'change'];
    case 'confirm':
      return m.choices.confirm.go;
    case 'oneLiner':
      return String(value);
    default:
      if (q === 'deck:extras') return m.choices.extras[value as 'accept' | 'ignore'];
      return m.choices.deckFinding[value as DeckChoice];
  }
}

export function summaryRows(s: IntakeState, locale: Locale = 'it'): SummaryRow[] {
  const a = s.answers;
  const keys: SummaryKey[] = s.mode === 'startup' ? ['settore', 'fase', 'round', 'regione', 'oneLiner'] : ['settori', 'fasi', 'ticket', 'aree', 'sede'];
  const canEdit = s.deck.status !== 'reading';
  return keys.map((key) => {
    const raw = key === 'aree' ? a.aree : a[key];
    const answered = raw !== undefined;
    const skipped = raw === null;
    const value = !answered ? null : skipped ? null : answerText(key, (key === 'aree' && raw === 'italia' ? ITALIA : raw) as AnswerValue, locale);
    const page = key in s.sources ? s.sources[key as keyof Sources] : undefined;
    return {
      key,
      value,
      ...(page ? { page } : {}),
      ...(skipped ? { skipped: true } : {}),
      edit: answered && canEdit ? key : null,
    };
  });
}

/** Answered questions / questions in the plan (deck confirmations and the final confirm left out). */
export function progress(s: IntakeState): { done: number; total: number } {
  const qs = plan(s).filter((q) => !q.startsWith('deck') && q !== 'confirm' && q !== 'roundCheck');
  return { done: qs.filter((q) => isAnswered(s, q)).length, total: qs.length };
}

// ---------------------------------------------------------------- explanations (templates in src/i18n/messages/intake.ts)

/** "a, b e c" / "a, b and c". */
export function list(items: readonly string[], locale: Locale = 'it'): string {
  if (items.length < 2) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ${MESSAGES[locale].intake.and} ${items[items.length - 1]}`;
}

const capitalise = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export interface Explanation {
  /** Who it is (or, for investors, what the anonymous startup does). */
  lead: string;
  /** Why it fits, in one sentence. */
  fits: string;
  /** What doesn't fit, one short sentence each (or a "nothing major" line). */
  gaps: string[];
  /** The double opt-in next step for the current status. */
  next: string;
}

function ctxOf(p: StartupProfile, i: Investor, locale: Locale): ExplainCtx {
  const L = labelsFor(locale);
  const f = FORMATTERS[locale];
  return {
    nome: i.nome,
    tipo: L.tipo[i.tipo],
    sede: i.sede ? L.regione[i.sede] : '',
    settore: L.settore[p.settore],
    fase: L.fase[p.fase],
    faseMain: L.fase[i.fasi[0]!],
    settoreMain: i.settori === 'tutti' ? '' : L.settore[i.settori[0]!],
    regione: L.regione[p.regione],
    area: L.area[AREA_DI[p.regione]],
    round: f.euro(p.round),
    min: f.euro(i.ticketMin),
    max: f.euro(i.ticketMax),
    pct: f.percent(coverage(p, i) * 100, 0),
    startup: p.nome,
    founder: p.founder,
  };
}

type Side = 'founder' | 'investor';

function clauses(p: StartupProfile, i: Investor, ev: Evaluation, side: Side, locale: Locale): { fits: string[]; gaps: string[] } {
  const T = MESSAGES[locale].intake.explain[side];
  const c = ctxOf(p, i, locale);
  const fits: string[] = [];
  const gaps: string[] = [];
  const cov = coverage(p, i);
  // Sector.
  if (ev.parts.settore === SETTORE_POINTS.principale) fits.push(T.fit.settoreMain(c));
  else if (ev.parts.settore === SETTORE_POINTS.secondario) {
    fits.push(T.fit.settoreOther(c));
    gaps.push(T.gap.settoreNotMain(c));
  } else {
    fits.push(T.fit.generalist(c));
    gaps.push(T.gap.generalist(c));
  }
  // Ticket.
  if (cov >= 1) fits.push(T.fit.ticketFull(c));
  else if (cov >= LEAD_COVERAGE) fits.push(T.fit.ticketLead(c));
  else gaps.push(T.gap.ticketPart(c));
  // Stage.
  if (ev.parts.fase === FASE_POINTS.principale) fits.push(T.fit.faseMain(c));
  else gaps.push(T.gap.faseNotMain(c));
  // Geography.
  if (ev.parts.area === AREA_POINTS.stessaRegione) fits.push(T.fit.sameRegion(c));
  else if (ev.parts.area === AREA_POINTS.area) fits.push(T.fit.area(c));
  else gaps.push(T.gap.italiaOnly(c));
  return { fits, gaps };
}

/** Founder side: why this investor fits, what doesn't, and the double opt-in next step for its current status. */
export function explainInvestorMatch(
  p: StartupProfile,
  i: Investor,
  ev: Evaluation,
  status: FounderStatus,
  locale: Locale = 'it',
): Explanation {
  const T = MESSAGES[locale].intake.explain;
  const c = ctxOf(p, i, locale);
  const { fits, gaps } = clauses(p, i, ev, 'founder', locale);
  return {
    lead: i.sede ? T.founder.lead(c) : T.founder.leadNoSede(c),
    fits: T.fitsSentence(capitalise(list(fits, locale))),
    gaps: gaps.length ? gaps : [T.noGaps],
    next: T.founder.next[status](c),
  };
}

/** Investor side: the anonymous startup (no name until both say yes), fit, gaps and next step. */
export function explainStartupMatch(
  p: StartupProfile,
  i: Investor,
  ev: Evaluation,
  status: InvestorStatus,
  locale: Locale = 'it',
): Explanation {
  const T = MESSAGES[locale].intake.explain;
  const c = ctxOf(p, i, locale);
  const { fits, gaps } = clauses(p, i, ev, 'investor', locale);
  return {
    lead: T.investor.lead(c),
    fits: T.fitsSentence(capitalise(list(fits, locale))),
    gaps: gaps.length ? gaps : [T.noGaps],
    next: T.investor.next[status](c),
  };
}

// ---------------------------------------------------------------- storage (sessionStorage, no deck text)

export const STORAGE_KEYS: Record<IntakeMode, string> = {
  startup: 'matchinvstar-agent-startup',
  investor: 'matchinvstar-agent-investor',
};

/**
 * The state as it may be stored: the deck's findings (with their page snippets) are dropped, snapshots lose their
 * snippet, and the deck's tagline is kept only if the founder accepted it as the one-liner. Only enumerated values,
 * amounts, page numbers and the founder's own answers remain.
 */
export function toStorable(s: IntakeState): IntakeState {
  const keepTagline = s.deck.decisions.oneLiner === 'accept';
  const messages = s.messages.map((m): Message => {
    if (m.from !== 'agent' || m.body.kind !== 'ask' || !m.body.finding) return m;
    const finding = { ...m.body.finding };
    delete finding.snippet;
    if (finding.key === 'oneLiner' && !keepTagline) finding.value = null;
    return { ...m, body: { ...m.body, finding } };
  });
  return {
    ...s,
    deck: { ...s.deck, findings: null, status: s.deck.status === 'reading' ? 'none' : s.deck.status },
    messages,
  };
}

export function serialize(s: IntakeState): string {
  return JSON.stringify(toStorable(s));
}

/**
 * Restores a stored conversation, or null when it is missing, malformed, from another mode or from an older format.
 * Without the deck's findings, pending deck questions disappear from the plan and the regular questions take over.
 */
export function restore(raw: string | null, mode: IntakeMode): IntakeState | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const s = data as Partial<IntakeState>;
  if (!s || typeof s !== 'object' || s.version !== 1 || s.mode !== mode || !Array.isArray(s.messages) || !s.answers || !s.deck) return null;
  if (typeof s.nextId !== 'number') return null;
  if (!validAnswers(s.answers)) return null;
  // Older stored conversations also carry a monthly counter, founder proposals and the investor's local board: all of
  // them now live in the inbox.
  const OLD = ['counter', 'limitHit', 'board', 'simulated'];
  const rest = Object.fromEntries(Object.entries(s).filter(([k]) => !OLD.includes(k))) as Partial<IntakeState>;
  const base: IntakeState = {
    ...(rest as IntakeState),
    passed: s.passed ?? [],
    sources: s.sources ?? {},
    deck: { ...EMPTY_DECK, ...s.deck, findings: null },
    error: null,
  };
  if (base.phase === 'results') return base;
  // Ask again whatever is next now (a pending deck question may no longer apply).
  const next = nextQuestion(base);
  if (next === base.current && !base.editing) return base;
  return advance(agent({ ...base, current: null, editing: null }, { kind: 'restored' }));
}

function validAnswers(a: Answers): boolean {
  const ok = (v: unknown, guard: (x: unknown) => boolean) => v === undefined || guard(v);
  const amount = (v: unknown) => typeof v === 'number' && v > 0 && v <= MAX_AMOUNT;
  return (
    ok(a.settore, isSettore) &&
    ok(a.fase, isFase) &&
    ok(a.regione, isRegione) &&
    ok(a.round, amount) &&
    ok(a.settori, (v) => Array.isArray(v) && v.every(isSettore)) &&
    ok(a.fasi, (v) => Array.isArray(v) && v.every(isFase)) &&
    ok(a.aree, (v) => v === 'italia' || (Array.isArray(v) && v.every(isArea))) &&
    ok(a.sede, (v) => v === null || isRegione(v)) &&
    ok(a.oneLiner, (v) => v === null || (typeof v === 'string' && v.length <= ONE_LINER_MAX + 1)) &&
    ok(a.ticket, (v) => {
      const r = v as Range;
      return Boolean(r) && amount(r.min) && amount(r.max) && r.min <= r.max;
    })
  );
}

// ---------------------------------------------------------------- transcript text

const DECK_LABEL_KEY: Record<Exclude<DeckKey, 'extras'>, SummaryKey> = {
  settore: 'settore',
  fase: 'fase',
  round: 'round',
  regione: 'regione',
  oneLiner: 'oneLiner',
};

/** "Team: 7 persone", "MRR 18.000 €"… for accepted or proposed deck signals. */
export function signalText(x: DeckSignal, locale: Locale = 'it'): string {
  const m = MESSAGES[locale].match.ui.findings;
  return x.kind === 'team' ? `${m.labels.team}: ${m.teamValue(x.count)}` : tractionText(x.signal, locale);
}

/** The value of a deck finding as the agent says it ("Agritech", "Bari (Puglia)", "800.000 €"). */
export function findingValueText(f: FindingSnapshot, locale: Locale = 'it'): string {
  const L = labelsFor(locale);
  const fmt = FORMATTERS[locale];
  const v = f.value;
  if (Array.isArray(v)) return list(v.map((x) => signalText(x, locale)), locale);
  if (v === null) return '';
  switch (f.key) {
    case 'settore':
      return isSettore(v) ? L.settore[v] : String(v);
    case 'fase':
      return isFase(v) ? L.fase[v] : String(v);
    case 'regione':
      return isRegione(v) ? (f.place && f.place !== L.regione[v] ? `${f.place} (${L.regione[v]})` : L.regione[v]) : String(v);
    case 'round':
      return typeof v === 'number' ? (f.currency ? `${f.currency}${fmt.number(v)}` : fmt.euro(v)) : String(v);
    default:
      return String(v);
  }
}

/** The question as the agent asks it, in the given language. */
export function questionText(body: AgentBody & { kind: 'ask' }, mode: IntakeMode, locale: Locale = 'it'): string {
  const Q = MESSAGES[locale].intake.questions;
  const L = labelsFor(locale);
  const q = body.q;
  let text: string;
  switch (q) {
    case 'round':
      text = Q.round(body.fase ? L.fase[body.fase] : '');
      break;
    case 'roundCheck':
      text = Q.roundCheck(body.round ? FORMATTERS[locale].euro(body.round) : '', body.fase ? L.fase[body.fase] : '');
      break;
    case 'ticket':
      text = Q.ticket(list((body.fasi ?? []).map((x) => L.fase[x]), locale));
      break;
    case 'confirm':
      text = mode === 'investor' ? Q.confirmInvestor : Q.confirm;
      break;
    default:
      if (q.startsWith('deck:')) {
        const f = body.finding;
        const k = q.slice(5) as DeckKey;
        if (!f) text = '';
        else if (k === 'extras') text = Q.deckFinding.extras(findingValueText(f, locale));
        else if (k === 'oneLiner') text = Q.deckFinding.oneLiner(f.page);
        else text = Q.deckFinding[k](findingValueText(f, locale), f.page);
      } else text = Q[q as 'deck' | 'settore' | 'fase' | 'regione' | 'oneLiner' | 'settori' | 'fasi' | 'aree' | 'sede'];
  }
  if (body.edit && EDITABLE.includes(q)) {
    const label = MESSAGES[locale].intake.ui.labels[q as SummaryKey];
    return `${Q.edit(label)} ${text}`;
  }
  return text;
}

/** Plain text of a transcript message (match cards are rendered by the UI from explainInvestorMatch / explainStartupMatch). */
export function messageText(m: Message, mode: IntakeMode, locale: Locale = 'it'): string {
  const T = MESSAGES[locale].intake;
  if (m.from === 'user') {
    const b = m.body;
    if (b.kind === 'deckPicked') return T.user.deckPicked;
    if (b.kind === 'excluded') return T.user.excluded;
    return answerText(b.q, b.value, locale);
  }
  const b = m.body;
  switch (b.kind) {
    case 'hello':
      return T.hello[mode];
    case 'ask':
      return questionText(b, mode, locale);
    case 'deckReading':
      return T.deck.reading;
    case 'deckRead':
      return T.deck.read(b.pages, b.found);
    case 'deckError': {
      const e = MESSAGES[locale].match.deck.readErrors;
      const why = b.code === 'tooManyPages' ? e.tooManyPages(b.pages ?? 0, MAX_DECK_PAGES) : e[b.code];
      return `${why} ${T.deck.error}`;
    }
    case 'results': {
      const intro = mode === 'investor' ? T.results.introInvestor(b.count) : T.results.intro(b.count);
      if (!b.fromDeck.length) return intro;
      const labels = b.fromDeck.map((k) => T.ui.labels[DECK_LABEL_KEY[k]].toLowerCase());
      return `${intro} ${T.results.fromDeck(list(labels, locale))}`;
    }
    case 'match':
      return T.ui.matchesLabel(b.rank);
    case 'wrap':
      return T.results.wrap(b.excluded);
    case 'excluded':
      return T.results.excluded;
    case 'restored':
      return T.results.restored;
  }
}
