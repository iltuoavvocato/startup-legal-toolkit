// Double opt-in inbox ("Richieste" / "Requests"): requests with timestamps, expiry, the monthly proposal cap and the
// simulated answers of the other side. Pure functions with an injected clock (`now`, in ms): no Date.now() in here.
//
// The rule that shapes everything: a "no" is never revealed. To the side that asked, a declined request looks exactly
// like one nobody answered: "waiting" until its deadline, then "expired". A "no" never moves a deadline.
import { MONTHLY_PROPOSAL_LIMIT, REQUEST_EXPIRY_DAYS } from './matchConfig';
import { isFase, isRegione, isSettore } from './matchTaxonomy';
import type { StartupCore } from './matchQuery';
import { monthKey, transition, type OptInState, type ProposalCounter } from './optin';

export const DAY_MS = 86_400_000;
export const INBOX_STORAGE_KEY = 'matchinvstar-inbox';

/** founder: proposals you sent as a startup. investor: proposals you received as an investor (demo startups). */
export type InboxRole = 'founder' | 'investor';
export type SimAnswer = 'yes' | 'no';

export interface InboxRequest {
  id: string;
  role: InboxRole;
  /** The other side: an investor id (founder role) or a demo startup id (investor role). */
  counterpartId: string;
  state: OptInState;
  createdAt: number;
  /** Start of the step that is waiting for an answer: createdAt, then the investor's yes. A "no" never moves it. */
  stepAt: number;
  /** Simulated answer of the other side (demo only): what it is and how many days after `stepAt` it arrives. */
  sim: { answer: SimAnswer; afterDays: number };
}

export interface InboxStore {
  v: 1;
  /** Demo time travel ("Simula +7 giorni"), in days added to the real clock. */
  offsetDays: number;
  /** The founder's profile (enumerated fields only, as in the URL): no names, no description, no deck text. */
  profile: StartupCore | null;
  requests: InboxRequest[];
}

export const emptyStore = (): InboxStore => ({ v: 1, offsetDays: 0, profile: null, requests: [] });

export type RequestStatus = 'your-turn' | 'waiting' | 'intro' | 'expired' | 'declined-by-you';
export type RequestGroup = 'pending' | 'accepted' | 'expired';

export interface RequestView {
  status: RequestStatus;
  group: RequestGroup;
  /** Whole days left before expiry (at least 1 while pending), null once closed. */
  daysLeft: number | null;
  /** Deadline of the open step (pending), or the moment it expired (expired), else null. */
  deadline: number | null;
  /** Whether this side may see the other party's name. */
  knowsName: boolean;
}

// ---------------------------------------------------------------- clock

/** The demo clock: real time plus the time-travel offset. */
export function clockOf(store: InboxStore, realNow: number): number {
  return realNow + store.offsetDays * DAY_MS;
}

export function timeTravel(store: InboxStore, days: number): InboxStore {
  return { ...store, offsetDays: store.offsetDays + Math.max(0, Math.floor(days)) };
}

export function deadlineOf(r: Pick<InboxRequest, 'stepAt'>, expiryDays = REQUEST_EXPIRY_DAYS): number {
  return r.stepAt + expiryDays * DAY_MS;
}

// ---------------------------------------------------------------- views (who sees what)

/**
 * What the user sees for one request. The other side's "no" is folded into silence: for the founder,
 * 'chiusa-investitore' reads exactly like 'proposta'; for the investor, 'chiusa-startup' like 'attesa-startup'.
 */
export function viewOf(r: InboxRequest, now: number, expiryDays = REQUEST_EXPIRY_DAYS): RequestView {
  const deadline = deadlineOf(r, expiryDays);
  const open = now < deadline;
  const pending = (status: 'your-turn' | 'waiting', knowsName: boolean): RequestView =>
    open
      ? { status, group: 'pending', daysLeft: Math.max(1, Math.ceil((deadline - now) / DAY_MS)), deadline, knowsName }
      : { status: 'expired', group: 'expired', daysLeft: null, deadline, knowsName };
  const closed = (status: 'intro' | 'declined-by-you', knowsName: boolean): RequestView => ({
    status,
    group: status === 'intro' ? 'accepted' : 'expired',
    daysLeft: null,
    deadline: null,
    knowsName,
  });

  if (r.role === 'founder') {
    // The founder proposed to a named investor, so the name is always known on this side.
    switch (r.state) {
      case 'proposta':
      case 'chiusa-investitore':
        return pending('waiting', true);
      case 'attesa-startup':
        return pending('your-turn', true);
      case 'chiusa-startup':
        return closed('declined-by-you', true);
      case 'intro':
        return closed('intro', true);
    }
  }
  // Investor: the startup stays anonymous until the intro.
  switch (r.state) {
    case 'proposta':
      return pending('your-turn', false);
    case 'attesa-startup':
    case 'chiusa-startup':
      return pending('waiting', false);
    case 'chiusa-investitore':
      return closed('declined-by-you', false);
    case 'intro':
      return closed('intro', true);
  }
}

