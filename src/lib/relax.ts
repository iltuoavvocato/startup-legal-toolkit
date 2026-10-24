import type { Locale } from '../i18n/locales';
import { matchInvestors, matchStartups, type FilterId, type Ranked } from './matching';
import { ownInvestor, type Thesis } from './matchQuery';
import { AREA_DI, type Investor, type StartupProfile } from './matchTaxonomy';

/** Fixed order used to break ties between equally useful relaxations (cheapest change first). */
const FILTER_ORDER: readonly FilterId[] = ['ticket', 'area', 'fase', 'settore'];

export interface Relaxation<P> {
  /** Criteria that change, in FILTER_ORDER. */
  filters: FilterId[];
  /** How many new matches the change brings. Always ≥ 1. */
  unlocks: number;
  /** The edited profile or thesis. */
  patched: P;
}

export interface NearMisses<T, P> {
  /** Excluded entries with the fewest failed criteria (at most `limit`). */
  closest: Ranked<T>[];
  /** The single edit that brings the most matches, or null when nothing helps. */
  suggestion: Relaxation<P> | null;
}

function sameSet(a: FilterId[], b: FilterId[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

function closestOf<T>(excluded: Ranked<T>[], limit: number): Ranked<T>[] {
  const first = excluded[0];
  if (!first) return [];
  const min = Math.min(...excluded.map((x) => x.evaluation.failed.length));
  return excluded.filter((x) => x.evaluation.failed.length === min).slice(0, limit);
}

/**
 * Candidate edits: for each criterion, the edit that admits every entry failing only that criterion; plus the edit that
 * admits the closest entry (all its failed criteria). Each is scored by the real number of matches it gives.
 */
function best<T, P>(
  excluded: Ranked<T>[],
  baseline: number,
  patch: (p: P, targets: T[], filters: FilterId[]) => P | null,
  base: P,
  count: (p: P) => number,
): Relaxation<P> | null {
  const candidates: FilterId[][] = FILTER_ORDER.map((f) => [f]);
  const first = excluded[0];
  if (first) candidates.push(FILTER_ORDER.filter((f) => first.evaluation.failed.includes(f)));
  let winner: Relaxation<P> | null = null;
  for (const filters of candidates) {
    const targets = excluded.filter((x) => sameSet(x.evaluation.failed, filters)).map((x) => x.item);
    if (!targets.length) continue;
    const patched = patch(base, targets, filters);
    if (!patched) continue;
    const unlocks = count(patched) - baseline;
    if (unlocks <= 0) continue;
    if (!winner || unlocks > winner.unlocks || (unlocks === winner.unlocks && filters.length < winner.filters.length)) {
      winner = { filters, unlocks, patched };
    }
  }
  return winner;
}

/** Widens an investor thesis just enough to admit `targets` on the given criteria. */
export function widenThesis(thesis: Thesis, targets: StartupProfile[], filters: FilterId[]): Thesis {
  const next: Thesis = { ...thesis, settori: [...thesis.settori], fasi: [...thesis.fasi] };
  if (next.aree !== 'italia') next.aree = [...next.aree];
  for (const s of targets) {
    if (filters.includes('settore') && !next.settori.includes(s.settore)) next.settori.push(s.settore);
    if (filters.includes('fase') && !next.fasi.includes(s.fase)) next.fasi.push(s.fase);
    if (filters.includes('area') && next.aree !== 'italia' && !next.aree.includes(AREA_DI[s.regione])) next.aree.push(AREA_DI[s.regione]);
    if (filters.includes('ticket')) next.ticketMin = Math.min(next.ticketMin, s.round);
  }
  return next;
}

/**
 * Investor side: the closest startups that don't fit and the one-click widening of the thesis that brings in the most.
 */
export function thesisNearMisses(
  thesis: Thesis,
  startups: readonly StartupProfile[],
  locale: Locale = 'it',
  limit = 3,
): NearMisses<StartupProfile, Thesis> {
  const count = (t: Thesis) => matchStartups(ownInvestor(t, undefined, locale), startups, locale).matches.length;
  const { matches, excluded } = matchStartups(ownInvestor(thesis, undefined, locale), startups, locale);
  return {
    closest: closestOf(excluded, limit),
    suggestion: best(excluded, matches.length, widenThesis, thesis, count),
  };
}

/**
 * Startup side. Sector, stage and region are facts about the startup, so the only criterion it can change is the round:
 * the suggestion raises it to the lowest minimum ticket that admits the investors failing only on the ticket.
 */
export function profileNearMisses(
  profile: StartupProfile,
  investors: readonly Investor[],
  locale: Locale = 'it',
  limit = 3,
): NearMisses<Investor, StartupProfile> {
  const count = (p: StartupProfile) => matchInvestors(p, investors, locale).matches.length;
  const { matches, excluded } = matchInvestors(profile, investors, locale);
  const patch = (p: StartupProfile, targets: Investor[], filters: FilterId[]): StartupProfile | null => {
    if (!sameSet(filters, ['ticket'])) return null;
    const round = Math.min(...targets.map((i) => i.ticketMin));
    return round > p.round ? { ...p, round } : null;
  };
  return { closest: closestOf(excluded, limit), suggestion: best(excluded, matches.length, patch, profile, count) };
}
