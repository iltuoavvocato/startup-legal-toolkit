import { describe, expect, it } from 'vitest';
import {
  confidenceBand,
  countFindings,
  extractFromDeck,
  findAmounts,
  findFase,
  findRegione,
  findRound,
  findSettore,
  findTagline,
  findTeam,
  findTraction,
  normaliseText,
  parseAmount,
  parseNumber,
  snippetAround,
  uni,
  unwrap,
} from './deckExtract';

// Fictional decks, written the way real ones read once pdf.js has extracted the text (one string per page).
const IT_DECK = [
  'Vignalume\nL’agricoltura di precisione per i vigneti del Sud\nDeck di esempio fittizio – Seed 2026',
  'Il problema\nLe aziende agricole perdono fino al 20% del raccolto per malattie scoperte tardi.\nIrrigazione e trattamenti sono decisi a occhio.',
  'La soluzione\nSensori nei filari e un’app che avvisa l’agronomo 10 giorni prima. Agritech pensato per le colture mediterranee.',
  'Trazione\n42 aziende agricole clienti, 3 progetti pilota con cantine cooperative\nMRR di 18.000 € (+12% mese su mese)\n2 lettere d’intenti da consorzi',
  'Il mercato\nTAM: 2,4 miliardi € in Italia e Spagna. Abbiamo chiuso un pre-seed da 150k nel 2024.',
  'Il team\nSiamo un team di 7 persone tra agronomi e ingegneri, 3 cofondatori. Ex Università di Bari.',
  'Il round\nStiamo raccogliendo un round seed da 800.000 € per assumere e portare i sensori in 200 aziende.',
  'Contatti\nVignalume S.r.l. (fittizia) – sede operativa: Bari, via dei Mille 1 (indirizzo di esempio)',
];

const EN_DECK = [
  'Kelpwise\nRemote monitoring for chronic patients\nFictional sample deck',
  'Problem\nHospitals in Southern Italy discharge heart patients with almost no follow-up.',
  'Solution\nA digital health platform: a wearable patch and a dashboard for clinics and doctors.',
  'Traction\n1,200 active users, 9 paying customers (clinics)\nARR €240k, growing 15% MoM\n4 pilots with public hospitals, 2 LOIs',
  'Market\nSAM of €1.1B. Previous round: we raised $300k pre-seed from angels in 2024.',
  'Team\nWe are a team of 12: clinicians and engineers. 2 co-founders, both ex-Politecnico di Milano.',
  'The ask\nWe are raising a €1.2M seed round to scale to 30 hospitals.',
  'Contact\nKelpwise S.r.l. (fictional) – headquartered in Naples, Italy',
];

describe('parseNumber (IT and EN separators)', () => {
  it.each([
    ['1.500.000', false, 1_500_000],
    ['1,500,000', false, 1_500_000],
    ['800.000', false, 800_000],
    ['800,000', false, 800_000],
    ['1.5', true, 1.5],
    ['1,5', true, 1.5],
    ['1,250', true, 1.25],
    ['1.234,56', false, 1234.56],
    ['1,234.56', false, 1234.56],
    ['800 000', false, 800_000],
    ['12', false, 12],
  ] as const)('%s (multiplier: %s) → %d', (raw, mult, expected) => {
    expect(parseNumber(raw, mult)).toBe(expected);
  });

  it('rejects things that are not numbers', () => {
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('')).toBeNull();
  });
});

describe('parseAmount / findAmounts', () => {
  it.each([
    ['€1.5M', 1_500_000],
    ['€ 1,5M', 1_500_000],
    ['1,5 mln', 1_500_000],
    ['1,2 mln di euro', 1_200_000],
    ['1.2 million euro', 1_200_000],
    ['2 milioni €', 2_000_000],
    ['€800k', 800_000],
    ['800k€', 800_000],
    ['800K', 800_000],
    ['800 mila euro', 800_000],
    ['800.000 €', 800_000],
    ['€800,000', 800_000],
    ['EUR 750.000', 750_000],
    ['1.000.000 euro', 1_000_000],
    ['€2m', 2_000_000],
    ['$300k', 300_000],
    ['2,4 miliardi €', 2_400_000_000],
  ] as const)('%s → %d', (text, expected) => {
    expect(parseAmount(text)).toBe(expected);
  });

  it('ignores plain numbers, years, percentages and product names', () => {
    expect(findAmounts('Nel 2024 siamo cresciuti del 25% con 3 persone')).toEqual([]);
    expect(findAmounts('Piattaforma B2B per 4G e Q3')).toEqual([]);
  });

  it('records the currency and what follows the amount', () => {
    const [a] = findAmounts('$300k raised');
    expect(a).toMatchObject({ value: 300_000, currency: '$', hasMultiplier: true });
    const [b] = findAmounts('10k utenti attivi');
    expect(b?.currency).toBeNull();
    expect(b?.after).toMatch(/^ utenti/);
  });
});

