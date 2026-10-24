import { describe, expect, it } from 'vitest';
import type { AcceptedDeck } from './deck';
import { extractFromDeck, type DeckFindings } from './deckExtract';
import {
  acceptAll,
  annotateReasons,
  applyDecisions,
  deckSignals,
  deckSources,
  findingText,
  hasAnything,
  missingCore,
  reviewRows,
  sourcesSummary,
  tally,
  tractionText,
} from './deckSignals';
import { evaluate } from './matching';
import { demoInvestors } from '../data/matchDemo';
import type { StartupProfile } from './matchTaxonomy';

const DECK = [
  'Vignalume\nAgritech per i vigneti: agricoltura di precisione',
  'Trazione\n42 aziende agricole clienti\nMRR di 18.000 €',
  'Il team\nSiamo un team di 7 persone',
  'Il round\nStiamo raccogliendo un round seed da 800.000 €',
  'Contatti\nsede operativa: Bari',
];
const F: DeckFindings = extractFromDeck(DECK);
/** Intl puts a non-breaking space before €: compare with plain spaces. */
const sp = (x: string) => x.replace(/\u00a0/g, ' ');

describe('reviewRows / missingCore', () => {
  it('lists profile fields first, then team and traction', () => {
    expect(reviewRows(F).map((r) => r.key)).toEqual(['settore', 'fase', 'round', 'regione', 'oneLiner', 'team', 'traction:mrr', 'traction:customers']);
    expect(missingCore(F)).toEqual([]);
    expect(missingCore(extractFromDeck(['Agritech per agricoltura di precisione nei vigneti']))).toEqual(['fase', 'round', 'regione']);
  });
});

describe('applyDecisions', () => {
  it('applies nothing by default: pending rows are never used', () => {
    const a = applyDecisions(F, {});
    expect(a).toEqual({ traction: [] });
    expect(hasAnything(a)).toBe(false);
  });

  it('uses accepted values with their page, edited values when valid, and skips ignored ones', () => {
    const a = applyDecisions(F, {
      settore: { action: 'accept' },
      round: { action: 'edit', edited: 750_000 },
      regione: { action: 'ignore' },
      fase: { action: 'edit', edited: 'non-una-fase' },
      team: { action: 'accept' },
      'traction:mrr': { action: 'accept' },
      'traction:customers': { action: 'edit', edited: '  45 aziende clienti ' },
      oneLiner: { action: 'edit', edited: '  Sensori per vigneti ' },
    });
    expect(a.oneLiner).toEqual({ value: 'Sensori per vigneti', page: 1 });
    expect(a.settore).toEqual({ value: 'agritech', page: 1 });
    expect(a.round).toEqual({ value: 750_000, page: 4 });
    expect(a.regione).toBeUndefined();
    expect(a.fase).toBeUndefined();
    expect(a.team).toEqual({ value: 7, page: 3 });
    expect(a.traction.map((t) => ({ ...t, value: sp(t.value) }))).toEqual([
      { value: 'MRR 18.000 €', page: 2 },
      { value: '45 aziende clienti', page: 2 },
    ]);
    expect(hasAnything(a)).toBe(true);
  });

  it('rejects empty or non-positive edits', () => {
    const a = applyDecisions(F, { round: { action: 'edit', edited: 0 }, 'traction:mrr': { action: 'edit', edited: '  ' } });
    expect(a.round).toBeUndefined();
    expect(a.traction.map((t) => ({ ...t, value: sp(t.value) }))).toEqual([]);
  });
});

describe('acceptAll / tally', () => {
  it('marks pending rows as used and keeps explicit choices', () => {
    const d = acceptAll(F, { regione: { action: 'ignore' }, round: { action: 'edit', edited: 1 } });
    expect(d.regione).toEqual({ action: 'ignore' });
    expect(d.round).toEqual({ action: 'edit', edited: 1 });
    expect(d.settore).toEqual({ action: 'accept' });
    expect(tally(F, d)).toEqual({ used: 7, ignored: 1, pending: 0 });
    expect(tally(F, {})).toEqual({ used: 0, ignored: 0, pending: 8 });
  });
});

describe('texts', () => {
  it('formats findings in both languages', () => {
    expect(sp(findingText('settore', F.settore!, 'it'))).toBe('Agritech');
    expect(sp(findingText('round', F.round!, 'it'))).toBe('800.000 €');
    expect(sp(findingText('round', F.round!, 'en'))).toBe('€800,000');
    expect(sp(findingText('regione', F.regione!, 'it'))).toBe('Bari (Puglia)');
    expect(sp(findingText('team', F.team!, 'en'))).toBe('7 people');
  });

  it('formats traction signals', () => {
    expect(sp(tractionText({ kind: 'mrr', amount: 18_000 }, 'it'))).toBe('MRR 18.000 €');
    expect(sp(tractionText({ kind: 'arr', amount: 240_000 }, 'en'))).toBe('ARR €240,000');
    expect(sp(tractionText({ kind: 'revenue', amount: 1_200_000, currency: '$' }, 'en'))).toBe('Revenue $1,200,000');
    expect(sp(tractionText({ kind: 'customers', count: 42 }, 'it'))).toBe('Clienti: 42');
    expect(sp(tractionText({ kind: 'growth', pct: 12 }, 'en'))).toBe('Growth +12%');
    expect(sp(tractionText({ kind: 'loi' }, 'it'))).toBe('Lettere d’intenti (citati nel deck)');
  });
});

describe('match explanations', () => {
  const profile: StartupProfile = {
    id: 'tu',
    nome: 'X',
    founder: 'Y',
    email: '',
    oneLiner: '',
    settore: 'agritech',
    fase: 'seed',
    regione: 'puglia',
    round: 800_000,
  };
  const accepted: AcceptedDeck = {
    settore: { value: 'agritech', page: 1 },
    round: { value: 800_000, page: 4 },
    regione: { value: 'lazio', page: 5 },
    team: { value: 7, page: 3 },
    traction: [{ value: 'MRR 18.000 €', page: 2 }],
  };

  it('credits the deck only for values still in the confirmed profile', () => {
    expect(deckSources(profile, accepted)).toEqual({ settore: 1, round: 4 });
    expect(deckSources(profile, null)).toEqual({});
    expect(sourcesSummary({ settore: 1, round: 4 }, 'it')).toBe('settore (p. 1), importo del round (p. 4)');
  });

  it('annotates the matching reasons with the deck page', () => {
    const investor = demoInvestors('it').find((i) => evaluate(profile, i).eligible)!;
    const ev = evaluate(profile, investor);
    const out = annotateReasons(ev.reasons, { settore: 1, round: 4 }, 'it');
    expect(out[0]).toBe(`${ev.reasons[0]} (dal tuo deck, p. 1)`);
    expect(out[1]).toBe(`${ev.reasons[1]} (dal tuo deck, p. 4)`);
    expect(out[2]).toBe(ev.reasons[2]);
    expect(annotateReasons(ev.reasons, {}, 'en')).toEqual(ev.reasons);
  });

  it('lists team and traction as signals', () => {
    expect(deckSignals(accepted, 'it').map(sp)).toEqual(['Team: 7 persone', 'MRR 18.000 €']);
    expect(deckSignals(null)).toEqual([]);
  });
});