// ---------------------------------------------------------------- simulated other side (demo)

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Deterministic simulated answer for a pair: about two in three say yes, after 2–6 days; the rest say no after 1–10
 * days. A "no" has no visible effect on the asking side, so its timing is never shown.
 */
export function simulatedAnswer(seed: string): InboxRequest['sim'] {
  const h = hash(seed);
  const yes = h % 3 !== 0;
  return yes ? { answer: 'yes', afterDays: 2 + ((h >>> 3) % 5) } : { answer: 'no', afterDays: 1 + ((h >>> 3) % 10) };
}

/** Applies the simulated answers that have arrived by `now` (and before the step's deadline). */
export function advance(store: InboxStore, now: number, expiryDays = REQUEST_EXPIRY_DAYS): InboxStore {
  let changed = false;
  const requests = store.requests.map((r) => {
    const waitingOnOther =
      (r.role === 'founder' && r.state === 'proposta') || (r.role === 'investor' && r.state === 'attesa-startup');
    if (!waitingOnOther) return r;
    const at = r.stepAt + r.sim.afterDays * DAY_MS;
    if (at > now || at >= deadlineOf(r, expiryDays)) return r;
    changed = true;
    if (r.role === 'founder') {
      // The investor's yes opens a new step (the founder's answer) with its own deadline; a no changes nothing visible.
      return r.sim.answer === 'yes'
        ? { ...r, state: transition(r.state, 'INVESTOR_YES'), stepAt: at }
        : { ...r, state: transition(r.state, 'INVESTOR_NO') };
    }
    return { ...r, state: transition(r.state, r.sim.answer === 'yes' ? 'STARTUP_YES' : 'STARTUP_NO') };
  });
  return changed ? { ...store, requests } : store;
}

// ---------------------------------------------------------------- monthly cap

/** Proposals sent as a founder in the calendar month of `now` (expired ones still count). */
export function proposalCounter(store: InboxStore, now: number): ProposalCounter {
  const month = monthKey(new Date(now));
  return { month, used: store.requests.filter((r) => r.role === 'founder' && monthKey(new Date(r.createdAt)) === month).length };
}

// ---------------------------------------------------------------- actions

export function withProfile(store: InboxStore, profile: StartupCore): InboxStore {
  return { ...store, profile: { settore: profile.settore, fase: profile.fase, regione: profile.regione, round: profile.round } };
}

/** The founder request to this investor that is still open (pending or intro), if any. */
export function activeProposal(store: InboxStore, investorId: string, now: number): InboxRequest | null {
  return (
    store.requests.find(
      (r) => r.role === 'founder' && r.counterpartId === investorId && viewOf(r, now).group !== 'expired',
    ) ?? null
  );
}

/** The most recent founder request to this investor (any state, expired included), if any. */
export function latestProposal(store: InboxStore, investorId: string): InboxRequest | null {
  let latest: InboxRequest | null = null;
  for (const r of store.requests) {
    if (r.role !== 'founder' || r.counterpartId !== investorId) continue;
    if (!latest || r.createdAt > latest.createdAt || (r.createdAt === latest.createdAt && r.id > latest.id)) latest = r;
  }
  return latest;
}

export type ProposeResult =
  | { ok: true; store: InboxStore; request: InboxRequest }
  | { ok: false; reason: 'no-profile' | 'already-sent' | 'limit' };

/**
 * Records a proposal from the founder's profile to an investor. Eligibility (would the agent propose this pair?) is
 * checked by the caller with the matching engine. A new proposal is possible again once the previous one expired,
 * which is the same whether the investor said no or never answered.
 */
export function propose(store: InboxStore, investorId: string, now: number, limit = MONTHLY_PROPOSAL_LIMIT): ProposeResult {
  if (!store.profile) return { ok: false, reason: 'no-profile' };
  if (activeProposal(store, investorId, now)) return { ok: false, reason: 'already-sent' };
  if (proposalCounter(store, now).used >= limit) return { ok: false, reason: 'limit' };
  const request: InboxRequest = {
    id: `f-${investorId}-${now}`,
    role: 'founder',
    counterpartId: investorId,
    state: 'proposta',
    createdAt: now,
    stepAt: now,
    sim: simulatedAnswer(`founder:${investorId}`),
  };
  return { ok: true, store: { ...store, requests: [...store.requests, request] }, request };
}

