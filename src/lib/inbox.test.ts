import { describe, expect, it } from 'vitest';
import {
  actionCount,
  activeProposal,
  advance,
  answer,
  clockOf,
  DAY_MS,
  deadlineOf,
  emptyStore,
  groupRequests,
  parseStore,
  propose,
  proposalCounter,
  seedInvestorInbox,
  serializeStore,
  simulatedAnswer,
  timeTravel,
  viewOf,
  withProfile,
  type InboxRequest,
  type InboxStore,
} from './inbox';
import { MONTHLY_PROPOSAL_LIMIT, REQUEST_EXPIRY_DAYS } from './matchConfig';
import { MONTHLY_PROPOSAL_LIMIT as OPTIN_LIMIT } from './optin';

// Injected clock: 10 October 2026, noon (local time).
const T0 = new Date(2026, 9, 10, 12).getTime();
const days = (n: number) => n * DAY_MS;
const profile = { settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000 } as const;
const withP = (): InboxStore => withProfile(emptyStore(), profile);

function req(over: Partial<InboxRequest>): InboxRequest {
  return {
    id: 'r1',
    role: 'founder',
    counterpartId: 'i01',
    state: 'proposta',
    createdAt: T0,
    stepAt: T0,
    sim: { answer: 'yes', afterDays: 3 },
    ...over,
  };
}

/** Every hour of the next 30 days. */
const timeline = Array.from({ length: 30 * 24 }, (_, h) => T0 + h * 3_600_000);

describe('configuration', () => {
  it('keeps the placeholders in one file and the cap consistent with optin.ts', () => {
    expect(REQUEST_EXPIRY_DAYS).toBe(14);
    expect(OPTIN_LIMIT).toBe(MONTHLY_PROPOSAL_LIMIT);
  });
});

describe('expiry', () => {
  it('counts the days left and expires at the deadline', () => {
    const r = req({});
    expect(viewOf(r, T0)).toMatchObject({ status: 'waiting', group: 'pending', daysLeft: 14 });
    expect(viewOf(r, T0 + days(7)).daysLeft).toBe(7);
    expect(viewOf(r, T0 + days(13) + 1).daysLeft).toBe(1);
    expect(viewOf(r, deadlineOf(r) - 1).group).toBe('pending');
    expect(viewOf(r, deadlineOf(r))).toMatchObject({ status: 'expired', group: 'expired', daysLeft: null });
  });

  it('applies to the step waiting for an answer, on both sides', () => {
    expect(viewOf(req({ state: 'attesa-startup' }), T0 + days(14)).status).toBe('expired');
    expect(viewOf(req({ role: 'investor', state: 'proposta' }), T0 + days(14)).status).toBe('expired');
    expect(viewOf(req({ role: 'investor', state: 'attesa-startup' }), T0 + days(14)).status).toBe('expired');
  });

  it('never expires an intro or the user’s own no', () => {
    expect(viewOf(req({ state: 'intro' }), T0 + days(400)).group).toBe('accepted');
    expect(viewOf(req({ state: 'chiusa-startup' }), T0 + days(1)).status).toBe('declined-by-you');
    expect(viewOf(req({ role: 'investor', state: 'chiusa-investitore' }), T0).status).toBe('declined-by-you');
  });

  it('accepts a custom expiry period', () => {
    expect(viewOf(req({}), T0 + days(3), 3).status).toBe('expired');
  });
});

describe('a “no” is never revealed', () => {
  it('founder: an investor’s no reads exactly like no answer, at every moment', () => {
    for (const now of timeline) {
      expect(viewOf(req({ state: 'chiusa-investitore' }), now)).toEqual(viewOf(req({ state: 'proposta' }), now));
    }
  });

  it('investor: a startup’s no reads exactly like no answer, at every moment', () => {
    for (const now of timeline) {
      const silent = req({ role: 'investor', state: 'attesa-startup' });
      expect(viewOf({ ...silent, state: 'chiusa-startup' }, now)).toEqual(viewOf(silent, now));
    }
  });

  it('a simulated no leaves the founder’s inbox identical to a silent investor, until and after expiry', () => {
    const no = { ...withP(), requests: [req({ sim: { answer: 'no', afterDays: 2 } })] };
    const silent = { ...withP(), requests: [req({ sim: { answer: 'yes', afterDays: 99 } })] };
    for (const now of timeline) {
      const a = advance(no, now);
      const b = advance(silent, now);
      expect(viewOf(a.requests[0]!, now)).toEqual(viewOf(b.requests[0]!, now));
      expect(groupRequests(a, 'founder', now).pending.length).toBe(groupRequests(b, 'founder', now).pending.length);
      expect(actionCount(a, now)).toBe(actionCount(b, now));
      expect(Boolean(activeProposal(a, 'i01', now))).toBe(Boolean(activeProposal(b, 'i01', now)));
    }
  });

  it('a simulated startup no leaves the investor’s view identical to silence', () => {
    const base = req({ role: 'investor', counterpartId: 's01', state: 'attesa-startup' });
    const no = { ...emptyStore(), requests: [{ ...base, sim: { answer: 'no' as const, afterDays: 1 } }] };
    const silent = { ...emptyStore(), requests: [{ ...base, sim: { answer: 'no' as const, afterDays: 99 } }] };
    for (const now of timeline) {
      expect(viewOf(advance(no, now).requests[0]!, now)).toEqual(viewOf(advance(silent, now).requests[0]!, now));
    }
  });

  it('the investor never knows the startup’s name before the intro', () => {
    for (const state of ['proposta', 'attesa-startup', 'chiusa-startup', 'chiusa-investitore'] as const) {
      for (const now of [T0, T0 + days(20)]) expect(viewOf(req({ role: 'investor', state }), now).knowsName).toBe(false);
    }
    expect(viewOf(req({ role: 'investor', state: 'intro' }), T0).knowsName).toBe(true);
  });

  it('no status ever says “declined by the other side”', () => {
    const statuses = new Set<string>();
    for (const role of ['founder', 'investor'] as const)
      for (const state of ['proposta', 'attesa-startup', 'chiusa-investitore', 'chiusa-startup', 'intro'] as const)
        for (const now of [T0, T0 + days(20)]) statuses.add(viewOf(req({ role, state }), now).status);
    expect([...statuses].sort()).toEqual(['declined-by-you', 'expired', 'intro', 'waiting', 'your-turn']);
  });
});

