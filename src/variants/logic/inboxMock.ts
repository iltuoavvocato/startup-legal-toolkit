// The round-3 mock screens of every variant: a double opt-in inbox already filled with requests in different states,
// built on the real inbox rules (src/lib/inbox.ts). Pure; the clock is injected.
//
// The invariant every variant must keep: on the founder side, a proposal the investor declined looks exactly like one
// nobody answered yet. Rows only carry what viewOf() lets the founder see, never the underlying state.
import { DAY_MS, emptyStore, groupRequests, seedInvestorInbox, simulatedAnswer, viewOf, type InboxRequest, type InboxStore, type RequestStatus } from '../../lib/inbox';
import type { OptInState } from '../../lib/optin';

/** Founder proposals of the mock: state and age in days. The declined one (chiusa-investitore) is as old as the waiting one. */
export const FOUNDER_MOCK: readonly { state: OptInState; ageDays: number; stepDays?: number }[] = [
  { state: 'attesa-startup', ageDays: 5, stepDays: 1 },
  { state: 'proposta', ageDays: 3 },
  { state: 'chiusa-investitore', ageDays: 3 },
  { state: 'intro', ageDays: 9 },
  { state: 'proposta', ageDays: 20 },
];

export interface MockRow {
  id: string;
  counterpartId: string;
  status: RequestStatus;
  daysLeft: number | null;
  knowsName: boolean;
}

function request(id: string, role: InboxRequest['role'], counterpartId: string, state: OptInState, createdAt: number, stepAt = createdAt): InboxRequest {
  return { id, role, counterpartId, state, createdAt, stepAt, sim: simulatedAnswer(`${role}:${counterpartId}`) };
}

/** The mock store: one founder proposal per FOUNDER_MOCK entry (to the given investors, in order) and the sample teasers. */
export function mockInbox(investorIds: readonly string[], startupIds: readonly string[], now: number): InboxStore {
  const founder = FOUNDER_MOCK.slice(0, investorIds.length).map((m, k) =>
    request(`f-${k}`, 'founder', investorIds[k]!, m.state, now - m.ageDays * DAY_MS, now - (m.stepDays ?? m.ageDays) * DAY_MS),
  );
  const store = seedInvestorInbox({ ...emptyStore(), requests: founder }, startupIds, now);
  // One teaser already answered by the investor (waiting for the startup) and one intro, so the tab shows every state.
  const investor = store.requests.filter((r) => r.role === 'investor');
  const moved = new Map<string, OptInState>([
    [investor[1]?.id ?? '', 'attesa-startup'],
    [investor[3]?.id ?? '', 'intro'],
  ]);
  return { ...store, requests: store.requests.map((r) => (moved.has(r.id) ? { ...r, state: moved.get(r.id)! } : r)) };
}

const toRow = (r: InboxRequest, now: number): MockRow => {
  const v = viewOf(r, now);
  return { id: r.id, counterpartId: r.counterpartId, status: v.status, daysLeft: v.daysLeft, knowsName: v.knowsName };
};

/** Rows of one side, pending first (soonest deadline), then intros, then expired. */
export function mockRows(store: InboxStore, role: InboxRequest['role'], now: number): MockRow[] {
  const g = groupRequests(store, role, now);
  return [...g.pending, ...g.accepted, ...g.expired].map((r) => toRow(r, now));
}
