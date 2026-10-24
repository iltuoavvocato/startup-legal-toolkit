// From deck findings to the founder's choices, and from those choices to the agent's match explanations.
// Pure: the review UI keeps a Decisions map, applyDecisions() turns it into what the profile may use.
import { FORMATTERS } from '../i18n/format';
import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';
import type { AcceptedDeck, AcceptedValue } from './deck';
import { type DeckFindings, type Finding, type TractionKind, type TractionSignal } from './deckExtract';
import { isFase, isRegione, isSettore, type StartupProfile } from './matchTaxonomy';

export type CoreKey = 'settore' | 'fase' | 'round' | 'regione';
export const CORE_KEYS: readonly CoreKey[] = ['settore', 'fase', 'round', 'regione'];
export type FindingKey = CoreKey | 'oneLiner' | 'team' | `traction:${TractionKind}`;

export type Action = 'pending' | 'accept' | 'edit' | 'ignore';
export interface Decision {
  action: Action;
  /** The corrected value while editing (select value, number or text). */
  edited?: string | number | null;
}
export type Decisions = Partial<Record<FindingKey, Decision>>;

export interface ReviewRow {
  key: FindingKey;
  finding: Finding<unknown>;
}

/** The findings as review rows, in display order: profile fields first, then team and traction. */
export function reviewRows(f: DeckFindings): ReviewRow[] {
  const rows: ReviewRow[] = [];
  for (const k of CORE_KEYS) {
    const x = f[k];
    if (x) rows.push({ key: k, finding: x });
  }
  if (f.tagline) rows.push({ key: 'oneLiner', finding: f.tagline });
  if (f.team) rows.push({ key: 'team', finding: f.team });
  for (const t of f.traction) rows.push({ key: `traction:${t.value.kind}`, finding: t });
  return rows;
}

/** Profile fields the deck didn't provide (for "Non trovati nel deck: …"). */
export function missingCore(f: DeckFindings): CoreKey[] {
  return CORE_KEYS.filter((k) => !f[k]);
}

/** Every row marked "use", leaving explicit choices (edit / ignore) alone. */
export function acceptAll(f: DeckFindings, d: Decisions): Decisions {
  const next: Decisions = { ...d };
  for (const r of reviewRows(f)) if (!next[r.key] || next[r.key]!.action === 'pending') next[r.key] = { action: 'accept' };
  return next;
}

export function tally(f: DeckFindings, d: Decisions): { used: number; ignored: number; pending: number } {
  let used = 0;
  let ignored = 0;
  let pending = 0;
  for (const r of reviewRows(f)) {
    const a = d[r.key]?.action ?? 'pending';
    if (a === 'accept' || a === 'edit') used++;
    else if (a === 'ignore') ignored++;
    else pending++;
  }
  return { used, ignored, pending };
}

/** "MRR 18.000 €", "42 clienti", "Crescita +12%"… in the given language. */
export function tractionText(s: TractionSignal, locale: Locale = 'it'): string {
  const f = FORMATTERS[locale];
  const L = MESSAGES[locale].match.ui.findings.traction;
  const money = (n: number) => (s.currency ? `${s.currency}${f.number(n)}` : f.euro(n));
  switch (s.kind) {
    case 'mrr':
    case 'arr':
    case 'revenue':
      return s.amount !== undefined ? `${L[s.kind]} ${money(s.amount)}` : L[s.kind];
    case 'growth':
      return s.pct !== undefined ? `${L.growth} +${f.number(s.pct, 1)}%` : L.growth;
    default: {
      const m = MESSAGES[locale].match.ui.findings;
      return s.count !== undefined ? `${L[s.kind]}: ${f.number(s.count)}` : `${L[s.kind]} (${m.mentioned})`;
    }
  }
}

/** The value shown for a finding in the review, in the given language. */
export function findingText(key: FindingKey, finding: Finding<unknown>, locale: Locale = 'it'): string {
  const t = MESSAGES[locale].match;
  const f = FORMATTERS[locale];
  const v = finding.value;
  if (key === 'settore' && isSettore(v)) return t.taxonomy.settori[v];
  if (key === 'fase' && isFase(v)) return t.taxonomy.fasi[v];
  if (key === 'regione' && isRegione(v)) {
    const place = (finding as Finding<unknown> & { place?: string }).place ?? '';
    return place && place !== t.taxonomy.regioni[v] ? t.ui.findings.place(place, t.taxonomy.regioni[v]) : t.taxonomy.regioni[v];
  }
  if (key === 'round' && typeof v === 'number') {
    const cur = (finding as Finding<unknown> & { currency?: string }).currency;
    return cur ? `${cur}${f.number(v)}` : f.euro(v);
  }
  if (key === 'team' && typeof v === 'number') return t.ui.findings.teamValue(v);
  if (key.startsWith('traction:')) return tractionText(v as TractionSignal, locale);
  return String(v);
}

