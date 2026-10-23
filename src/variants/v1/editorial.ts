// V1 "Editoriale": small pure helpers for the magazine layout.
import { WEIGHTS, type Parts } from '../../lib/matching';
import { bucketOf, type Board, type InvestorBucket } from '../logic/board';

export type PartKey = keyof Parts;
export const PART_ORDER: readonly PartKey[] = ['settore', 'ticket', 'fase', 'area'];

/** Rank as a two-digit editorial numeral: 1 → "01". */
export function rankNumeral(n: number): string {
  return String(Math.max(0, Math.trunc(n))).padStart(2, '0');
}

/** Score 0–100 clamped, for the width of the thin score rule. */
export function barPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/** Score parts in reading order with their maximum. */
export function scoreParts(parts: Parts): { key: PartKey; value: number; max: number }[] {
  return PART_ORDER.map((key) => ({ key, value: parts[key], max: WEIGHTS[key] }));
}

/**
 * Whether the investor can still simulate the startup's answer for this teaser. Once simulated, the button goes
 * away whatever the answer was, so a startup's "no" looks exactly like a pending request.
 */
export function canSimulate(board: Board, id: string, simulated: ReadonlySet<string>): boolean {
  return bucketOf(board, id) === 'inviato' && !simulated.has(id);
}

/** Order of the summary line in the investor index. */
export const BUCKETS: readonly InvestorBucket[] = ['nuovo', 'inviato', 'intro', 'passato'];
