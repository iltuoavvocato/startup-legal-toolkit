// V5 "Dark premium": small pure helpers (score breakdown bars, list navigation, mono numbering).
import { WEIGHTS, type Parts } from '../../lib/matching';

export const PART_KEYS = ['settore', 'ticket', 'fase', 'area'] as const;
export type PartKey = (typeof PART_KEYS)[number];

export interface PartBar {
  key: PartKey;
  /** Points, rounded to an integer for display. */
  value: number;
  max: number;
  /** 0–100, for the bar width. */
  pct: number;
}

/** The four parts of a score as bars, in the engine's order, clamped to 0–max. */
export function partBars(parts: Parts): PartBar[] {
  return PART_KEYS.map((key) => {
    const max = WEIGHTS[key];
    const value = Math.max(0, Math.min(max, Math.round(parts[key])));
    return { key, value, max, pct: max > 0 ? Math.round((value / max) * 100) : 0 };
  });
}

/** Index after a list key press (ArrowUp/ArrowDown/Home/End), or null when the key is not handled. Clamped, no wrap. */
export function nextIndex(key: string, current: number, length: number): number | null {
  if (length <= 0) return null;
  const last = length - 1;
  const from = Math.max(0, Math.min(last, current));
  switch (key) {
    case 'ArrowDown':
      return Math.min(last, from + 1);
    case 'ArrowUp':
      return Math.max(0, from - 1);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return null;
  }
}

/** Two-digit mono numbering: 1 → "01", 12 → "12". */
export const pad2 = (n: number) => String(Math.max(0, Math.trunc(n))).padStart(2, '0');

/** Width (0–100) of the monthly proposals bar. */
export const usedPct = (used: number, limit: number) => (limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0);
