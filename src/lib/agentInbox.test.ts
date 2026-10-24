import { describe, expect, it } from 'vitest';
import { demoInvestors, demoStartups } from '../data/matchDemo';
import { agentFounderStatus, answerFromAgent, proposeFromAgent } from './agentInbox';
import {
  actionCount,
  advance,
  DAY_MS,
  emptyStore,
  latestProposal,
  parseStore,
  propose,
  proposalCounter,
  serializeStore,
  simulatedAnswer,
  withProfile,
  type InboxStore,
} from './inbox';
import { initIntake, matchIdsOf, reduce, resultIdsFor, type Action, type Answers, type AnswerValue, type IntakeState } from './intakeAgent';
import { MONTHLY_PROPOSAL_LIMIT, REQUEST_EXPIRY_DAYS } from './matchConfig';

// Injected clock: 10 October 2026, noon (local time).
const T0 = new Date(2026, 9, 10, 12).getTime();
const days = (n: number) => n * DAY_MS;
const R = (s: IntakeState) => resultIdsFor(s, demoInvestors(), demoStartups());
const run = (s: IntakeState, ...actions: Action[]) => actions.reduce((st, a) => reduce(st, a, R), s);
const ans = (value: AnswerValue): Action => ({ type: 'ANSWER', value });

/** The guided intake with the "Usa un esempio" answers (fintech, seed, Lombardia, 500.000 €), at the results. */
function agentResults(): IntakeState {
  return run(initIntake('startup'), ans('skip'), ans('fintech'), ans('seed'), ans(500_000), ans('lombardia'), ans('Pagamenti istantanei per le PMI'), ans('go'));
}

const answers = (): Answers => agentResults().answers;
const matches = () => matchIdsOf(agentResults());

function proposeAll(store: InboxStore, ids: readonly string[], now: number): InboxStore {
  return ids.reduce((s, id) => {
    const r = proposeFromAgent(s, answers(), id, matches(), now);
    return r.ok ? r.store : s;
  }, store);
}