describe('findRound', () => {
  it('finds the ask in an Italian deck, not the market size or the previous round', () => {
    const r = findRound(IT_DECK)!;
    expect(r.value).toBe(800_000);
    expect(r.page).toBe(7);
    expect(r.snippet).toContain('800.000 €');
    expect(confidenceBand(r.confidence)).toBe('alta');
  });

  it('finds the ask in an English deck and ignores ARR and the previous raise', () => {
    const r = findRound(EN_DECK)!;
    expect(r.value).toBe(1_200_000);
    expect(r.page).toBe(7);
    expect(r.currency).toBeUndefined();
  });

  it.each([
    ['Cerchiamo 1,5 mln per il seed', 1_500_000],
    ['Round da 800k', 800_000],
    ['Obiettivo di raccolta: 1,2 mln', 1_200_000],
    ['Raising €2.5M Series A', 2_500_000],
    ['We are raising 500k', 500_000],
    ['Aumento di capitale di 600.000 euro', 600_000],
    ['Seeking EUR 1,000,000 to expand', 1_000_000],
  ] as const)('“%s” → %d', (line, expected) => {
    expect(findRound(['Intro', line])?.value).toBe(expected);
  });

  it('uses a slide title such as “The ask” for an amount on the next line', () => {
    const r = findRound(['The ask\n€1.5M\nto reach break-even'])!;
    expect(r.value).toBe(1_500_000);
  });

  it('returns nothing for revenue, market sizes or past raises alone', () => {
    expect(findRound(['Fatturato 2025: 1,2 mln €', 'TAM €4B', 'We raised €500k in 2024'])).toBeNull();
    expect(findRound(['Nessun importo qui'])).toBeNull();
  });

  it('lowers the confidence for non-euro amounts and for competing asks', () => {
    expect(findRound(['We are raising $2M'])!.confidence).toBeLessThan(findRound(['We are raising €2M'])!.confidence);
    const two = findRound(['Raising €1M', 'Raising €2M']);
    expect(two!.confidence).toBeLessThan(0.75);
    expect(findRound(['We are raising $2M'])!.currency).toBe('$');
  });

  it('does not take counts for money (“2M users”)', () => {
    expect(findRound(['Round: we reached 2M users'])).toBeNull();
  });
});

describe('findSettore', () => {
  it('maps the Italian deck to agritech and the English one to healthtech', () => {
    const it = findSettore(IT_DECK)!;
    expect(it.value).toBe('agritech');
    expect(it.confidence).toBeGreaterThanOrEqual(0.65);
    expect(it.page).toBeGreaterThanOrEqual(1);
    const en = findSettore(EN_DECK)!;
    expect(en.value).toBe('healthtech');
    expect(en.snippet.length).toBeGreaterThan(0);
  });

  it.each([
    ['Fintech per le PMI: pagamenti e incassi delle fatture', 'fintech'],
    ['SaaS B2B per il controllo di gestione delle PMI', 'saas-b2b'],
    ['Cleantech: fotovoltaico e batterie per i condomini, meno emissioni di CO2', 'cleantech'],
    ['Edtech: corsi online per studenti e insegnanti delle scuole superiori', 'edtech'],
    ['Proptech for rentals: tenants and landlords in one app, real estate made simple', 'proptech'],
    ['Micromobility: charging for fleets of e-scooters, last-mile mobility', 'mobilita'],
    ['Food delivery for restaurants, less food waste', 'foodtech'],
    ['Deep tech: photonics chips and quantum sensors, patented', 'deeptech'],
    ['Consumer app, D2C beauty brand with e-commerce', 'consumer'],
    ['Piattaforma per la sanità digitale: telemedicina per i pazienti', 'healthtech'],
  ] as const)('“%s” → %s', (text, expected) => {
    expect(findSettore([text])?.value).toBe(expected);
  });

  it('needs more than a passing word', () => {
    expect(findSettore(['Il nostro team ama il food'])).toBeNull();
    expect(findSettore([''])).toBeNull();
  });

  it('is less confident when two sectors are close', () => {
    const mixed = findSettore(['Fintech per la sanità: pagamenti per i pazienti delle cliniche'])!;
    expect(mixed.confidence).toBeLessThan(0.85);
  });
});

