import { describe, expect, it } from 'vitest';
import { evaluate } from './matching';
import {
  ownInvestor,
  ownStartup,
  startupFromQuery,
  startupToQuery,
  thesisErrors,
  thesisFromQuery,
  thesisToQuery,
  type Thesis,
} from './matchQuery';

const q = (o: Record<string, string>) => new URLSearchParams(o);

describe('startup query', () => {
  it('round-trips the enumerated fields only', () => {
    const core = { settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000 } as const;
    const params = startupToQuery(core);
    expect(Object.keys(params).sort()).toEqual(['fase', 'regione', 'round', 'settore']);
    expect(startupFromQuery(q(params))).toEqual(core);
  });

  it('rejects invalid or incomplete values', () => {
    expect(startupFromQuery(q({ settore: 'fintech', fase: 'seed', regione: 'lombardia' }))).toBeNull();
    expect(startupFromQuery(q({ settore: 'x', fase: 'seed', regione: 'lombardia', round: '1' }))).toBeNull();
    expect(startupFromQuery(q({ settore: 'fintech', fase: 'seed', regione: 'lombardia', round: '-5' }))).toBeNull();
    expect(startupFromQuery(q({ settore: 'fintech', fase: 'seed', regione: 'lombardia', round: '1e9' }))).toBeNull();
  });
});

describe('thesis query', () => {
  const thesis: Thesis = {
    settori: ['fintech', 'saas-b2b'],
    fasi: ['seed'],
    ticketMin: 50_000,
    ticketMax: 250_000,
    aree: ['nord-ovest'],
    sede: null,
  };

  it('round-trips, with or without sede and "italia"', () => {
    expect(thesisFromQuery(q(thesisToQuery(thesis)))).toEqual(thesis);
    const italia: Thesis = { ...thesis, aree: 'italia', sede: 'lazio' };
    expect(thesisFromQuery(q(thesisToQuery(italia)))).toEqual(italia);
  });

  it('drops unknown values and rejects empty or inverted theses', () => {
    expect(thesisFromQuery(q({ ...thesisToQuery(thesis), settori: 'fintech.boh' }))?.settori).toEqual(['fintech']);
    expect(thesisFromQuery(q({ ...thesisToQuery(thesis), settori: 'boh' }))).toBeNull();
    expect(thesisFromQuery(q({ ...thesisToQuery(thesis), min: '300000' }))).toBeNull();
    expect(thesisFromQuery(q({ ...thesisToQuery(thesis), aree: '' }))).toBeNull();
  });

  it('validates the form', () => {
    expect(thesisErrors({ settori: [], fasi: [], ticketMin: null, ticketMax: null, aree: [] })).toEqual({
      settori: 'Scegli almeno un settore.',
      fasi: 'Scegli almeno una fase.',
      ticket: 'Indica il ticket minimo e massimo.',
      aree: 'Scegli almeno un’area, oppure tutta Italia.',
    });
    expect(thesisErrors({ settori: ['fintech'], fasi: ['seed'], ticketMin: 9, ticketMax: 5, aree: ['centro'] })).toEqual({
      ticket: 'Il ticket minimo non può superare il massimo.',
    });
  });
});

describe('own profiles', () => {
  it('uses neutral placeholders when names are missing', () => {
    const s = ownStartup({ settore: 'fintech', fase: 'seed', regione: 'lazio', round: 1 });
    expect(s.nome).toBe('La tua startup');
    expect(ownStartup({ settore: 'fintech', fase: 'seed', regione: 'lazio', round: 1 }, { nome: ' Alfa ' }).nome).toBe('Alfa');
  });

  it('gives no same-region bonus when the investor has no sede', () => {
    const i = ownInvestor({ settori: ['fintech'], fasi: ['seed'], ticketMin: 1, ticketMax: 10, aree: ['centro'], sede: null });
    const s = ownStartup({ settore: 'fintech', fase: 'seed', regione: 'lazio', round: 10 });
    expect(evaluate(s, i).parts.area).toBe(14);
    expect(evaluate(s, { ...i, sede: 'lazio' }).parts.area).toBe(20);
  });
});