describe('agent proposals in the shared inbox', () => {
  it('reaches the results with the example and lists the matches it presented', () => {
    const s = agentResults();
    expect(s.phase).toBe('results');
    expect(matches().length).toBeGreaterThanOrEqual(MONTHLY_PROPOSAL_LIMIT);
    expect(matches()).toEqual(R(s).matches);
  });

  it('records the proposal and the profile (enumerated fields only) in the inbox', () => {
    const [a] = matches();
    const r = proposeFromAgent(emptyStore(), { ...answers(), oneLiner: 'Pagamenti per PMI' }, a!, matches(), T0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.store.profile).toEqual({ settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000 });
    expect(r.store.requests).toHaveLength(1);
    expect(r.store.requests[0]).toMatchObject({ role: 'founder', counterpartId: a, state: 'proposta', createdAt: T0 });
    expect(serializeStore(r.store)).not.toContain('Pagamenti');
    expect(agentFounderStatus(r.store, a!, [], T0)).toBe('waiting');
    // Never twice while the proposal is open.
    expect(proposeFromAgent(r.store, answers(), a!, matches(), T0 + days(1))).toEqual({ ok: false, reason: 'already-sent' });
  });

  it('refuses incomplete profiles and investors the agent did not propose', () => {
    expect(proposeFromAgent(emptyStore(), {}, 'i01', ['i01'], T0)).toEqual({ ok: false, reason: 'no-profile' });
    const outside = demoInvestors().map((i) => i.id).find((id) => !matches().includes(id))!;
    expect(proposeFromAgent(emptyStore(), answers(), outside, matches(), T0)).toEqual({ ok: false, reason: 'not-eligible' });
  });

  it('shares one monthly counter with the form results and the directory', () => {
    const ids = matches();
    // Two proposals from the form / directory (inbox.propose), then the agent fills the rest of the month's cap.
    let store = withProfile(emptyStore(), { settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000 });
    for (const id of ids.slice(0, 2)) {
      const r = propose(store, id, T0);
      if (r.ok) store = r.store;
    }
    expect(proposalCounter(store, T0).used).toBe(2);
    store = proposeAll(store, ids.slice(2, MONTHLY_PROPOSAL_LIMIT), T0 + days(1));
    expect(proposalCounter(store, T0 + days(1)).used).toBe(MONTHLY_PROPOSAL_LIMIT);
    const extra = ids[MONTHLY_PROPOSAL_LIMIT] ?? demoInvestors().find((i) => !ids.includes(i.id))!.id;
    const refused = proposeFromAgent(store, answers(), extra, [...ids, extra], T0 + days(1));
    expect(refused).toEqual({ ok: false, reason: 'limit' });
    // And the other way round: after the agent used the cap, the form's propose is refused too.
    expect(propose(store, extra, T0 + days(1))).toEqual({ ok: false, reason: 'limit' });
    // A new calendar month starts again (the counter follows months, as everywhere else).
    const november = new Date(2026, 10, 2, 12).getTime();
    expect(proposalCounter(store, november).used).toBe(0);
  });

  it('a "no" from the investor reads exactly like no answer, at every moment (no reveal)', () => {
    const ids = matches();
    const no = ids.find((id) => simulatedAnswer(`founder:${id}`).answer === 'no');
    const yes = ids.find((id) => simulatedAnswer(`founder:${id}`).answer === 'yes');
    expect(no && yes).toBeTruthy();
    const proposed = proposeAll(emptyStore(), [no!], T0);
    // Same proposal, but the investor never answers: a counterfactual store where the simulated answer can't arrive.
    const silent: InboxStore = {
      ...proposed,
      requests: proposed.requests.map((r) => ({ ...r, sim: { answer: 'no' as const, afterDays: REQUEST_EXPIRY_DAYS + 5 } })),
    };
    for (let d = 0; d <= REQUEST_EXPIRY_DAYS + 3; d++) {
      const now = T0 + days(d) + 1;
      const a = advance(proposed, now);
      const b = advance(silent, now);
      expect(agentFounderStatus(a, no!, [], now)).toBe(agentFounderStatus(b, no!, [], now));
      expect(actionCount(a, now)).toBe(actionCount(b, now));
    }
    expect(agentFounderStatus(advance(proposed, T0 + days(REQUEST_EXPIRY_DAYS)), no!, [], T0 + days(REQUEST_EXPIRY_DAYS))).toBe('expired');
    // After expiry it can be proposed again, exactly as after silence.
    const later = T0 + days(REQUEST_EXPIRY_DAYS + 1);
    expect(proposeFromAgent(advance(proposed, later), answers(), no!, ids, later).ok).toBe(true);
    expect(proposeFromAgent(advance(silent, later), answers(), no!, ids, later).ok).toBe(true);
  });

  it('an interested investor asks the founder; accepting gives the intro, declining tells the investor nothing', () => {
    const ids = matches();
    const yes = ids.find((id) => simulatedAnswer(`founder:${id}`).answer === 'yes')!;
    const at = T0 + days(simulatedAnswer(`founder:${yes}`).afterDays);
    const store = advance(proposeAll(emptyStore(), [yes], T0), at);
    expect(agentFounderStatus(store, yes, [], at)).toBe('request');
    expect(actionCount(store, at)).toBe(1);
    const accepted = answerFromAgent(store, yes, true, at);
    expect(agentFounderStatus(accepted, yes, [], at)).toBe('intro');
    expect(latestProposal(accepted, yes)!.state).toBe('intro');
    const declined = answerFromAgent(store, yes, false, at);
    expect(agentFounderStatus(declined, yes, [], at)).toBe('declined');
    // The investor-side state is "chiusa-startup", which the inbox shows to an investor exactly like waiting.
    expect(latestProposal(declined, yes)!.state).toBe('chiusa-startup');
    // Answering is only possible on the founder's turn.
    expect(answerFromAgent(proposeAll(emptyStore(), [yes], T0), yes, true, T0)).toEqual(proposeAll(emptyStore(), [yes], T0));
    expect(answerFromAgent(emptyStore(), yes, true, T0)).toEqual(emptyStore());
  });

  it('proposals made in the agent show up in the inbox storage, without names or texts', () => {
    const store = proposeAll(emptyStore(), matches().slice(0, 3), T0);
    const back = parseStore(serializeStore(store));
    expect(back.requests).toHaveLength(3);
    expect(serializeStore(back)).not.toMatch(/"(nome|founder|oneLiner|email)":/);
  });

  it('"passed" is only shown while nothing was proposed; the inbox wins once a proposal exists', () => {
    const [a] = matches();
    expect(agentFounderStatus(emptyStore(), a!, [a!], T0)).toBe('passed');
    const store = proposeAll(emptyStore(), [a!], T0);
    expect(agentFounderStatus(store, a!, [a!], T0)).toBe('waiting');
  });
});