/**
 * The user's own answer: the founder accepts or declines an interested investor; the investor says yes or no to a
 * teaser. Only while it is this side's turn and before the deadline; otherwise nothing changes.
 */
export function answer(store: InboxStore, requestId: string, choice: SimAnswer, now: number): InboxStore {
  let changed = false;
  const requests = store.requests.map((r) => {
    if (r.id !== requestId || viewOf(r, now).status !== 'your-turn') return r;
    changed = true;
    if (r.role === 'founder') return { ...r, state: transition(r.state, choice === 'yes' ? 'STARTUP_YES' : 'STARTUP_NO') };
    return choice === 'yes'
      ? { ...r, state: transition(r.state, 'INVESTOR_YES'), stepAt: now }
      : { ...r, state: transition(r.state, 'INVESTOR_NO') };
  });
  return changed ? { ...store, requests } : store;
}

/** Days ago each demo proposal reached "you as an investor", so deadlines differ (14-day placeholder). */
export const INVESTOR_DEMO_AGE_DAYS = [1, 4, 8, 12] as const;

/** Demo proposals received as an investor (anonymous teasers of demo startups), added once. */
export function seedInvestorInbox(store: InboxStore, startupIds: readonly string[], now: number): InboxStore {
  if (store.requests.some((r) => r.role === 'investor')) return store;
  const seeded = startupIds.slice(0, INVESTOR_DEMO_AGE_DAYS.length).map((id, k): InboxRequest => {
    const createdAt = now - INVESTOR_DEMO_AGE_DAYS[k]! * DAY_MS;
    return {
      id: `i-${id}-${createdAt}`,
      role: 'investor',
      counterpartId: id,
      state: 'proposta',
      createdAt,
      stepAt: createdAt,
      sim: simulatedAnswer(`investor:${id}`),
    };
  });
  return { ...store, requests: [...store.requests, ...seeded] };
}

export interface Grouped {
  pending: InboxRequest[];
  accepted: InboxRequest[];
  expired: InboxRequest[];
}

/** Requests of one role by group; pending sorted by deadline (soonest first), the others newest first. */
export function groupRequests(store: InboxStore, role: InboxRole, now: number): Grouped {
  const out: Grouped = { pending: [], accepted: [], expired: [] };
  for (const r of store.requests) if (r.role === role) out[viewOf(r, now).group].push(r);
  out.pending.sort((a, b) => deadlineOf(a) - deadlineOf(b) || a.id.localeCompare(b.id));
  const newest = (a: InboxRequest, b: InboxRequest) => b.createdAt - a.createdAt || a.id.localeCompare(b.id);
  out.accepted.sort(newest);
  out.expired.sort(newest);
  return out;
}

/** Badge count: requests waiting for the user's own answer, in both roles. */
export function actionCount(store: InboxStore, now: number): number {
  return store.requests.filter((r) => viewOf(r, now).status === 'your-turn').length;
}

// ---------------------------------------------------------------- storage format

const STATES: OptInState[] = ['proposta', 'attesa-startup', 'chiusa-investitore', 'chiusa-startup', 'intro'];

function isRequest(x: unknown): x is InboxRequest {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  const sim = r.sim as Record<string, unknown> | undefined;
  return (
    typeof r.id === 'string' &&
    (r.role === 'founder' || r.role === 'investor') &&
    typeof r.counterpartId === 'string' &&
    STATES.includes(r.state as OptInState) &&
    Number.isFinite(r.createdAt) &&
    Number.isFinite(r.stepAt) &&
    !!sim &&
    (sim.answer === 'yes' || sim.answer === 'no') &&
    Number.isInteger(sim.afterDays)
  );
}

function isCore(x: unknown): x is StartupCore {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return isSettore(p.settore) && isFase(p.fase) && isRegione(p.regione) && typeof p.round === 'number' && p.round > 0;
}

/** Parses the stored JSON; anything malformed gives an empty inbox. */
export function parseStore(raw: string | null): InboxStore {
  if (!raw) return emptyStore();
  try {
    const x = JSON.parse(raw) as Record<string, unknown>;
    if (x.v !== 1 || !Array.isArray(x.requests)) return emptyStore();
    return {
      v: 1,
      offsetDays: Number.isInteger(x.offsetDays) && (x.offsetDays as number) >= 0 ? (x.offsetDays as number) : 0,
      profile: isCore(x.profile) ? withProfile(emptyStore(), x.profile).profile : null,
      requests: x.requests.filter(isRequest),
    };
  } catch {
    return emptyStore();
  }
}

export function serializeStore(store: InboxStore): string {
  return JSON.stringify(store);
}
