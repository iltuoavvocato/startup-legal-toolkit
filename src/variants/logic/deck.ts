// Card / swipe deck: one item at a time, decide Pass or Interested, undo the last decision. Pure.
export type Decision = 'pass' | 'interested';

export interface DeckState {
  ids: readonly string[];
  /** Index of the current card; equals ids.length when the deck is finished. */
  index: number;
  decisions: Readonly<Record<string, Decision>>;
}

export function createDeck(ids: readonly string[]): DeckState {
  return { ids: [...ids], index: 0, decisions: {} };
}

export const current = (d: DeckState): string | null => d.ids[d.index] ?? null;
export const isDone = (d: DeckState): boolean => d.index >= d.ids.length;
export const remainingCards = (d: DeckState): number => Math.max(0, d.ids.length - d.index);
/** Share of the deck already decided, 0–1 (1 for an empty deck). */
export const progress = (d: DeckState): number => (d.ids.length ? Math.min(d.index, d.ids.length) / d.ids.length : 1);

/** The current card and up to `n - 1` cards below it, top first. */
export function stack(d: DeckState, n = 3): string[] {
  return d.ids.slice(d.index, d.index + n);
}

export function decide(d: DeckState, decision: Decision): DeckState {
  const id = current(d);
  if (!id) return d;
  return { ...d, index: d.index + 1, decisions: { ...d.decisions, [id]: decision } };
}

/** The last decided card and its decision, or null at the start. */
export function lastDecision(d: DeckState): { id: string; decision: Decision } | null {
  const id = d.ids[d.index - 1];
  const decision = id ? d.decisions[id] : undefined;
  return id && decision ? { id, decision } : null;
}

/** Goes back one card and forgets its decision. */
export function undo(d: DeckState): DeckState {
  const last = lastDecision(d);
  if (!last) return d;
  const decisions = { ...d.decisions };
  delete decisions[last.id];
  return { ...d, index: d.index - 1, decisions };
}

export function decided(d: DeckState, decision: Decision): string[] {
  return d.ids.filter((id) => d.decisions[id] === decision);
}

/** Keyboard: ← pass, → interested, Backspace / U / Z undo. Anything else: null. */
export function keyAction(key: string): Decision | 'undo' | null {
  if (key === 'ArrowLeft') return 'pass';
  if (key === 'ArrowRight') return 'interested';
  if (key === 'Backspace' || key === 'u' || key === 'U' || key === 'z' || key === 'Z') return 'undo';
  return null;
}

/** Horizontal drag distance (px) beyond which a released card counts as a swipe; null if below. */
export function swipeDecision(dx: number, threshold = 90): Decision | null {
  if (dx <= -threshold) return 'pass';
  if (dx >= threshold) return 'interested';
  return null;
}
