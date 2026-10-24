// Investor directory (browse): filters, text search, sorting and the URL query string. Pure functions only.
// Query keys and values are stable identifiers, the same in every language, so a filtered link can be shared.
import type { Locale } from '../i18n/locales';
import { FORMATTERS } from '../i18n/format';
import { MESSAGES } from '../i18n/messages';
import { evaluate, type Evaluation } from './matching';
import {
  AREA_DI,
  isFase,
  isRegione,
  isSettore,
  labelsFor,
  TIPI_INVESTITORE,
  type Fase,
  type Investor,
  type Regione,
  type Settore,
  type StartupProfile,
  type TipoInvestitore,
} from './matchTaxonomy';

export const DIRECTORY_SORTS = ['nome', 'ticket-crescente', 'ticket-decrescente', 'affinita'] as const;
export type DirectorySort = (typeof DIRECTORY_SORTS)[number];

export interface DirectoryFilters {
  /** Free text: name, thesis, type, sectors, areas and base. */
  q: string;
  fase: Fase | null;
  settore: Settore | null;
  /** The founder's region: investors that invest there (their area, or all of Italy). */
  regione: Regione | null;
  tipo: TipoInvestitore | null;
  /** Ticket range: an investor is shown when its own range overlaps [min, max]. */
  min: number | null;
  max: number | null;
  sort: DirectorySort;
}

export type FilterKey = 'q' | 'fase' | 'settore' | 'regione' | 'tipo' | 'ticket';

export const EMPTY_FILTERS: DirectoryFilters = {
  q: '',
  fase: null,
  settore: null,
  regione: null,
  tipo: null,
  min: null,
  max: null,
  sort: 'nome',
};

const MAX_AMOUNT = 1_000_000_000;
const MAX_QUERY = 80;

const isTipo = (v: unknown): v is TipoInvestitore => TIPI_INVESTITORE.includes(v as TipoInvestitore);
const isSort = (v: unknown): v is DirectorySort => DIRECTORY_SORTS.includes(v as DirectorySort);

function amount(raw: string | null): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 && n <= MAX_AMOUNT ? n : null;
}

/** Invalid values are dropped. A reversed range is kept as typed (see `ticketBounds`). */
export function filtersFromQuery(q: URLSearchParams): DirectoryFilters {
  const fase = q.get('fase');
  const settore = q.get('settore');
  const regione = q.get('regione');
  const tipo = q.get('tipo');
  const sort = q.get('ordina');
  const min = amount(q.get('min'));
  const max = amount(q.get('max'));
  return {
    q: (q.get('q') ?? '').trim().slice(0, MAX_QUERY),
    fase: isFase(fase) ? fase : null,
    settore: isSettore(settore) ? settore : null,
    regione: isRegione(regione) ? regione : null,
    tipo: isTipo(tipo) ? tipo : null,
    min,
    max,
    sort: isSort(sort) ? sort : 'nome',
  };
}

/** Only non-default values, in a fixed order (stable, short URLs). */
export function filtersToQuery(f: DirectoryFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.q.trim()) out.q = f.q.trim().slice(0, MAX_QUERY);
  if (f.fase) out.fase = f.fase;
  if (f.settore) out.settore = f.settore;
  if (f.regione) out.regione = f.regione;
  if (f.tipo) out.tipo = f.tipo;
  if (f.min !== null) out.min = String(f.min);
  if (f.max !== null) out.max = String(f.max);
  if (f.sort !== 'nome') out.ordina = f.sort;
  return out;
}

/** Active filters (the sort order is not a filter). */
export function activeFilters(f: DirectoryFilters): FilterKey[] {
  const keys: FilterKey[] = [];
  if (f.q.trim()) keys.push('q');
  if (f.fase) keys.push('fase');
  if (f.settore) keys.push('settore');
  if (f.regione) keys.push('regione');
  if (f.tipo) keys.push('tipo');
  if (f.min !== null || f.max !== null) keys.push('ticket');
  return keys;
}

export function withoutFilter(f: DirectoryFilters, key: FilterKey): DirectoryFilters {
  switch (key) {
    case 'q':
      return { ...f, q: '' };
    case 'ticket':
      return { ...f, min: null, max: null };
    default:
      return { ...f, [key]: null };
  }
}

/** Keeps the sort order (and the text search, which has its own clear button). */
export function clearFilters(f: DirectoryFilters): DirectoryFilters {
  return { ...EMPTY_FILTERS, sort: f.sort };
}

/** Lowercase, accents removed: "Mobilità" matches "mobilita". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function haystack(i: Investor, locale: Locale): string {
  const L = labelsFor(locale);
  const t = MESSAGES[locale].directory.search;
  const parts = [
    i.nome,
    i.tesi,
    L.tipo[i.tipo],
    ...(i.settori === 'tutti' ? [t.generalist] : i.settori.map((s) => L.settore[s])),
    ...(i.aree === 'italia' ? [t.italy] : i.aree.map((a) => L.area[a])),
    ...i.fasi.map((x) => L.fase[x]),
    i.sede ? L.regione[i.sede] : '',
  ];
  return normalize(parts.join(' '));
}

/** Whether the ticket range was typed the wrong way round (it is then read as reversed). */
export function isReversed(f: Pick<DirectoryFilters, 'min' | 'max'>): boolean {
  return f.min !== null && f.max !== null && f.min > f.max;
}

