import { describe, expect, it } from 'vitest';
import { DEMO_INVESTORS, demoInvestors } from '../data/matchDemo';
import {
  activeFilters,
  browseInvestors,
  clearFilters,
  effectiveSort,
  EMPTY_FILTERS,
  emptySuggestions,
  filtersFromQuery,
  filtersToQuery,
  findInvestor,
  isReversed,
  matchesFilters,
  normalize,
  ticketBounds,
  withoutFilter,
  type DirectoryFilters,
} from './directory';
import { ownStartup } from './matchQuery';
import { TIPI_INVESTITORE, type Investor } from './matchTaxonomy';

const all = demoInvestors('it');
const f = (over: Partial<DirectoryFilters>): DirectoryFilters => ({ ...EMPTY_FILTERS, ...over });
const ids = (list: { investor: Investor }[]) => list.map((e) => e.investor.id);
const profile = ownStartup({ settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000 }, undefined, 'it');

describe('demo directory dataset', () => {
  it('has 30–40 fictional investors of every type, with unique names', () => {
    expect(DEMO_INVESTORS.length).toBeGreaterThanOrEqual(30);
    expect(DEMO_INVESTORS.length).toBeLessThanOrEqual(40);
    expect(new Set(DEMO_INVESTORS.map((i) => i.nome)).size).toBe(DEMO_INVESTORS.length);
    expect(new Set(DEMO_INVESTORS.map((i) => i.tipo))).toEqual(new Set(TIPI_INVESTITORE));
    for (const i of demoInvestors('en')) expect(i.tesi.length).toBeGreaterThan(10);
  });
});

describe('query string', () => {
  it('round-trips every filter', () => {
    const filters = f({ q: 'agri', fase: 'seed', settore: 'agritech', regione: 'puglia', tipo: 'club-deal', min: 50_000, max: 300_000, sort: 'ticket-decrescente' });
    const qs = new URLSearchParams(filtersToQuery(filters));
    expect(qs.toString()).toBe('q=agri&fase=seed&settore=agritech&regione=puglia&tipo=club-deal&min=50000&max=300000&ordina=ticket-decrescente');
    expect(filtersFromQuery(qs)).toEqual(filters);
  });

  it('leaves defaults out, so an untouched directory has a clean URL', () => {
    expect(filtersToQuery(EMPTY_FILTERS)).toEqual({});
    expect(filtersToQuery(f({ q: '   ' }))).toEqual({});
  });

  it('drops invalid values and reads a reversed range the right way round', () => {
    const r = filtersFromQuery(new URLSearchParams('fase=growth&settore=x&regione=atlantide&tipo=bank&min=-5&max=abc&ordina=random'));
    expect(r).toEqual(EMPTY_FILTERS);
    const reversed = filtersFromQuery(new URLSearchParams('min=500000&max=100000'));
    expect([reversed.min, reversed.max]).toEqual([500_000, 100_000]);
    expect(isReversed(reversed)).toBe(true);
    expect(ticketBounds(reversed)).toEqual({ min: 100_000, max: 500_000 });
    const i = all.find((x) => x.id === 'i02')!; // 25.000–100.000
    expect(matchesFilters(i, reversed)).toBe(matchesFilters(i, f({ min: 100_000, max: 500_000 })));
  });

  it('trims and caps the text search', () => {
    expect(filtersFromQuery(new URLSearchParams(`q=${'a'.repeat(200)}`)).q).toHaveLength(80);
  });
});

describe('filters', () => {
  it('stage, sector (generalists included), type', () => {
    for (const e of browseInvestors(all, f({ fase: 'serie-a' }))) expect(e.investor.fasi).toContain('serie-a');
    const edtech = browseInvestors(all, f({ settore: 'edtech' }));
    expect(edtech.some((e) => e.investor.settori === 'tutti')).toBe(true);
    for (const e of edtech) expect(e.investor.settori === 'tutti' || e.investor.settori.includes('edtech')).toBe(true);
    expect(browseInvestors(all, f({ tipo: 'cvc' })).every((e) => e.investor.tipo === 'cvc')).toBe(true);
  });

  it('region: the investor’s macro-area or all of Italy', () => {
    const sicilia = browseInvestors(all, f({ regione: 'sicilia' }));
    for (const e of sicilia) expect(e.investor.aree === 'italia' || e.investor.aree.includes('sud-isole')).toBe(true);
    expect(ids(sicilia)).not.toContain('i01'); // Nord-Ovest / Nord-Est only
  });

  it('ticket: overlapping ranges, edges included', () => {
    const i = all.find((x) => x.id === 'i02')!; // 25.000–100.000
    expect(matchesFilters(i, f({ min: 100_000 }))).toBe(true);
    expect(matchesFilters(i, f({ min: 100_001 }))).toBe(false);
    expect(matchesFilters(i, f({ max: 25_000 }))).toBe(true);
    expect(matchesFilters(i, f({ max: 24_999 }))).toBe(false);
    expect(matchesFilters(i, f({ min: 50_000, max: 60_000 }))).toBe(true);
    expect(matchesFilters(i, f({ min: 150_000, max: 900_000 }))).toBe(false);
  });

  it('text search: every word, accents and case ignored, labels in the page language', () => {
    expect(ids(browseInvestors(all, f({ q: 'ARDESIA' })))).toEqual(['i01']);
    expect(normalize('Mobilità')).toBe('mobilita');
    const mob = browseInvestors(all, f({ q: 'mobilita' }));
    expect(mob.length).toBeGreaterThan(0);
    expect(browseInvestors(all, f({ q: 'club fintech' })).every((e) => e.investor.tipo === 'club-deal')).toBe(true);
    expect(browseInvestors(demoInvestors('en'), f({ q: 'all of italy' }), null, 'en').length).toBeGreaterThan(0);
    expect(browseInvestors(all, f({ q: 'zzzz' }))).toEqual([]);
  });

  it('combines filters with AND', () => {
    const r = browseInvestors(all, f({ fase: 'seed', settore: 'fintech', regione: 'lombardia', max: 500_000 }));
    expect(r.length).toBeGreaterThan(0);
    for (const e of r) {
      expect(matchesFilters(e.investor, f({ fase: 'seed' }))).toBe(true);
      expect(matchesFilters(e.investor, f({ settore: 'fintech' }))).toBe(true);
      expect(e.investor.ticketMin).toBeLessThanOrEqual(500_000);
    }
  });

  it('active filters, removing one, clearing all (the sort order stays)', () => {
    const filters = f({ q: 'x', fase: 'seed', min: 1, sort: 'ticket-crescente' });
    expect(activeFilters(filters)).toEqual(['q', 'fase', 'ticket']);
    expect(activeFilters(withoutFilter(filters, 'ticket'))).toEqual(['q', 'fase']);
    expect(clearFilters(filters)).toEqual(f({ sort: 'ticket-crescente' }));
    expect(activeFilters(EMPTY_FILTERS)).toEqual([]);
  });
});

