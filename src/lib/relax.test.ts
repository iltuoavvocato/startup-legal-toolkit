import { describe, expect, it } from 'vitest';
import { DEMO_INVESTORS, DEMO_STARTUPS } from '../data/matchDemo';
import type { Thesis } from './matchQuery';
import type { Investor, StartupProfile } from './matchTaxonomy';
import { matchStartups } from './matching';
import { ownInvestor } from './matchQuery';
import { profileNearMisses, thesisNearMisses, widenThesis } from './relax';

const s = (patch: Partial<StartupProfile>): StartupProfile => ({
  id: 's',
  nome: 'S',
  settore: 'fintech',
  fase: 'seed',
  regione: 'lombardia',
  round: 500_000,
  oneLiner: '',
  founder: '',
  email: '',
  ...patch,
});

const thesis: Thesis = { settori: ['fintech'], fasi: ['seed'], ticketMin: 50_000, ticketMax: 200_000, aree: ['nord-ovest'], sede: null };

describe('widenThesis', () => {
  it('adds only the requested criteria and never mutates the input', () => {
    const before = JSON.stringify(thesis);
    const t = widenThesis(thesis, [s({ settore: 'edtech', fase: 'serie-a', regione: 'sicilia', round: 30_000 })], ['settore', 'ticket']);
    expect(t.settori).toEqual(['fintech', 'edtech']);
    expect(t.fasi).toEqual(['seed']);
    expect(t.aree).toEqual(['nord-ovest']);
    expect(t.ticketMin).toBe(30_000);
    expect(JSON.stringify(thesis)).toBe(before);
  });

  it('keeps "tutta Italia" and the main sector first', () => {
    const t = widenThesis({ ...thesis, aree: 'italia' }, [s({ settore: 'agritech', regione: 'puglia' })], ['settore', 'area']);
    expect(t.aree).toBe('italia');
    expect(t.settori[0]).toBe('fintech');
  });
});

describe('thesisNearMisses', () => {
  const startups = [
    s({ id: 'a', nome: 'A', settore: 'edtech' }),
    s({ id: 'b', nome: 'B', settore: 'edtech', regione: 'sicilia' }),
    s({ id: 'c', nome: 'C', fase: 'serie-a', settore: 'edtech', regione: 'sicilia' }),
  ];

  it('returns the closest misses and the edit that brings the most matches', () => {
    const r = thesisNearMisses(thesis, startups);
    expect(r.closest.map((x) => x.item.id)).toEqual(['a']);
    expect(r.suggestion?.filters).toEqual(['settore']);
    expect(r.suggestion?.unlocks).toBe(1);
    const after = matchStartups(ownInvestor(r.suggestion!.patched), startups).matches.map((x) => x.item.id);
    expect(after).toEqual(['a']);
  });

  it('falls back to all the criteria of the closest entry when no single change helps', () => {
    const r = thesisNearMisses(thesis, [startups[1]!]);
    expect(r.suggestion?.filters).toEqual(['area', 'settore']);
    expect(r.suggestion?.unlocks).toBe(1);
  });

  it('gives no suggestion when everything already matches', () => {
    const r = thesisNearMisses(thesis, [s({})]);
    expect(r.closest).toEqual([]);
    expect(r.suggestion).toBeNull();
  });

  it('is deterministic on the demo data and always unlocks at least one startup', () => {
    const narrow: Thesis = { settori: ['proptech'], fasi: ['serie-a'], ticketMin: 900_000, ticketMax: 1_000_000, aree: ['sud-isole'], sede: null };
    const a = thesisNearMisses(narrow, DEMO_STARTUPS);
    const b = thesisNearMisses(narrow, [...DEMO_STARTUPS].reverse());
    expect(a.suggestion).toEqual(b.suggestion);
    expect(a.closest.map((x) => x.item.id)).toEqual(b.closest.map((x) => x.item.id));
    expect(a.suggestion!.unlocks).toBeGreaterThanOrEqual(1);
    expect(a.closest.length).toBeLessThanOrEqual(3);
  });
});

describe('profileNearMisses', () => {
  const inv = (patch: Partial<Investor>): Investor => ({
    id: 'i',
    nome: 'I',
    tipo: 'micro-vc',
    settori: ['fintech'],
    fasi: ['seed'],
    ticketMin: 100_000,
    ticketMax: 300_000,
    aree: 'italia',
    sede: null,
    tesi: '',
    referente: '',
    email: '',
    ...patch,
  });

  it('suggests raising the round only when the ticket is the sole blocker', () => {
    const r = profileNearMisses(s({ round: 50_000 }), [inv({ id: 'x', nome: 'X', ticketMin: 80_000 }), inv({ id: 'y', nome: 'Y', ticketMin: 120_000 })]);
    expect(r.suggestion?.filters).toEqual(['ticket']);
    expect(r.suggestion?.patched.round).toBe(80_000);
    expect(r.suggestion?.unlocks).toBe(1);
  });

  it('never changes sector, stage or region (facts about the startup)', () => {
    const r = profileNearMisses(s({}), [inv({ settori: ['edtech'] }), inv({ id: 'z', fasi: ['serie-a'] })]);
    expect(r.closest.length).toBe(2);
    expect(r.suggestion).toBeNull();
  });

  it('works on the demo investors', () => {
    const r = profileNearMisses(s({ settore: 'proptech', fase: 'serie-a', regione: 'molise', round: 10_000 }), DEMO_INVESTORS);
    expect(r.closest.length).toBeGreaterThan(0);
    if (r.suggestion) expect(r.suggestion.unlocks).toBeGreaterThanOrEqual(1);
  });
});