describe('findFase', () => {
  it('prefers the stage being raised now over a stage closed in the past', () => {
    expect(findFase(IT_DECK)!.value).toBe('seed');
    expect(findFase(EN_DECK)!.value).toBe('seed');
  });

  it.each([
    ['Apriamo il round pre-seed', 'pre-seed'],
    ['Raising our pre seed round', 'pre-seed'],
    ['Round seed in corso', 'seed'],
    ['Raising a Series A', 'serie-a'],
    ['Stiamo raccogliendo la serie A', 'serie-a'],
  ] as const)('“%s” → %s', (text, expected) => {
    expect(findFase([text])?.value).toBe(expected);
  });

  it('does not read “seed” inside “pre-seed”, nor “round a” (Italian “a”) as Series A', () => {
    expect(findFase(['Round pre-seed'])!.value).toBe('pre-seed');
    expect(findFase(['Partecipiamo al round a Milano'])).toBeNull();
  });

  it('ignores stages only mentioned as already closed', () => {
    expect(findFase(['We closed our seed round in 2024'])).toBeNull();
  });
});

describe('findRegione', () => {
  it('maps cities to regions, preferring the registered office', () => {
    const it = findRegione(IT_DECK)!;
    expect(it).toMatchObject({ value: 'puglia', place: 'Bari', page: 8 });
    expect(confidenceBand(it.confidence)).toBe('alta');
    const en = findRegione(EN_DECK)!;
    expect(en).toMatchObject({ value: 'campania', place: 'Naples' });
  });

  it.each([
    ['Sede a Milano', 'lombardia'],
    ['Based in Turin', 'piemonte'],
    ['HQ: Reggio Emilia', 'emilia-romagna'],
    ['Sede legale a Forlì', 'emilia-romagna'],
    ['Uffici a Firenze e Pisa', 'toscana'],
    ["Sede all'Aquila? No: sede a L'Aquila", 'abruzzo'],
    ['Headquartered in Sardinia', 'sardegna'],
  ] as const)('“%s” → %s', (text, expected) => {
    expect(findRegione([text])?.value).toBe(expected);
  });

  it('weighs a university mention less than the office', () => {
    expect(findRegione(['Founder ex Politecnico di Milano', 'Sede operativa: Torino'])!.value).toBe('piemonte');
  });

  it('is case-sensitive, so common words are not places', () => {
    expect(findRegione(['come marche e brand diversi'])).toBeNull();
  });
});

describe('findTeam', () => {
  it('reads the team size in IT and EN decks', () => {
    expect(findTeam(IT_DECK)).toMatchObject({ value: 7, page: 6 });
    expect(findTeam(EN_DECK)).toMatchObject({ value: 12, page: 6 });
  });

  it.each([
    ['Team di 5 persone', 5],
    ['Siamo in otto', 8],
    ['15 dipendenti a tempo pieno', 15],
    ['Team: 4', 4],
    ['A team of three engineers', 3],
    ['6 FTE', 6],
  ] as const)('“%s” → %d', (text, expected) => {
    expect(findTeam([text])?.value).toBe(expected);
  });

  it('falls back to the founders, with low confidence, and ignores users', () => {
    const f = findTeam(['3 cofondatori'])!;
    expect(f.value).toBe(3);
    expect(confidenceBand(f.confidence)).toBe('bassa');
    expect(findTeam(['200 persone usano già l’app'])).toBeNull();
  });
});

describe('findTraction', () => {
  it('collects the Italian deck’s signals', () => {
    const t = findTraction(IT_DECK);
    const by = Object.fromEntries(t.map((f) => [f.value.kind, f]));
    expect(by.mrr?.value.amount).toBe(18_000);
    expect(by.customers?.value.count).toBe(42);
    expect(by.pilots?.value.count).toBe(3);
    expect(by.loi?.value.count).toBe(2);
    expect(by.growth?.value.pct).toBe(12);
    expect(by.mrr?.page).toBe(4);
  });

  it('collects the English deck’s signals', () => {
    const t = findTraction(EN_DECK);
    const by = Object.fromEntries(t.map((f) => [f.value.kind, f]));
    expect(by.arr?.value.amount).toBe(240_000);
    expect(by.users?.value.count).toBe(1200);
    expect(by.customers?.value.count).toBe(9);
    expect(by.growth?.value.pct).toBe(15);
    expect(by.pilots?.value.count).toBe(4);
    expect(by.loi?.value.count).toBe(2);
  });

  it.each([
    ['Fatturato 2025: 350.000 €', 'revenue', { amount: 350_000 }],
    ['Revenue of $1.2M last year', 'revenue', { amount: 1_200_000, currency: '$' }],
    ['12k utenti registrati', 'users', { count: 12_000 }],
    ['3.500 utenti attivi', 'users', { count: 3500 }],
    ['Crescita del 30% anno su anno', 'growth', { pct: 30 }],
    ['3x YoY', 'growth', { pct: 200 }],
    ['Pilota con due ospedali in corso', 'pilots', {}],
    ['Una LOI firmata con un distributore', 'loi', {}],
  ] as const)('“%s” → %s', (text, kind, values) => {
    const f = findTraction([text]).find((x) => x.value.kind === kind);
    expect(f?.value).toMatchObject({ kind, ...values });
  });

  it('does not take market size or a past raise for revenue', () => {
    expect(findTraction(['Mercato da 2 miliardi di fatturato', 'We raised €500k: revenue soon']).some((f) => f.value.kind === 'revenue')).toBe(false);
  });

  it('skips prospects counted as customers', () => {
    expect(findTraction(['500 clienti potenziali in target']).some((f) => f.value.kind === 'customers')).toBe(false);
  });
});

