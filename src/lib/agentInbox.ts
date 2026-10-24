// The guided intake ("Parla con l'agente") and the shared requests inbox: the agent's founder proposals are recorded in
// the same inbox, with the same monthly counter, as the form results and the directory. Pure functions over the
// inbox store and the conversation's answers; the clock is injected.
import { answer, latestProposal, propose, viewOf, withProfile, type InboxStore, type ProposeResult } from './inbox';
import { founderStatus, startupCoreOf, type Answers, type FounderStatus } from './intakeAgent';

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