describe('sorting', () => {
  it('by name, in the locale’s order, ties by id', () => {
    const names = browseInvestors(all, EMPTY_FILTERS).map((e) => e.investor.nome);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'it')));
  });

  it('by ticket ascending (min) and descending (max)', () => {
    const asc = browseInvestors(all, f({ sort: 'ticket-crescente' })).map((e) => e.investor.ticketMin);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = browseInvestors(all, f({ sort: 'ticket-decrescente' })).map((e) => e.investor.ticketMax);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it('by fit only with a profile: eligible first by score, then the others by name', () => {
    expect(effectiveSort('affinita', false)).toBe('nome');
    expect(browseInvestors(all, f({ sort: 'affinita' })).every((e) => e.evaluation === null)).toBe(true);
    const r = browseInvestors(all, f({ sort: 'affinita' }), profile);
    const firstOut = r.findIndex((e) => !e.evaluation!.eligible);
    expect(firstOut).toBeGreaterThan(0);
    expect(r.slice(firstOut).every((e) => !e.evaluation!.eligible)).toBe(true);
    const scores = r.slice(0, firstOut).map((e) => e.evaluation!.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(r[0]!.evaluation!.score).toBe(100);
  });

  it('does not depend on the input order', () => {
    const shuffled = [...all].reverse();
    for (const sort of ['nome', 'ticket-crescente', 'ticket-decrescente', 'affinita'] as const) {
      expect(ids(browseInvestors(shuffled, f({ sort }), profile))).toEqual(ids(browseInvestors(all, f({ sort }), profile)));
    }
  });
});

describe('empty state suggestions', () => {
  it('lists the filters whose removal alone brings results back, most results first', () => {
    const filters = f({ tipo: 'acceleratore', fase: 'serie-a', settore: 'fintech' });
    expect(browseInvestors(all, filters)).toEqual([]);
    const s = emptySuggestions(all, filters);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) expect(browseInvestors(all, withoutFilter(filters, x.key))).toHaveLength(x.count);
    expect(s.map((x) => x.count)).toEqual([...s.map((x) => x.count)].sort((a, b) => b - a));
  });

  it('is empty when no single filter helps', () => {
    expect(emptySuggestions(all, f({ q: 'zzzz', fase: 'serie-a', tipo: 'acceleratore' }))).toEqual([]);
  });
});

describe('findInvestor', () => {
  it('finds by id, null otherwise', () => {
    expect(findInvestor(all, 'i07')?.id).toBe('i07');
    expect(findInvestor(all, 'nope')).toBeNull();
    expect(findInvestor(all, null)).toBeNull();
  });
});

describe('display helpers', () => {
  it('formats ranges, the profile summary and chip labels in both languages', async () => {
    const mod = await import('./directory');
    const sp = <A extends unknown[]>(fn: (...a: A) => string) => (...a: A) => fn(...a).replace(/\u00a0|\u202f/g, ' ');
    const [rangeText, profileSummary, filterLabel] = [sp(mod.rangeText), sp(mod.profileSummary), sp(mod.filterLabel)];
    expect(rangeText(25_000, 100_000, 'it')).toBe('da 25.000 € a 100.000 €');
    expect(rangeText(25_000, null, 'en')).toBe('from €25,000');
    expect(rangeText(null, 100_000, 'it')).toBe('fino a 100.000 €');
    expect(rangeText(null, null)).toBe('');
    expect(profileSummary(profile, 'it')).toBe('Fintech · Seed · Lombardia · 500.000 €');
    expect(profileSummary(profile, 'en')).toBe('Fintech · Seed · Lombardy · €500,000');
    expect(filterLabel('ticket', f({ min: 50_000 }), 'en')).toBe('Ticket from €50,000');
    expect(filterLabel('regione', f({ regione: 'sicilia' }), 'it')).toBe('Sicilia');
  });
});