/** The ticket range in the right order: a reversed one is swapped, so typing never jumps between the fields. */
export function ticketBounds(f: Pick<DirectoryFilters, 'min' | 'max'>): { min: number | null; max: number | null } {
  return isReversed(f) ? { min: f.max, max: f.min } : { min: f.min, max: f.max };
}

export function matchesFilters(i: Investor, f: DirectoryFilters, locale: Locale = 'it'): boolean {
  const { min, max } = ticketBounds(f);
  if (f.fase && !i.fasi.includes(f.fase)) return false;
  if (f.settore && i.settori !== 'tutti' && !i.settori.includes(f.settore)) return false;
  if (f.regione && i.aree !== 'italia' && !i.aree.includes(AREA_DI[f.regione])) return false;
  if (f.tipo && i.tipo !== f.tipo) return false;
  if (min !== null && i.ticketMax < min) return false;
  if (max !== null && i.ticketMin > max) return false;
  const tokens = normalize(f.q).split(/\s+/).filter(Boolean);
  if (tokens.length) {
    const hay = haystack(i, locale);
    if (!tokens.every((tok) => hay.includes(tok))) return false;
  }
  return true;
}

export interface DirectoryEntry {
  investor: Investor;
  /** Fit with the founder's profile, when there is one (same engine as the matches). */
  evaluation: Evaluation | null;
}

function byName(locale: Locale) {
  return (a: DirectoryEntry, b: DirectoryEntry) =>
    a.investor.nome.localeCompare(b.investor.nome, locale) || a.investor.id.localeCompare(b.investor.id);
}

/**
 * Filtered and sorted entries. "affinita" needs a profile: without one it falls back to the name.
 * With a profile, investors the agent would propose come first (score ↓), the others after them by name.
 */
export function browseInvestors(
  investors: readonly Investor[],
  f: DirectoryFilters,
  profile: StartupProfile | null = null,
  locale: Locale = 'it',
): DirectoryEntry[] {
  const name = byName(locale);
  const entries = investors
    .filter((i) => matchesFilters(i, f, locale))
    .map((investor) => ({ investor, evaluation: profile ? evaluate(profile, investor, 'startup', locale) : null }));
  const sort = effectiveSort(f.sort, profile !== null);
  const cmp: Record<DirectorySort, (a: DirectoryEntry, b: DirectoryEntry) => number> = {
    nome: name,
    'ticket-crescente': (a, b) => a.investor.ticketMin - b.investor.ticketMin || a.investor.ticketMax - b.investor.ticketMax || name(a, b),
    'ticket-decrescente': (a, b) => b.investor.ticketMax - a.investor.ticketMax || b.investor.ticketMin - a.investor.ticketMin || name(a, b),
    affinita: (a, b) => {
      const ea = a.evaluation!;
      const eb = b.evaluation!;
      if (ea.eligible !== eb.eligible) return ea.eligible ? -1 : 1;
      if (ea.eligible) return eb.score - ea.score || name(a, b);
      return name(a, b);
    },
  };
  return entries.sort(cmp[sort]);
}

export function effectiveSort(sort: DirectorySort, hasProfile: boolean): DirectorySort {
  return sort === 'affinita' && !hasProfile ? 'nome' : sort;
}

export interface EmptySuggestion {
  key: FilterKey;
  /** Results shown if only this filter is removed. */
  count: number;
}

/** For the empty state: each active filter whose removal alone brings results back, most results first. */
export function emptySuggestions(investors: readonly Investor[], f: DirectoryFilters, locale: Locale = 'it'): EmptySuggestion[] {
  return activeFilters(f)
    .map((key) => ({ key, count: investors.filter((i) => matchesFilters(i, withoutFilter(f, key), locale)).length }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function findInvestor(investors: readonly Investor[], id: string | null): Investor | null {
  return (id && investors.find((i) => i.id === id)) || null;
}

// ---------------------------------------------------------------- display helpers

/** "da 25.000 € a 100.000 €" / "€25,000 to €100,000", or one-sided ranges. */
export function rangeText(min: number | null, max: number | null, locale: Locale = 'it'): string {
  const d = MESSAGES[locale].directory.dir;
  const euro = FORMATTERS[locale].euro;
  if (min !== null && max !== null) return d.rangeBoth(euro(min), euro(max));
  if (min !== null) return d.rangeFrom(euro(min));
  if (max !== null) return d.rangeTo(euro(max));
  return '';
}

/** "Fintech · Seed · Lombardia · 500.000 €": the founder's profile in one line (no names). */
export function profileSummary(p: Pick<StartupProfile, 'settore' | 'fase' | 'regione' | 'round'>, locale: Locale = 'it'): string {
  const L = labelsFor(locale);
  return [L.settore[p.settore], L.fase[p.fase], L.regione[p.regione], FORMATTERS[locale].euro(p.round)].join(' · ');
}

/** Label of an active filter, for chips and the empty-state suggestions. */
export function filterLabel(key: FilterKey, f: DirectoryFilters, locale: Locale = 'it'): string {
  const L = labelsFor(locale);
  const d = MESSAGES[locale].directory.dir;
  switch (key) {
    case 'q':
      return d.chipQuery(f.q.trim());
    case 'fase':
      return f.fase ? L.fase[f.fase] : '';
    case 'settore':
      return f.settore ? L.settore[f.settore] : '';
    case 'regione':
      return f.regione ? L.regione[f.regione] : '';
    case 'tipo':
      return f.tipo ? L.tipo[f.tipo] : '';
    case 'ticket': {
      const b = ticketBounds(f);
      return d.chipTicket(rangeText(b.min, b.max, locale));
    }
  }
}
