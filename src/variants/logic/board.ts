// Investor-side double opt-in for many teasers at once (local state only), built on the real state machine.
import type { Locale } from '../../i18n/locales';
import { transition, viewFor, type OptInEvent, type OptInState, type SideView } from '../../lib/optin';

export type Board = Readonly<Record<string, OptInState>>;

export const stateOf = (b: Board, id: string): OptInState => b[id] ?? 'proposta';

export function apply(b: Board, id: string, event: OptInEvent): Board {
  return { ...b, [id]: transition(stateOf(b, id), event) };
}

/**
 * Fictional answer of a demo startup, deterministic per id so the demo is repeatable: some accept, some decline.
 * The investor never learns about a decline (see investorStatus).
 */
export function demoReply(id: string): 'STARTUP_YES' | 'STARTUP_NO' {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return sum % 3 === 2 ? 'STARTUP_NO' : 'STARTUP_YES';
}

/** Simulates the startup's answer to an interest already sent; no-op in any other state. */
export function simulateReply(b: Board, id: string): Board {
  return stateOf(b, id) === 'attesa-startup' ? apply(b, id, demoReply(id)) : b;
}

/** What the investor sees. A startup's "no" looks exactly like no answer yet. */
export function investorStatus(b: Board, id: string, locale: Locale = 'it'): SideView {
  return viewFor(stateOf(b, id), 'investitore', locale);
}

export type InvestorBucket = 'nuovo' | 'passato' | 'inviato' | 'intro';

/** Bucket shown to the investor: declined and pending both count as "interest sent". */
export function bucketOf(b: Board, id: string): InvestorBucket {
  switch (stateOf(b, id)) {
    case 'proposta':
      return 'nuovo';
    case 'chiusa-investitore':
      return 'passato';
    case 'attesa-startup':
    case 'chiusa-startup':
      return 'inviato';
    case 'intro':
      return 'intro';
  }
}

export function bucketCounts(b: Board, ids: readonly string[]): Record<InvestorBucket, number> {
  const counts: Record<InvestorBucket, number> = { nuovo: 0, passato: 0, inviato: 0, intro: 0 };
  for (const id of ids) counts[bucketOf(b, id)]++;
  return counts;
}
