// Founder side: proposing the profile to investors, within the monthly limit (memory only). Pure.
import type { Locale } from '../../i18n/locales';
import { consume, MONTHLY_PROPOSAL_LIMIT, remaining, type ProposalCounter } from '../../lib/optin';

export interface Proposals {
  counter: ProposalCounter;
  sent: readonly string[];
  /** Last refusal (limit reached), for an inline message. */
  error: string | null;
}

export const createProposals = (month: string): Proposals => ({ counter: { month, used: 0 }, sent: [], error: null });

export function propose(p: Proposals, id: string, locale: Locale = 'it', limit = MONTHLY_PROPOSAL_LIMIT): Proposals {
  if (p.sent.includes(id)) return p;
  const r = consume(p.counter, limit, locale);
  if (!r.ok) return { ...p, error: r.reason };
  return { counter: r.counter, sent: [...p.sent, id], error: null };
}

export const isSent = (p: Proposals, id: string) => p.sent.includes(id);
export const left = (p: Proposals, limit = MONTHLY_PROPOSAL_LIMIT) => remaining(p.counter, limit);
