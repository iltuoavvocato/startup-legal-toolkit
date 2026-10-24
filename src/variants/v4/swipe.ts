// V4 "Card e swipe": small pure helpers for the deck UI (keyboard filtering, drag feedback, undo rules, grouping).
import { keyAction, lastDecision, type Decision, type DeckState } from '../logic/deck';
import { bucketOf, type Board, type InvestorBucket } from '../logic/board';

export interface KeyLike {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  defaultPrevented?: boolean;
}

export interface TargetLike {
  tagName?: string;
  isContentEditable?: boolean;
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** True when keystrokes belong to a form field (or editable content) and must not drive the deck. */
export function isTypingTarget(target: TargetLike | null | undefined): boolean {
  if (!target) return false;
  return Boolean(target.isContentEditable) || TYPING_TAGS.has((target.tagName ?? '').toUpperCase());
}

/** Deck action for a keydown, or null: ignores modifiers, already handled events and typing targets. */
export function deckKey(e: KeyLike, target: TargetLike | null | undefined): Decision | 'undo' | null {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return null;
  if (isTypingTarget(target)) return null;
  return keyAction(e.key);
}

/** Card rotation (degrees) while dragging by dx pixels; capped so the card never spins wildly. */
export function tiltFor(dx: number, max = 12): number {
  const deg = dx / 18;
  return Math.max(-max, Math.min(max, Math.round(deg * 10) / 10));
}

/** 0–1 strength of the Pass / Interested hint while dragging (1 at the swipe threshold). */
export function swipeIntensity(dx: number, threshold = 90): number {
  if (threshold <= 0) return 0;
  return Math.min(1, Math.abs(dx) / threshold);
}

/**
 * Undo is offered only when the last decision was a pass: an interest (or a proposal) already sent
 * can't be withdrawn.
 */
export function undoAllowed(d: DeckState): boolean {
  return lastDecision(d)?.decision === 'pass';
}

/** True when the last decision exists but can't be undone (to explain why the undo button is off). */
export function undoLocked(d: DeckState): boolean {
  return lastDecision(d)?.decision === 'interested';
}

/** 1-based position of the card on screen, capped at the deck size. */
export function position(d: DeckState): number {
  return Math.min(d.index + 1, d.ids.length);
}

export const BUCKET_ORDER: readonly InvestorBucket[] = ['intro', 'inviato', 'passato', 'nuovo'];

/** Ids grouped by what the investor sees (declined and pending both land in 'inviato'). */
export function groupByBucket(board: Board, ids: readonly string[]): Record<InvestorBucket, string[]> {
  const out: Record<InvestorBucket, string[]> = { intro: [], inviato: [], passato: [], nuovo: [] };
  for (const id of ids) out[bucketOf(board, id)].push(id);
  return out;
}
