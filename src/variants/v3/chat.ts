// V3 conversational agent: pure conversation reducer shared by the founder and investor screens.
// Messages hold data only (indices, snapshots); the UI turns them into localised text at render time.
import { MONTHLY_PROPOSAL_LIMIT } from '../../lib/optin';
import { apply, bucketCounts, bucketOf, simulateReply, stateOf, type Board, type InvestorBucket } from '../logic/board';
import { createProposals, isSent, left, propose, type Proposals } from '../logic/proposals';

export type ChatMode = 'founder' | 'investor';

/** Quick replies (chips) the user can pick. */
export type Chip = 'why' | 'propose' | 'next' | 'excluded' | 'restart' | 'interested' | 'pass' | 'simulate';

export type AgentBody =
  /** Greeting with the profile/thesis summary and how many matches were found. */
  | { kind: 'greet' }
  /** Founder only: short explanation of filters and score weights. */
  | { kind: 'criteria' }
  /** A match card (investor for the founder, anonymous teaser for the investor). */
  | { kind: 'match'; index: number }
  | { kind: 'why'; index: number }
  /** Founder: profile proposed; neutral status only, plus proposals left this month. */
  | { kind: 'proposed'; index: number; left: number }
  /** Founder: monthly limit reached, nothing sent. */
  | { kind: 'limit'; index: number }
  | { kind: 'excluded' }
  /** Founder: every match seen. */
  | { kind: 'end'; proposed: number; left: number }
  /** Investor: interest sent, the agent offers to simulate the startup's answer. */
  | { kind: 'interested'; index: number }
  | { kind: 'passed'; index: number }
  /** Investor: simulated answer. `intro` false covers both "no answer yet" and a decline (never distinguished). */
  | { kind: 'reply'; index: number; intro: boolean }
  /** Investor: every teaser seen, counts snapshot by bucket. */
  | { kind: 'summary'; counts: Record<InvestorBucket, number> };

export type Message = { id: number; from: 'agent'; body: AgentBody } | { id: number; from: 'user'; chip: Chip };

export interface ChatState {
  mode: ChatMode;
  /** Ids of the ranked matches, best first. */
  ids: readonly string[];
  excludedCount: number;
  /** Index of the match under discussion; equal to ids.length once all have been seen. */
  cursor: number;
  whyShown: boolean;
  excludedShown: boolean;
  /** Investor: teasers whose answer has already been simulated (the chip disappears whatever the outcome). */
  simulated: readonly string[];
  messages: readonly Message[];
  nextId: number;
  proposals: Proposals;
  board: Board;
  limit: number;
}

export interface ChatInit {
  mode: ChatMode;
  ids: readonly string[];
  excludedCount: number;
  /** 'YYYY-MM' of the proposal counter. */
  month: string;
  limit?: number;
}

function agent(s: ChatState, ...bodies: AgentBody[]): ChatState {
  const messages = bodies.map((body, k) => ({ id: s.nextId + k, from: 'agent' as const, body }));
  return { ...s, messages: [...s.messages, ...messages], nextId: s.nextId + messages.length };
}

function user(s: ChatState, chip: Chip): ChatState {
  return { ...s, messages: [...s.messages, { id: s.nextId, from: 'user', chip }], nextId: s.nextId + 1 };
}

/** Message shown once the cursor has passed the last match. */
function closing(s: ChatState): AgentBody {
  return s.mode === 'founder'
    ? { kind: 'end', proposed: s.proposals.sent.length, left: left(s.proposals, s.limit) }
    : { kind: 'summary', counts: bucketCounts(s.board, s.ids) };
}

function opening(s: ChatState): ChatState {
  const first: AgentBody = s.ids.length > 0 ? { kind: 'match', index: 0 } : closing(s);
  return s.mode === 'founder' ? agent(s, { kind: 'greet' }, { kind: 'criteria' }, first) : agent(s, { kind: 'greet' }, first);
}

function fresh(base: Omit<ChatState, 'messages' | 'cursor' | 'whyShown' | 'excludedShown' | 'simulated'>): ChatState {
  return opening({ ...base, messages: [], cursor: 0, whyShown: false, excludedShown: false, simulated: [] });
}

export function initChat({ mode, ids, excludedCount, month, limit = MONTHLY_PROPOSAL_LIMIT }: ChatInit): ChatState {
  return fresh({ mode, ids, excludedCount, nextId: 1, proposals: createProposals(month), board: {}, limit });
}

export const currentId = (s: ChatState): string | null => s.ids[s.cursor] ?? null;
export const isFinished = (s: ChatState) => s.cursor >= s.ids.length;

/** Chips currently offered, in display order. */
export function chipsFor(s: ChatState): Chip[] {
  const id = currentId(s);
  const chips: Chip[] = [];
  if (s.mode === 'founder') {
    if (id !== null) {
      if (!s.whyShown) chips.push('why');
      if (!isSent(s.proposals, id)) chips.push('propose');
      chips.push('next');
    }
    if (!s.excludedShown && s.excludedCount > 0) chips.push('excluded');
  } else if (id !== null) {
    switch (bucketOf(s.board, id)) {
      case 'nuovo':
        chips.push('interested', 'pass');
        break;
      case 'inviato':
        // Same chips whether the startup is silent or declined: only "already simulated" matters.
        if (!s.simulated.includes(id)) chips.push('simulate');
        break;
      default:
        break;
    }
    if (!s.whyShown) chips.push('why');
    chips.push('next');
  }
  chips.push('restart');
  return chips;
}

function advance(s: ChatState): ChatState {
  const cursor = Math.min(s.cursor + 1, s.ids.length);
  const moved = { ...s, cursor, whyShown: false };
  return agent(moved, cursor < s.ids.length ? { kind: 'match', index: cursor } : closing(moved));
}

/** Applies a chip. Chips not currently offered are ignored (state returned unchanged). */
export function reduce(s: ChatState, chip: Chip): ChatState {
  if (!chipsFor(s).includes(chip)) return s;
  if (chip === 'restart') {
    // The monthly proposal counter survives a restart (it is per month); the investor demo board starts over.
    return fresh({
      mode: s.mode,
      ids: s.ids,
      excludedCount: s.excludedCount,
      nextId: s.nextId,
      proposals: { ...s.proposals, error: null },
      board: {},
      limit: s.limit,
    });
  }
  const id = currentId(s);
  const u = user(s, chip);
  switch (chip) {
    case 'why':
      return agent({ ...u, whyShown: true }, { kind: 'why', index: s.cursor });
    case 'next':
      return advance(u);
    case 'excluded':
      return agent({ ...u, excludedShown: true }, { kind: 'excluded' });
    case 'propose': {
      const p = propose(s.proposals, id!, 'it', s.limit);
      if (p.error) return agent({ ...u, proposals: p }, { kind: 'limit', index: s.cursor });
      return agent({ ...u, proposals: p }, { kind: 'proposed', index: s.cursor, left: left(p, s.limit) });
    }
    case 'interested':
      return agent({ ...u, board: apply(s.board, id!, 'INVESTOR_YES') }, { kind: 'interested', index: s.cursor });
    case 'pass':
      return advance(agent({ ...u, board: apply(s.board, id!, 'INVESTOR_NO') }, { kind: 'passed', index: s.cursor }));
    case 'simulate': {
      const board = simulateReply(s.board, id!);
      const intro = stateOf(board, id!) === 'intro';
      return agent({ ...u, board, simulated: [...s.simulated, id!] }, { kind: 'reply', index: s.cursor, intro });
    }
  }
}
