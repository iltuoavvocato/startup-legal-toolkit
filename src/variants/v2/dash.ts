// V2 Dashboard: small pure helpers (KPIs, keyboard shortcuts, stacked score bars). Pure.
import { scoreBand, WEIGHTS, type Parts, type ScoreBand } from '../../lib/matching';
import { bucketOf, type Board, type InvestorBucket } from '../logic/board';
import type { SortState } from '../logic/table';

export const PART_KEYS = ['settore', 'ticket', 'fase', 'area'] as const;
export type PartKey = (typeof PART_KEYS)[number];

/** Rounded average score of the rows; 0 for no rows. */
export function avgScore(rows: readonly { evaluation: { score: number } }[]): number {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((s, r) => s + r.evaluation.score, 0) / rows.length);
}

/** Highest score of the rows; 0 for no rows. */
export function topScore(rows: readonly { evaluation: { score: number } }[]): number {
  return rows.reduce((m, r) => Math.max(m, r.evaluation.score), 0);
}

/** How many rows fall in each score band. */
export function bandTally(rows: readonly { evaluation: { score: number } }[]): Record<ScoreBand, number> {
  const out: Record<ScoreBand, number> = {
    'molto-affine': 0,
    affine: 0,
    'da-valutare': 0,
  };
  for (const r of rows) out[scoreBand(r.evaluation.score).band]++;
  return out;
}

/**
 * Segments of a stacked score bar: each part's points as a share of 100 (the bar's full width),
 * so the segments together are as long as the score itself.
 */
export function stackedSegments(parts: Parts): { key: PartKey; width: number }[] {
  return PART_KEYS.map((key) => ({
    key,
    width: Math.round(Math.max(0, parts[key]) * 10) / 10,
  }));
}

/** Points of one part, formatted with at most one decimal, and its maximum. */
export function partPoints(parts: Parts, key: PartKey): { pts: number; max: number } {
  return { pts: Math.round(parts[key] * 10) / 10, max: WEIGHTS[key] };
}

export type RowShortcut = 'toggle' | 'interested' | 'pass';

/** Row-level shortcuts (besides navigation): Enter/Space toggle details, i Interested, p Pass. */
export function rowShortcut(key: string): RowShortcut | null {
  if (key === 'Enter' || key === ' ') return 'toggle';
  if (key === 'i' || key === 'I') return 'interested';
  if (key === 'p' || key === 'P') return 'pass';
  return null;
}

/** True when keystrokes belong to a text field (then "/" and letters must not be hijacked). */
export function isTypingTarget(el: { tagName?: string; isContentEditable?: boolean; type?: string } | null): boolean {
  if (!el || !el.tagName) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  const type = (el.type ?? 'text').toLowerCase();
  return !['checkbox', 'radio', 'range', 'button', 'submit', 'reset'].includes(type);
}

export type BucketTab = InvestorBucket | 'all';
export const BUCKET_TABS: readonly BucketTab[] = ['all', 'nuovo', 'inviato', 'intro', 'passato'];

export function inTab(board: Board, id: string, tab: BucketTab): boolean {
  return tab === 'all' || bucketOf(board, id) === tab;
}

/** aria-sort value for a column header; undefined for inactive columns. */
export function ariaSort<K extends string>(s: SortState<K>, key: K): 'ascending' | 'descending' | undefined {
  if (s.key !== key) return undefined;
  return s.dir === 'asc' ? 'ascending' : 'descending';
}

/** Parses a euro amount typed by the user ("500.000", "500000", "€ 1,000,000"); null unless > 0. */
export function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 && n <= 1_000_000_000 ? n : null;
}

/** Keeps a row index inside a list after it shrank; 0 for an empty list. */
export function clampIndex(index: number, length: number): number {
  return length ? Math.min(Math.max(0, index), length - 1) : 0;
}