describe('state transitions', () => {
  it('founder: proposal → investor yes (simulated) → founder accepts → intro', () => {
    const p = propose(withP(), 'i01', T0);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const r = p.store.requests[0]!;
    expect(r).toMatchObject({ role: 'founder', state: 'proposta', createdAt: T0, stepAt: T0 });
    const yes = { ...p.store, requests: [{ ...r, sim: { answer: 'yes' as const, afterDays: 3 } }] };
    expect(advance(yes, T0 + days(3) - 1)).toBe(yes);
    const after = advance(yes, T0 + days(3));
    const asked = after.requests[0]!;
    expect(asked.state).toBe('attesa-startup');
    // The investor's yes opens a new 14-day step for the founder.
    expect(asked.stepAt).toBe(T0 + days(3));
    expect(viewOf(asked, T0 + days(10))).toMatchObject({ status: 'your-turn', daysLeft: 7 });
    expect(actionCount(after, T0 + days(3))).toBe(1);
    const accepted = answer(after, asked.id, 'yes', T0 + days(4));
    expect(accepted.requests[0]!.state).toBe('intro');
    expect(groupRequests(accepted, 'founder', T0 + days(4)).accepted).toHaveLength(1);
  });

  it('founder declines: closed for the founder, the investor’s side would keep waiting', () => {
    const s = { ...withP(), requests: [req({ state: 'attesa-startup' })] };
    const d = answer(s, 'r1', 'no', T0 + days(1));
    expect(d.requests[0]!.state).toBe('chiusa-startup');
    expect(viewOf(d.requests[0]!, T0 + days(1)).status).toBe('declined-by-you');
  });

  it('investor: yes starts a new step, then the simulated startup answer arrives', () => {
    const s = { ...emptyStore(), requests: [req({ role: 'investor', counterpartId: 's01', sim: { answer: 'yes', afterDays: 2 } })] };
    const y = answer(s, 'r1', 'yes', T0 + days(5));
    expect(y.requests[0]).toMatchObject({ state: 'attesa-startup', stepAt: T0 + days(5) });
    expect(advance(y, T0 + days(7)).requests[0]!.state).toBe('intro');
    const n = answer(s, 'r1', 'no', T0 + days(1));
    expect(viewOf(n.requests[0]!, T0 + days(1)).status).toBe('declined-by-you');
  });

  it('answers are ignored when it isn’t the user’s turn or the request expired', () => {
    const waiting = { ...withP(), requests: [req({ state: 'proposta' })] };
    expect(answer(waiting, 'r1', 'yes', T0)).toBe(waiting);
    const late = { ...withP(), requests: [req({ state: 'attesa-startup' })] };
    expect(answer(late, 'r1', 'yes', T0 + days(14))).toBe(late);
    expect(answer(late, 'missing', 'yes', T0)).toBe(late);
  });

  it('simulated answers that would arrive after the deadline never arrive', () => {
    const s = { ...withP(), requests: [req({ sim: { answer: 'yes', afterDays: 14 } })] };
    expect(advance(s, T0 + days(30))).toBe(s);
  });

  it('simulated answers are deterministic and plausible', () => {
    expect(simulatedAnswer('founder:i01')).toEqual(simulatedAnswer('founder:i01'));
    const all = Array.from({ length: 60 }, (_, k) => simulatedAnswer(`x${k}`));
    expect(all.some((a) => a.answer === 'yes')).toBe(true);
    expect(all.some((a) => a.answer === 'no')).toBe(true);
    for (const a of all) expect(a.afterDays).toBeGreaterThanOrEqual(1);
  });
});

