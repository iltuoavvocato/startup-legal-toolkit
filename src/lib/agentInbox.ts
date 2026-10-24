// The guided intake ("Parla con l'agente") and the shared requests inbox: the agent's founder proposals are recorded in
// the same inbox, with the same monthly counter, as the form results and the directory; in investor mode, interest
// and passes are answers in the inbox's investor tab, on the same demo clock. Pure functions over the inbox store and
// the conversation's answers; the clock is injected.
import {
  answer,
  latestProposal,
  propose,
  simulatedAnswer,
  viewOf,
  withProfile,
  type InboxRequest,
  type InboxStore,
  type ProposeResult,
  type SimAnswer,
} from './inbox';
import { founderStatus, investorStatus, startupCoreOf, type Answers, type FounderStatus, type InvestorStatus } from './intakeAgent';

/** What the agent shows for one investor, read from the inbox (the investor's "no" already reads as silence). */
export function agentFounderStatus(store: InboxStore, investorId: string, passed: readonly string[], now: number): FounderStatus {
  const r = latestProposal(store, investorId);
  return founderStatus(r ? viewOf(r, now) : null, passed.includes(investorId));
}

/**
 * "Proponi il profilo" from the agent's results: saves the profile from the conversation's answers (enumerated fields
 * only) and records the proposal in the inbox. `matches` are the investors the agent proposed for these answers: a
 * pair outside them is never sent.
 */
export function proposeFromAgent(
  store: InboxStore,
  answers: Answers,
  investorId: string,
  matches: readonly string[],
  now: number,
): ProposeResult | { ok: false; reason: 'not-eligible' } {
  const core = startupCoreOf(answers);
  if (!core) return { ok: false, reason: 'no-profile' };
  if (!matches.includes(investorId)) return { ok: false, reason: 'not-eligible' };
  return propose(withProfile(store, core), investorId, now);
}

/** The founder's answer to an interested investor, from the agent's results (only while it is the founder's turn). */
export function answerFromAgent(store: InboxStore, investorId: string, yes: boolean, now: number): InboxStore {
  const r = latestProposal(store, investorId);
  return r ? answer(store, r.id, yes ? 'yes' : 'no', now) : store;
}

// ---------------------------------------------------------------- investor mode

/** The most recent request received as an investor about this (demo) startup, if any. */
export function latestTeaser(store: InboxStore, startupId: string): InboxRequest | null {
  let latest: InboxRequest | null = null;
  for (const r of store.requests) {
    if (r.role !== 'investor' || r.counterpartId !== startupId) continue;
    if (!latest || r.createdAt > latest.createdAt || (r.createdAt === latest.createdAt && r.id > latest.id)) latest = r;
  }
  return latest;
}

/** What the agent shows the investor for one teaser, read from the inbox (the startup's "no" reads as silence). */
export function agentInvestorStatus(store: InboxStore, startupId: string, now: number): InvestorStatus {
  const r = latestTeaser(store, startupId);
  return investorStatus(r ? viewOf(r, now) : null, !!r && r.state !== 'proposta');
}

/**
 * The investor's "Mi interessa" / "Non ora" from the agent's results. The teaser becomes a request in the inbox's
 * investor tab (or answers the one already there), so the startup's simulated answer arrives on the inbox's demo
 * clock. `matches` are the startups the agent presented: anything else is refused.
 */
export function answerTeaserFromAgent(
  store: InboxStore,
  startupId: string,
  choice: SimAnswer,
  matches: readonly string[],
  now: number,
): InboxStore {
  if (!matches.includes(startupId)) return store;
  let next = store;
  let r = latestTeaser(store, startupId);
  if (!r || viewOf(r, now).status !== 'your-turn') {
    // Only a new teaser, or one that expired before the investor answered, can be answered from here.
    if (r && agentInvestorStatus(store, startupId, now) !== 'idle') return store;
    r = {
      id: `a-${startupId}-${now}`,
      role: 'investor',
      counterpartId: startupId,
      state: 'proposta',
      createdAt: now,
      stepAt: now,
      sim: simulatedAnswer(`investor:${startupId}`),
    };
    next = { ...store, requests: [...store.requests, r] };
  }
  return answer(next, r.id, choice, now);
}
