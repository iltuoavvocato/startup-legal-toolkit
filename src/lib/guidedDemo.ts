// Guided demo ("Demo guidata"): the double opt-in story told on both screens at once, step by step. Pure: every step
// is rebuilt by replaying the script from an empty, in-memory inbox with the real reducers (deck extractor, matching
// engine, inbox propose/answer/views), so the demo never reads or writes the user's own inbox in sessionStorage.
//
// One request, two perspectives: the inbox models the pair with one opt-in state; `viewOf` with role 'founder' is what
// the startup sees, with role 'investor' what the investor sees. A "no" stays invisible to the other side.
import { SAMPLE_DECK_TEXT } from '../data/sampleDeckText';
import { demoInvestors } from '../data/matchDemo';
import type { Locale } from '../i18n/locales';
import { extractFromDeck } from './deckExtract';
import { answer, DAY_MS, emptyStore, propose, viewOf, withProfile, type InboxRequest, type InboxStore, type RequestView } from './inbox';
import { REQUEST_EXPIRY_DAYS } from './matchConfig';
import { ownStartup, type StartupCore } from './matchQuery';
import { matchInvestors, type Ranked } from './matching';
import type { Investor, StartupProfile } from './matchTaxonomy';

export type DemoBranch = 'yes' | 'no';
export type DemoSide = 'founder' | 'investor';
export type DemoStepId = 'profile' | 'matches' | 'propose' | 'teaser' | 'interested' | 'intro' | 'declined' | 'expired';

/** Steps 1–4 are shared; 5–6 depend on the investor's answer (branch). */
export const SHARED_STEPS: readonly DemoStepId[] = ['profile', 'matches', 'propose', 'teaser'];
export const BRANCH_STEPS: Record<DemoBranch, readonly DemoStepId[]> = {
  yes: ['interested', 'intro'],
  no: ['declined', 'expired'],
};
export const STEP_COUNT = SHARED_STEPS.length + 2;

/** Demo day of each step (day 0: the proposal). The "no" branch ends one day after the 14-day deadline. */
const DAY: Record<DemoStepId, number> = {
  profile: 0,
  matches: 0,
  propose: 0,
  teaser: 1,
  interested: 3,
  intro: 4,
  declined: 3,
  expired: REQUEST_EXPIRY_DAYS + 1,
};

/** Which screen the step is about (the one shown first on phones). */
const FOCUS: Record<DemoStepId, DemoSide> = {
  profile: 'founder',
  matches: 'founder',
  propose: 'founder',
  teaser: 'investor',
  interested: 'founder',
  intro: 'founder',
  declined: 'founder',
  expired: 'founder',
};

/** Autoplay pace, in ms per step (no autoplay with reduced motion). */
export const AUTOPLAY_MS = 6000;

/** A fixed demo clock, so the deep links always show the same days: 1 March 2026, 10:00 UTC. */
export const DEMO_T0 = Date.UTC(2026, 2, 1, 10);

export interface DemoPosition {
  /** 1-based step number. */
  step: number;
  branch: DemoBranch;
}

export function stepIdOf(p: DemoPosition): DemoStepId {
  return p.step <= SHARED_STEPS.length ? SHARED_STEPS[p.step - 1]! : BRANCH_STEPS[p.branch][p.step - SHARED_STEPS.length - 1]!;
}

/** Reads `?step=` and `?branch=` (anything invalid falls back to step 1 / the "yes" branch). */
export function parsePosition(q: URLSearchParams): DemoPosition {
  const n = Number(q.get('step'));
  const step = Number.isInteger(n) && n >= 1 && n <= STEP_COUNT ? n : 1;
  return { step, branch: q.get('branch') === 'no' ? 'no' : 'yes' };
}

/** Query params of a position: step 1 of the "yes" branch is the clean URL. */
export function positionToQuery(p: DemoPosition): Record<string, string> | null {
  if (p.step === 1 && p.branch === 'yes') return null;
  return p.branch === 'no' ? { step: String(p.step), branch: 'no' } : { step: String(p.step) };
}

/** Next / previous step within the current branch; null at either end. */
export function nextPosition(p: DemoPosition): DemoPosition | null {
  return p.step < STEP_COUNT ? { ...p, step: p.step + 1 } : null;
}
export function prevPosition(p: DemoPosition): DemoPosition | null {
  return p.step > 1 ? { ...p, step: p.step - 1 } : null;
}

/** Switching branch keeps you at the same point of the story (shared steps stay where they are). */
export function withBranch(p: DemoPosition, branch: DemoBranch): DemoPosition {
  return { ...p, branch };
}