describe('proposals and the monthly cap', () => {
  it('needs a profile and refuses a duplicate while one is open', () => {
    expect(propose(emptyStore(), 'i01', T0)).toEqual({ ok: false, reason: 'no-profile' });
    const p = propose(withP(), 'i01', T0);
    if (!p.ok) throw new Error('expected ok');
    expect(propose(p.store, 'i01', T0 + days(1))).toEqual({ ok: false, reason: 'already-sent' });
  });

  it('allows a new proposal once the previous one expired (declined or not: same rule)', () => {
    for (const state of ['proposta', 'chiusa-investitore'] as const) {
      const s = { ...withP(), requests: [req({ state })] };
      expect(propose(s, 'i01', T0 + days(13)).ok).toBe(false);
      expect(propose(s, 'i01', T0 + days(14)).ok).toBe(true);
    }
  });

  it('stops at the limit within a month and restarts the next month', () => {
    let s = withP();
    for (let k = 0; k < MONTHLY_PROPOSAL_LIMIT; k++) {
      const r = propose(s, `i0${k + 1}`, T0 + k);
      if (!r.ok) throw new Error(`proposal ${k + 1} refused`);
      s = r.store;
    }
    expect(proposalCounter(s, T0)).toEqual({ month: '2026-10', used: MONTHLY_PROPOSAL_LIMIT });
    expect(propose(s, 'i09', T0 + 10)).toEqual({ ok: false, reason: 'limit' });
    const november = new Date(2026, 10, 2, 12).getTime();
    expect(proposalCounter(s, november).used).toBe(0);
    expect(propose(s, 'i09', november).ok).toBe(true);
  });

  it('expired proposals still count for the month', () => {
    const s = { ...withP(), requests: [req({ createdAt: T0 - days(9), stepAt: T0 - days(9) })] };
    expect(viewOf(s.requests[0]!, T0 + days(6)).status).toBe('expired');
    expect(proposalCounter(s, T0 + days(6)).used).toBe(1);
  });

  it('accepts a custom limit', () => {
    const p = propose(withP(), 'i01', T0, 1);
    if (!p.ok) throw new Error('expected ok');
    expect(propose(p.store, 'i02', T0, 1)).toEqual({ ok: false, reason: 'limit' });
  });
});

describe('demo clock, seeding and grouping', () => {
  it('time travel moves the demo clock forward only', () => {
    const s = timeTravel(timeTravel(emptyStore(), 7), 7);
    expect(clockOf(s, T0)).toBe(T0 + days(14));
    expect(timeTravel(s, -3).offsetDays).toBe(14);
  });

  it('“Simula +7 giorni” twice expires an unanswered proposal', () => {
    let s = { ...withP(), requests: [req({ sim: { answer: 'no', afterDays: 2 } })] };
    s = timeTravel(s, 7);
    s = advance(s, clockOf(s, T0));
    expect(viewOf(s.requests[0]!, clockOf(s, T0))).toMatchObject({ status: 'waiting', daysLeft: 7 });
    s = timeTravel(s, 7);
    s = advance(s, clockOf(s, T0));
    expect(groupRequests(s, 'founder', clockOf(s, T0)).expired).toHaveLength(1);
  });

  it('seeds the investor inbox once, with different ages', () => {
    const s = seedInvestorInbox(emptyStore(), ['s01', 's02', 's03', 's04', 's05'], T0);
    const inv = s.requests.filter((r) => r.role === 'investor');
    expect(inv).toHaveLength(4);
    expect(new Set(inv.map((r) => viewOf(r, T0).daysLeft)).size).toBe(4);
    expect(seedInvestorInbox(s, ['s06'], T0)).toBe(s);
  });

  it('groups by role: pending soonest deadline first', () => {
    const s = seedInvestorInbox(emptyStore(), ['s01', 's02', 's03', 's04'], T0);
    const g = groupRequests(s, 'investor', T0);
    expect(g.pending.map((r) => viewOf(r, T0).daysLeft)).toEqual([2, 6, 10, 13]);
    expect(groupRequests(s, 'founder', T0).pending).toEqual([]);
  });
});

describe('storage format', () => {
  it('round-trips and keeps only enumerated profile fields', () => {
    const p = propose(withP(), 'i01', T0);
    if (!p.ok) throw new Error('expected ok');
    const s = timeTravel(p.store, 7);
    expect(parseStore(serializeStore(s))).toEqual(s);
    const extra = parseStore(JSON.stringify({ ...s, profile: { ...profile, nome: 'Segreta', oneLiner: 'x' } }));
    expect(extra.profile).toEqual(profile);
  });

  it('gives an empty inbox for missing or malformed data and drops bad requests', () => {
    expect(parseStore(null)).toEqual(emptyStore());
    expect(parseStore('{oops')).toEqual(emptyStore());
    expect(parseStore(JSON.stringify({ v: 2, requests: [] }))).toEqual(emptyStore());
    const mixed = parseStore(JSON.stringify({ v: 1, offsetDays: -1, profile: { settore: 'x' }, requests: [req({}), { id: 1 }] }));
    expect(mixed.requests).toHaveLength(1);
    expect(mixed.offsetDays).toBe(0);
    expect(mixed.profile).toBeNull();
  });
});
