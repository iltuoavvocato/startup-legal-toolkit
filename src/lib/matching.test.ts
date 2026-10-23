import { describe, expect, it } from 'vitest';
import { DEMO_INVESTORS, DEMO_STARTUPS } from '../data/matchDemo';
import { formatEuro } from './format';
import type { Investor, StartupProfile } from './matchTaxonomy';
import { coverage, evaluate, matchInvestors, matchStartups, scoreBand, WEIGHTS } from './matching';

const startup: StartupProfile = {
  id: 'tu',
  nome: 'Prova',
  settore: 'fintech',
  fase: 'seed',
  regione: 'lombardia',
  round: 500_000,
  oneLiner: 'Una startup di prova.',
  founder: 'Founder di prova',
  email: 'founder@prova.example',
};

const perfect: Investor = {
  id: 'x1',
  nome: 'Perfetto',
  tipo: 'micro-vc',
  settori: ['fintech'],
  fasi: ['seed'],
  ticketMin: 100_000,
  ticketMax: 500_000,
  aree: ['nord-ovest'],
  sede: 'lombardia',
  tesi: '',
  referente: '',
  email: '',
};

const inv = (patch: Partial<Investor>): Investor => ({ ...perfect, ...patch });

describe('hard filters', () => {
  it('excludes on stage alone', () => {
    const e = evaluate(startup, inv({ fasi: ['serie-a'] }));
    expect(e.eligible).toBe(false);
    expect(e.failed).toEqual(['fase']);
    expect(e.whyNot[0]).toBe('Non investe in fase Seed (investe in: Serie A)');
    expect(e.score).toBe(0);
    expect(e.reasons).toEqual([]);
  });

  it('excludes on sector alone', () => {
    const e = evaluate(startup, inv({ settori: ['edtech'] }));
    expect(e.failed).toEqual(['settore']);
    expect(e.whyNot[0]).toBe('Non investe nel settore Fintech');
  });

  it('excludes on area alone', () => {
    const e = evaluate(startup, inv({ aree: ['sud-isole'], sede: 'sicilia' }));
    expect(e.failed).toEqual(['area']);
    expect(e.whyNot[0]).toBe('Non investe in Nord-Ovest');
  });

  it('excludes when the minimum ticket is above the round, at the exact boundary', () => {
    expect(evaluate(startup, inv({ ticketMin: 500_000, ticketMax: 900_000 })).eligible).toBe(true);
    const e = evaluate(startup, inv({ ticketMin: 500_001, ticketMax: 900_000 }));
    expect(e.failed).toEqual(['ticket']);
    expect(e.whyNot[0]).toBe(`Ticket minimo di ${formatEuro(500_001)}, superiore al round di ${formatEuro(500_000)}`);
  });

  it('lists every failed filter in a fixed order', () => {
    const e = evaluate(startup, inv({ fasi: ['pre-seed'], settori: ['edtech'], aree: ['centro'], ticketMin: 900_000, ticketMax: 1_000_000 }));
    expect(e.failed).toEqual(['fase', 'settore', 'area', 'ticket']);
    expect(e.whyNot).toHaveLength(4);
  });

  it('lets generalists and "tutta Italia" investors through', () => {
    const e = evaluate(startup, inv({ settori: 'tutti', aree: 'italia', sede: 'sicilia' }));
    expect(e.eligible).toBe(true);
    expect(e.parts.settore).toBe(15);
    expect(e.parts.area).toBe(8);
    expect(e.reasons).toContain('Investitore generalista: valuta tutti i settori');
    expect(e.reasons).toContain('Investe in tutta Italia');
  });
});