export interface DemoCast {
  /** The founder's profile, as the real deck extractor reads it from the fictional sample deck. */
  core: StartupCore;
  startup: StartupProfile;
  /** The agent's matches for that profile (best first) among the fictional demo investors. */
  matches: Ranked<Investor>[];
  /** The investor the founder proposes to: the best match. */
  investor: Investor;
}

/** The fictional founder, startup and investor of the demo, in one language. */
export function demoCast(locale: Locale): DemoCast {
  const deck = SAMPLE_DECK_TEXT[locale];
  const f = extractFromDeck(deck.pages);
  if (!f.settore || !f.fase || !f.regione || !f.round) throw new Error('sample deck: incomplete profile');
  const core: StartupCore = { settore: f.settore.value, fase: f.fase.value, regione: f.regione.value, round: f.round.value };
  const founder = locale === 'it' ? 'Ilaria Fittizia' : 'Alex Fictional';
  const startup = ownStartup(core, { nome: deck.nome, founder, oneLiner: f.tagline?.value }, locale);
  const { matches } = matchInvestors(startup, demoInvestors(locale), locale);
  const first = matches[0];
  if (!first) throw new Error('sample deck: no matches');
  return { core, startup, matches, investor: first.item };
}

export interface DemoFrame {
  id: DemoStepId;
  step: number;
  branch: DemoBranch;
  /** Day of the demo clock (0 = the day of the proposal). */
  day: number;
  now: number;
  focus: DemoSide;
  /** The in-memory inbox at this step (founder role), never the user's own. */
  store: InboxStore;
  request: InboxRequest | null;
  /** What each side sees for the request (null before the proposal / before the teaser reaches the investor). */
  founderView: RequestView | null;
  investorView: RequestView | null;
  /**
   * "No" branch: what the founder would see if the investor had never answered. Equal to `founderView` by design;
   * the page shows both to make the invariant visible.
   */
  silentFounderView: RequestView | null;
}

const asInvestor = (r: InboxRequest): InboxRequest => ({ ...r, role: 'investor' });

/** The investor's own answer to the pair's request (the same opt-in state, seen from the investor's side). */
export function investorAnswers(store: InboxStore, requestId: string, choice: 'yes' | 'no', now: number): InboxStore {
  const r = store.requests.find((x) => x.id === requestId);
  if (!r) return store;
  const mirrored = answer({ ...store, requests: [asInvestor(r)] }, r.id, choice, now).requests[0]!;
  return { ...store, requests: store.requests.map((x) => (x.id === r.id ? { ...mirrored, role: r.role } : x)) };
}

/** Builds one step by replaying the script up to it (real reducers, in-memory store). */
export function frameAt(p: DemoPosition, cast: DemoCast, t0 = DEMO_T0): DemoFrame {
  const id = stepIdOf(p);
  const order = [...SHARED_STEPS, ...BRANCH_STEPS[p.branch]];
  const reached = (s: DemoStepId) => order.indexOf(s) <= order.indexOf(id) && order.includes(s);
  const at = (s: DemoStepId) => t0 + DAY[s] * DAY_MS;
  const now = at(id);

  let store = emptyStore();
  if (reached('profile')) store = withProfile(store, cast.core);
  let requestId: string | null = null;
  if (reached('propose')) {
    const r = propose(store, cast.investor.id, at('propose'));
    if (!r.ok) throw new Error(`guided demo: propose refused (${r.reason})`);
    store = r.store;
    requestId = r.request.id;
  }
  const silent = store;
  if (requestId && reached('interested')) store = investorAnswers(store, requestId, 'yes', at('interested'));
  if (requestId && reached('intro')) store = answer(store, requestId, 'yes', at('intro'));
  if (requestId && reached('declined')) store = investorAnswers(store, requestId, 'no', at('declined'));

  const request = store.requests.find((r) => r.id === requestId) ?? null;
  const silentRequest = silent.requests.find((r) => r.id === requestId) ?? null;
  return {
    id,
    step: p.step,
    branch: p.branch,
    day: DAY[id],
    now,
    focus: FOCUS[id],
    store,
    request,
    founderView: request ? viewOf(request, now) : null,
    // The teaser reaches the investor the day after the proposal (step 4).
    investorView: request && reached('teaser') ? viewOf(asInvestor(request), now) : null,
    silentFounderView: p.branch === 'no' && silentRequest ? viewOf(silentRequest, now) : null,
  };
}