/** The founder's choices → what the profile may use. Pending and ignored rows contribute nothing. */
export function applyDecisions(f: DeckFindings, d: Decisions, locale: Locale = 'it'): AcceptedDeck {
  const out: AcceptedDeck = { traction: [] };
  const chosen = <T>(key: FindingKey, finding: Finding<T> | null, guard: (v: unknown) => v is T): AcceptedValue<T> | undefined => {
    if (!finding) return undefined;
    const dec = d[key];
    if (dec?.action === 'accept') return { value: finding.value, page: finding.page };
    if (dec?.action === 'edit' && guard(dec.edited)) return { value: dec.edited, page: finding.page };
    return undefined;
  };
  const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  out.settore = chosen('settore', f.settore, isSettore);
  out.fase = chosen('fase', f.fase, isFase);
  out.regione = chosen('regione', f.regione, isRegione);
  out.round = chosen('round', f.round, positive);
  out.team = chosen('team', f.team, positive);
  const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
  out.oneLiner = chosen('oneLiner', f.tagline, text);
  if (out.oneLiner) out.oneLiner = { ...out.oneLiner, value: out.oneLiner.value.trim() };
  for (const t of f.traction) {
    const key: FindingKey = `traction:${t.value.kind}`;
    const dec = d[key];
    if (dec?.action === 'accept') out.traction.push({ value: tractionText(t.value, locale), page: t.page });
    else if (dec?.action === 'edit' && typeof dec.edited === 'string' && dec.edited.trim())
      out.traction.push({ value: dec.edited.trim(), page: t.page });
  }
  for (const k of ['settore', 'fase', 'regione', 'round', 'team', 'oneLiner'] as const) if (out[k] === undefined) delete out[k];
  return out;
}

export function hasAnything(a: AcceptedDeck | null): boolean {
  return Boolean(a && (a.settore || a.fase || a.regione || a.round || a.team || a.oneLiner || a.traction.length));
}

/** Deck page per profile field, only where the confirmed profile still holds the value taken from the deck. */
export type DeckSources = Partial<Record<CoreKey, number>>;
export function deckSources(profile: Pick<StartupProfile, CoreKey>, a: AcceptedDeck | null): DeckSources {
  const out: DeckSources = {};
  if (!a) return out;
  for (const k of CORE_KEYS) {
    const v = a[k];
    if (v && v.value === profile[k]) out[k] = v.page;
  }
  return out;
}

/** Signals that don't count towards the score but the agent mentions: team size and traction. */
export function deckSignals(a: AcceptedDeck | null, locale: Locale = 'it'): string[] {
  if (!a) return [];
  const m = MESSAGES[locale].match.ui.findings;
  return [...(a.team ? [`${m.labels.team}: ${m.teamValue(a.team.value)}`] : []), ...a.traction.map((t) => t.value)];
}

// Order of evaluate()'s reasons for an eligible pair: settore, ticket (round), fase, area (regione).
const REASON_SOURCE: readonly CoreKey[] = ['settore', 'round', 'fase', 'regione'];

/** Adds "(dal tuo deck, p. N)" to the reasons that rest on a field taken from the deck. */
export function annotateReasons(reasons: readonly string[], sources: DeckSources, locale: Locale = 'it'): string[] {
  const u = MESSAGES[locale].match.ui.startup;
  return reasons.map((r, i) => {
    const key = REASON_SOURCE[i];
    const page = key ? sources[key] : undefined;
    return page ? `${r}${u.reasonFromDeck(page)}` : r;
  });
}

/** "settore (p. 3), importo del round (p. 7)" for the line above the results. */
export function sourcesSummary(sources: DeckSources, locale: Locale = 'it'): string {
  const m = MESSAGES[locale].match.ui;
  return CORE_KEYS.filter((k) => sources[k])
    .map((k) => m.startup.deckUsedItem(m.findings.labels[k], sources[k]!))
    .join(', ');
}