describe('score', () => {
  it('gives 100 to a perfect fit', () => {
    expect(evaluate(startup, perfect).score).toBe(100);
    expect(WEIGHTS.settore + WEIGHTS.ticket + WEIGHTS.fase + WEIGHTS.area).toBe(100);
  });

  it('scores sector tiers 30 / 20 / 15', () => {
    expect(evaluate(startup, inv({ settori: ['fintech', 'edtech'] })).parts.settore).toBe(30);
    expect(evaluate(startup, inv({ settori: ['edtech', 'fintech'] })).parts.settore).toBe(20);
    expect(evaluate(startup, inv({ settori: 'tutti' })).parts.settore).toBe(15);
  });

  it('scores stage tiers 20 / 12', () => {
    expect(evaluate(startup, inv({ fasi: ['seed', 'serie-a'] })).parts.fase).toBe(20);
    expect(evaluate(startup, inv({ fasi: ['pre-seed', 'seed'] })).parts.fase).toBe(12);
  });

  it('scores area tiers 20 / 14 / 8', () => {
    expect(evaluate(startup, inv({ sede: 'lombardia' })).parts.area).toBe(20);
    expect(evaluate(startup, inv({ sede: 'piemonte' })).parts.area).toBe(14);
    expect(evaluate(startup, inv({ sede: 'piemonte', aree: 'italia' })).parts.area).toBe(8);
    // Same region beats everything, even with aree = 'italia'.
    expect(evaluate(startup, inv({ aree: 'italia' })).parts.area).toBe(20);
  });

  it('scores the ticket by coverage of the round, full points from 40%', () => {
    expect(coverage(startup, { ticketMax: 100_000 })).toBeCloseTo(0.2);
    expect(evaluate(startup, inv({ ticketMin: 25_000, ticketMax: 100_000 })).parts.ticket).toBeCloseTo(15);
    expect(evaluate(startup, inv({ ticketMax: 200_000 })).parts.ticket).toBe(30);
    expect(evaluate(startup, inv({ ticketMax: 5_000_000 })).parts.ticket).toBe(30);
  });

  it('is an integer between 0 and 100 for every demo pair', () => {
    for (const s of DEMO_STARTUPS)
      for (const i of DEMO_INVESTORS) {
        const { score } = evaluate(s, i);
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
  });

  it('maps scores to bands', () => {
    expect(scoreBand(100).label).toBe('Molto affine');
    expect(scoreBand(80).label).toBe('Molto affine');
    expect(scoreBand(79).label).toBe('Affine');
    expect(scoreBand(60).label).toBe('Affine');
    expect(scoreBand(59).label).toBe('Da valutare');
    expect(scoreBand(0).label).toBe('Da valutare');
  });
});

describe('reasons', () => {
  it('come in a fixed order: settore, ticket, fase, area', () => {
    const e = evaluate(startup, inv({ ticketMin: 25_000, ticketMax: 100_000 }));
    expect(e.reasons).toEqual([
      'Il settore Fintech è il suo focus principale',
      `Ticket da ${formatEuro(25_000)} a ${formatEuro(100_000)}: può coprire fino al 20% del round`,
      'Investe soprattutto in fase Seed',
      'Ha sede in Lombardia, come te',
    ]);
  });

  it('say when the investor could lead or cover the round', () => {
    expect(evaluate(startup, inv({ ticketMax: 300_000 })).reasons[1]).toContain('potrebbe guidare il round');
    expect(evaluate(startup, inv({ ticketMax: 600_000 })).reasons[1]).toContain('potrebbe coprire l’intero round');
  });

  it('are phrased for the investor on the investor side', () => {
    const e = evaluate(startup, inv({ settori: ['edtech', 'fintech'], fasi: ['pre-seed', 'seed'] }), 'investitore');
    expect(e.reasons[0]).toBe('Settore Fintech: tra quelli che segui');
    expect(e.reasons[2]).toBe('Fase Seed: tra quelle che segui');
  });
});

describe('ranking', () => {
  it('breaks ties by ticket part, then name, then id', () => {
    const a = inv({ id: 'b', nome: 'Beta', ticketMax: 200_000 }); // 100
    const b = inv({ id: 'a', nome: 'Alfa', ticketMax: 200_000 }); // 100, earlier name
    const c = inv({ id: 'c', nome: 'Alfa', ticketMax: 200_000 }); // 100, same name, later id
    const d = inv({ id: 'd', nome: 'Aaa', settori: ['edtech', 'fintech'], sede: 'piemonte', ticketMax: 200_000 }); // lower score
    const ids = matchInvestors(startup, [a, d, c, b]).matches.map((m) => m.item.id);
    expect(ids).toEqual(['a', 'c', 'b', 'd']);
  });

  it('prefers the higher ticket part when scores are equal', () => {
    // 20 + 30 + 20 + 14 = 84
    const x = inv({ id: 'x', nome: 'Zeta', settori: ['edtech', 'fintech'], ticketMax: 200_000, sede: 'piemonte' });
    // 30 + 19,95 + 20 + 14 = 83,95 → 84
    const y = inv({ id: 'y', nome: 'Alfa', ticketMin: 10_000, ticketMax: 133_000, sede: 'piemonte' });
    const r = matchInvestors(startup, [y, x]).matches;
    expect(r.map((m) => m.evaluation.score)).toEqual([84, 84]);
    expect(r.map((m) => m.item.id)).toEqual(['x', 'y']);
  });

  it('does not depend on input order', () => {
    const forward = matchInvestors(startup, DEMO_INVESTORS);
    const reversed = matchInvestors(startup, [...DEMO_INVESTORS].reverse());
    const shuffled = matchInvestors(startup, [...DEMO_INVESTORS].sort((x, y) => (x.tesi < y.tesi ? -1 : 1)));
    const ids = (r: typeof forward) => [...r.matches, ...r.excluded].map((m) => m.item.id);
    expect(ids(reversed)).toEqual(ids(forward));
    expect(ids(shuffled)).toEqual(ids(forward));
  });

  it('sorts excluded entries by number of failed filters, then name', () => {
    const { excluded } = matchInvestors(startup, DEMO_INVESTORS);
    const counts = excluded.map((e) => e.evaluation.failed.length);
    expect([...counts].sort((x, y) => x - y)).toEqual(counts);
  });

  it('is symmetric between the two sides', () => {
    for (const s of DEMO_STARTUPS)
      for (const i of DEMO_INVESTORS) {
        const fromStartup = matchInvestors(s, [i]).matches[0];
        const fromInvestor = matchStartups(i, [s]).matches[0];
        expect(Boolean(fromStartup)).toBe(Boolean(fromInvestor));
        if (fromStartup && fromInvestor) expect(fromInvestor.evaluation.score).toBe(fromStartup.evaluation.score);
      }
  });
});

describe('demo dataset', () => {
  it('is well formed', () => {
    const ids = [...DEMO_INVESTORS, ...DEMO_STARTUPS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(DEMO_INVESTORS).toHaveLength(15);
    expect(DEMO_STARTUPS).toHaveLength(8);
    for (const i of DEMO_INVESTORS) {
      expect(i.ticketMin).toBeLessThanOrEqual(i.ticketMax);
      expect(i.fasi.length).toBeGreaterThan(0);
      expect(i.email).toMatch(/\.example$/);
    }
    for (const s of DEMO_STARTUPS) {
      expect(s.round).toBeGreaterThan(0);
      expect(s.oneLiner.length).toBeLessThanOrEqual(140);
      expect(s.email).toMatch(/\.example$/);
    }
  });

  it('gives the default example matches in every band and exclusions for every filter', () => {
    const { matches, excluded } = matchInvestors(startup, DEMO_INVESTORS);
    const bands = new Set(matches.map((m) => scoreBand(m.evaluation.score).band));
    expect(bands).toEqual(new Set(['molto-affine', 'affine', 'da-valutare']));
    const failed = new Set(excluded.flatMap((e) => e.evaluation.failed));
    expect(failed).toEqual(new Set(['fase', 'settore', 'area', 'ticket']));
    expect(matches[0]?.evaluation.score).toBe(100);
  });
});
