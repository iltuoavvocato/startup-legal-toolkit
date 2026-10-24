// Copy guardrails for MatchInvStar (hard product rules): no money handling, payments or orders, no investment
// advice or recommendations, no promised returns, no success fees or commissions. Checked by copyGuardrails.test.ts
// over every match dictionary (IT + EN) and the demo data.

/** Phrases that must never appear in matching copy or demo data, unless inside an allowed negation below. */
export const FORBIDDEN: readonly { rule: string; re: RegExp }[] = [
  // Commissions and success fees
  { rule: 'commission', re: /\bcommission[ei]?\b|\bcommissions?\b/i },
  { rule: 'success fee', re: /\bsuccess[\s-]?fees?\b/i },
  { rule: 'commission', re: /\bpercentual[ei] sul (capitale|round)|\bpercentage of the (capital|round)/i },
  { rule: 'commission', re: /\b(fee|compenso) (sul|on the) round\b/i },
  // Payments and money handling
  { rule: 'payment', re: /\bpagament[oi]\b|\bpayments?\b/i },
  { rule: 'payment', re: /\bpag(a|hi|are|ate)\b|\bpay\b|\bpay now\b/i },
  { rule: 'money handling', re: /\bdenaro\b|\bsoldi\b|\bmoney\b|\bfondi dei clienti\b/i },
  { rule: 'money handling', re: /\bbonific[oi]\b|\bwire transfers?\b|\bescrow\b|\bconto di deposito\b/i },
  { rule: 'money handling', re: /\bdeposit[oi]\b|\bdeposits?\b|\bcustodi(sce|re|amo)\b|\bhold(s)? (funds|money)\b/i },
  { rule: 'money handling', re: /\btrasferisc[eo]\b|\btransfers? (funds|money)\b/i },
  // Orders
  { rule: 'order', re: /\bordini\b|\bordine di (acquisto|investimento|sottoscrizione)\b/i },
  { rule: 'order', re: /\borders\b|\b(buy|sell|purchase|investment|subscription) orders?\b|\bplace an order\b/i },
  // Calls to invest, advice, recommendations
  { rule: 'call to invest', re: /\binvesti (ora|subito|adesso)\b|\binvest (now|today)\b/i },
  { rule: 'investment advice', re: /\b(ti )?consigliamo di investire\b|\bconsigliamo\b|\braccomandiamo\b/i },
  { rule: 'investment advice', re: /\bwe recommend\b|\brecommend(s|ed)? investing\b/i },
  { rule: 'investment advice', re: /\bconsulenza (sugli|finanziaria|in materia di) investiment/i },
  { rule: 'investment advice', re: /\binvestment advice\b|\bfinancial advice\b/i },
  { rule: 'investment advice', re: /\braccomandazion[ei]\b|\brecommendations?\b/i },
  // Promised returns
  { rule: 'guaranteed return', re: /\brendiment[oi] garantit[oi]\b|\bguaranteed returns?\b|\bgarantit[oi]\b|\bguarantee[ds]?\b/i },
  { rule: 'guaranteed return', re: /\bgarantiamo\b|\bwe guarantee\b|\brisk[- ]free\b|\bsenza rischi?\b/i },
];

/**
 * Legitimate uses, matched case-insensitively and removed before checking. Keep this short and explicit: each entry
 * is a negation (the disclaimers that must stay) or a demo thesis naming payments as a market sector.
 */
export const ALLOWED: readonly string[] = [
  // IT negations
  'non gestiamo denaro',
  'nessun pagamento, deposito o strumento finanziario',
  'nessuna success fee',
  'nessuna percentuale sul capitale raccolto',
  'non prevede percentuali sul capitale raccolto',
  'non gestisce denaro',
  'nessuna gestione di denaro',
  'non riceve, custodisce o trasferisce somme',
  'non gestisce denaro, ordini o sottoscrizioni e non prende commissioni sul round',
  'non dà consulenza sugli investimenti',
  'nessuna consulenza sugli investimenti',
  'nessuna consulenza in materia di investimenti',
  'nessuna raccomandazione a investire o a non investire',
  'non è una raccomandazione a investire o a non investire',
  'né una raccomandazione',
  // EN negations
  'we don’t handle money',
  'no payments, deposits or financial instruments',
  'no success fee',
  'no percentage of the capital raised',
  'involves no percentage of the capital raised',
  'does not handle money',
  'no handling of money',
  'does not receive, hold or transfer funds',
  'doesn’t handle money, orders or subscriptions, and takes no fee on the round',
  'it doesn’t handle money.',
  'does not give investment advice',
  'gives no investment advice',
  'no investment advice',
  'nor a recommendation',
  'it is not a recommendation to invest or not to invest',
  'no recommendation to invest or not to invest',
  // Payments as a market sector in fictional theses and startup descriptions
  'su pagamenti, mobilità',
  'energia e pagamenti',
  'pagamenti, fedeltà',
  'fatture e pagamenti',
  'focused on payments',
  'energy and payments',
  'payments, loyalty',
  'invoices and payments',
];

const norm = (s: string) => s.replace(/'/g, '’').toLowerCase();

/** The forbidden phrases found in a text, after removing the allowed negations. */
export function copyViolations(text: string): { rule: string; match: string }[] {
  let t = norm(text);
  for (const a of [...ALLOWED].sort((x, y) => y.length - x.length)) t = t.split(norm(a)).join(' ¦ ');
  return FORBIDDEN.flatMap(({ rule, re }) => {
    const m = re.exec(t);
    return m ? [{ rule, match: m[0] }] : [];
  });
}
