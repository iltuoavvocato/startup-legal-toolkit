// Sorting, filtering and keyboard row navigation for the data-dense views. Pure.
import type { Evaluation, Ranked } from '../../lib/matching';
import type { Fase, Investor, Settore, StartupProfile, TipoInvestitore } from '../../lib/matchTaxonomy';

export type SortDir = 'asc' | 'desc';
export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

/** Clicking the active column flips the direction; a new column starts from its default direction. */
export function toggleSort<K extends string>(s: SortState<K>, key: K, defaultDir: SortDir = 'desc'): SortState<K> {
  return s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: defaultDir };
}

/** Stable sort by a numeric or string accessor (strings compared with the Italian collation). */
export function sortRows<T>(rows: readonly T[], accessor: (r: T) => number | string, dir: SortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, v: accessor(row) }))
    .sort((a, b) => {
      const c =
        typeof a.v === 'number' && typeof b.v === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v), 'it');
      return c * sign || a.i - b.i;
    })
    .map((x) => x.row);
}

export type InvestorSortKey = 'score' | 'nome' | 'tipo' | 'ticket' | 'settore' | 'fase' | 'area';

/** Accessor for each sortable column of the founder's investor list. */
export function investorSortValue(r: Ranked<Investor>, key: InvestorSortKey): number | string {
  const p = r.evaluation.parts;
  switch (key) {
    case 'score':
      return r.evaluation.score;
    case 'nome':
      return r.item.nome;
    case 'tipo':
      return r.item.tipo;
    case 'ticket':
      return r.item.ticketMax;
    case 'settore':
      return p.settore;
    case 'fase':
      return p.fase;
    case 'area':
      return p.area;
  }
}

export interface InvestorFilters {
  /** Empty = all types. */
  tipi: readonly TipoInvestitore[];
  minScore: number;
  /** Case-insensitive search in name and thesis. */
  query: string;
}

export const NO_INVESTOR_FILTERS: InvestorFilters = { tipi: [], minScore: 0, query: '' };

export function filterInvestorMatches(rows: readonly Ranked<Investor>[], f: InvestorFilters): Ranked<Investor>[] {
  const q = f.query.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!f.tipi.length || f.tipi.includes(r.item.tipo)) &&
      r.evaluation.score >= f.minScore &&
      (!q || r.item.nome.toLowerCase().includes(q) || r.item.tesi.toLowerCase().includes(q)),
  );
}

export type StartupSortKey = 'score' | 'settore' | 'fase' | 'regione' | 'round';

export function startupSortValue(r: Ranked<StartupProfile>, key: StartupSortKey): number | string {
  switch (key) {
    case 'score':
      return r.evaluation.score;
    case 'settore':
      return r.item.settore;
    case 'fase':
      return ['pre-seed', 'seed', 'serie-a'].indexOf(r.item.fase);
    case 'regione':
      return r.item.regione;
    case 'round':
      return r.item.round;
  }
}

export interface StartupFilters {
  settori: readonly Settore[];
  fasi: readonly Fase[];
  minScore: number;
}

export const NO_STARTUP_FILTERS: StartupFilters = { settori: [], fasi: [], minScore: 0 };

export function filterStartupMatches(rows: readonly Ranked<StartupProfile>[], f: StartupFilters): Ranked<StartupProfile>[] {
  return rows.filter(
    (r) =>
      (!f.settori.length || f.settori.includes(r.item.settore)) &&
      (!f.fasi.length || f.fasi.includes(r.item.fase)) &&
      r.evaluation.score >= f.minScore,
  );
}

/** Toggles a value in a list (for multi-select filter chips). */
export function toggleValue<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Row navigation: j/↓ next, k/↑ previous, Home/End; clamps to the list. null for other keys. */
export function nextRow(index: number, length: number, key: string): number | null {
  if (!length) return null;
  const last = length - 1;
  switch (key) {
    case 'ArrowDown':
    case 'j':
      return Math.min(last, index + 1);
    case 'ArrowUp':
    case 'k':
      return Math.max(0, index - 1);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return null;
  }
}

/** Score as a 0–100 share of each part's maximum, for score bars. */
export function partShares(e: Evaluation, max: { settore: number; ticket: number; fase: number; area: number }) {
  return {
    settore: (e.parts.settore / max.settore) * 100,
    ticket: (e.parts.ticket / max.ticket) * 100,
    fase: (e.parts.fase / max.fase) * 100,
    area: (e.parts.area / max.area) * 100,
  };
}
