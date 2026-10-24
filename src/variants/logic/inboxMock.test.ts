import { describe, expect, it } from 'vitest';
import { DAY_MS } from '../../lib/inbox';
import { FOUNDER_MOCK, mockInbox, mockRows } from './inboxMock';

const NOW = Date.UTC(2026, 9, 24, 9);
const INVESTORS = ['i1', 'i2', 'i3', 'i4', 'i5'];
const STARTUPS = ['s1', 's2', 's3', 's4', 's5'];

describe('round-3 inbox mock', () => {
  const store = mockInbox(INVESTORS, STARTUPS, NOW);

  it('shows the founder every visible state: interested (your turn), waiting, intro, expired', () => {
    const statuses = mockRows(store, 'founder', NOW).map((r) => r.status);
    expect(new Set(statuses)).toEqual(new Set(['your-turn', 'waiting', 'intro', 'expired']));
    expect(statuses).toHaveLength(FOUNDER_MOCK.length);
  });

  it('a declined proposal looks exactly like one nobody answered (founder side)', () => {
    const rows = mockRows(store, 'founder', NOW);
    const declined = store.requests.find((r) => r.state === 'chiusa-investitore')!;
    const waiting = store.requests.find((r) => r.role === 'founder' && r.state === 'proposta' && r.createdAt === declined.createdAt)!;
    const strip = (r: (typeof rows)[number]) => ({ status: r.status, daysLeft: r.daysLeft, knowsName: r.knowsName });
    const a = rows.find((r) => r.id === declined.id)!;
    const b = rows.find((r) => r.id === waiting.id)!;
    expect(strip(a)).toEqual(strip(b));
    expect(a.status).toBe('waiting');
    // And after the deadline both are simply expired.
    const later = NOW + 15 * DAY_MS;
    const after = mockRows(store, 'founder', later);
    expect(strip(after.find((r) => r.id === declined.id)!)).toEqual(strip(after.find((r) => r.id === waiting.id)!));
    expect(after.find((r) => r.id === declined.id)!.status).toBe('expired');
  });

  it('investor teasers stay anonymous until the intro', () => {
    const rows = mockRows(store, 'investor', NOW);
    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.status))).toEqual(new Set(['your-turn', 'waiting', 'intro']));
    for (const r of rows) expect(r.knowsName).toBe(r.status === 'intro');
  });

  it('is deterministic for a given clock', () => {
    expect(mockInbox(INVESTORS, STARTUPS, NOW)).toEqual(store);
  });
});