describe('extractFromDeck', () => {
  it('returns every field plus stats, and is deterministic', () => {
    const a = extractFromDeck(IT_DECK);
    expect(a.settore?.value).toBe('agritech');
    expect(a.fase?.value).toBe('seed');
    expect(a.round?.value).toBe(800_000);
    expect(a.regione?.value).toBe('puglia');
    expect(a.team?.value).toBe(7);
    expect(a.stats.pages).toBe(IT_DECK.length);
    expect(a.stats.chars).toBeGreaterThan(300);
    expect(countFindings(a)).toBeGreaterThanOrEqual(9);
    expect(extractFromDeck(IT_DECK)).toEqual(a);
  });

  it('returns empty findings for a deck with no usable text', () => {
    const x = extractFromDeck(['', '  ']);
    expect(countFindings(x)).toBe(0);
    expect(x.stats.chars).toBe(0);
  });

  it('every finding points to a real page and has a snippet from that page', () => {
    const x = extractFromDeck(EN_DECK);
    const all = [x.settore, x.fase, x.round, x.regione, x.team, ...x.traction].filter((f) => f !== null);
    for (const f of all) {
      expect(f.page).toBeGreaterThanOrEqual(1);
      expect(f.page).toBeLessThanOrEqual(EN_DECK.length);
      const words = f.snippet.replace(/…/g, '').split(' ').slice(0, 2).join(' ');
      expect(normaliseText(EN_DECK[f.page - 1]!)).toContain(words);
      expect(f.confidence).toBeGreaterThan(0);
      expect(f.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe('helpers', () => {
  it('confidenceBand', () => {
    expect(confidenceBand(0.9)).toBe('alta');
    expect(confidenceBand(0.6)).toBe('media');
    expect(confidenceBand(0.3)).toBe('bassa');
  });

  it('snippetAround keeps short lines and trims long ones around the match', () => {
    expect(snippetAround('Round da 800k', 9, 4)).toBe('Round da 800k');
    const long = `${'parola '.repeat(40)}OBIETTIVO €1M ${'altro '.repeat(40)}`;
    const s = snippetAround(long, long.indexOf('OBIETTIVO'), 13, 60);
    expect(s).toContain('OBIETTIVO €1M');
    expect(s.startsWith('…')).toBe(true);
    expect(s.endsWith('…')).toBe(true);
    expect(s.length).toBeLessThanOrEqual(62);
  });

  it('normaliseText folds non-breaking spaces, dashes and curly quotes', () => {
    expect(normaliseText('800 000 € – l’ask')).toBe("800 000 € - l'ask");
  });

  it('uni() gives \\b a Unicode-aware meaning', () => {
    expect(/\bsanità\b/.test('la sanità digitale')).toBe(false);
    expect(uni(/\bsanità\b/).test('la sanità digitale')).toBe(true);
    expect(uni(/\bseed\b/i).test('preseed')).toBe(false);
  });
});

describe('findTagline', () => {
  it('takes the cover subtitle, not the name or the "sample deck" line', () => {
    expect(findTagline(IT_DECK)?.value).toBe('L’agricoltura di precisione per i vigneti del Sud');
    expect(findTagline(EN_DECK)?.value).toBe('Remote monitoring for chronic patients');
    expect(findTagline(EN_DECK)?.page).toBe(1);
  });

  it('returns nothing when the cover has no usable line', () => {
    expect(findTagline(['Acme\nPitch deck 2026\nConfidential'])).toBeNull();
    expect(findTagline([])).toBeNull();
  });
});

describe('unwrap', () => {
  it('joins a sentence wrapped by the PDF, keeps titles and new sentences apart', () => {
    expect(unwrap(['A platform for clinics and', 'doctors in Naples.', 'Team', 'We are 5', '42 clienti'])).toEqual([
      'A platform for clinics and doctors in Naples.',
      'Team',
      'We are 5',
      '42 clienti',
    ]);
  });
});
