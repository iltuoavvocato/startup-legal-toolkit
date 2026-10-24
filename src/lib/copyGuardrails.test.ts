import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEMO_INVESTORS, DEMO_STARTUPS, EXAMPLE_INVESTOR_FORM, EXAMPLE_STARTUP_FORM, demoInvestors, demoStartups } from '../data/matchDemo';
import { SAMPLE_DECK_TEXT } from '../data/sampleDeckText';
import { LOCALES } from '../i18n/locales';
import { MESSAGES, type Messages } from '../i18n/messages';
import { ALLOWED, FORBIDDEN, copyViolations } from './copyGuardrails';

// Every dictionary of the matching section (the other tools — equity, vesting, quiz — are not part of it).
const MATCH_MODULES: (keyof Messages)[] = ['match', 'matchDemo', 'intake', 'directory', 'exportDoc', 'guidedDemo', 'polish', 'hardening', 'explain', 'variants', 'privacy', 'common'];

/** Every string in a dictionary, with its key; functions contribute their source (template literals included). */
function strings(value: unknown, key: string): [string, string][] {
  if (typeof value === 'string') return [[key, value]];
  if (typeof value === 'function') return [[key, value.toString()]];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => strings(v, `${key}.${k}`));
  return [];
}

function report(entries: [string, string][]) {
  return entries.flatMap(([key, text]) => copyViolations(text).map((v) => `${key}: ${v.rule} → "${v.match}"`));
}

const demoEntries = (): [string, string][] => [
  ...LOCALES.flatMap((l) => strings(demoInvestors(l), `demoInvestors(${l})`)),
  ...LOCALES.flatMap((l) => strings(demoStartups(l), `demoStartups(${l})`)),
  ...strings(SAMPLE_DECK_TEXT, 'SAMPLE_DECK_TEXT'),
  ...strings(EXAMPLE_STARTUP_FORM, 'EXAMPLE_STARTUP_FORM'),
  ...strings(EXAMPLE_INVESTOR_FORM, 'EXAMPLE_INVESTOR_FORM'),
];

/** Non-test source files under src/ (for literals that live outside the dictionaries). */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(f) && !/\.test\.ts$/.test(f) ? [p] : [];
  });
}
const SRC = join(__dirname, '..');

describe('copy guardrails: the checker', () => {
  it.each([
    'Paga la commissione', 'Applichiamo una success fee del 3%', 'Pagamento in 3 rate', 'Investi ora nella startup',
    'Rendimento garantito del 10%', 'Ti consigliamo di investire in questa startup',
    'We charge a commission', 'Success fee on closing', 'Payment due', 'Pay now', 'Invest now',
    'Guaranteed return of 8%', 'We recommend investing in this startup', 'Place an order', 'Wire transfer to our escrow',
  ])('flags "%s"', (text) => {
    expect(copyViolations(text)).not.toEqual([]);
  });

  it.each([
    'Non gestiamo denaro', 'Tariffe fisse, nessuna success fee', 'We don’t handle money', 'Fixed fees, no success fee',
    'No investment advice', 'Nessun pagamento, deposito o strumento finanziario passa da qui.',
  ])('lets the negation "%s" through', (text) => {
    expect(copyViolations(text)).toEqual([]);
  });

  it('does not let an allowed negation hide a forbidden phrase next to it', () => {
    expect(copyViolations('Non gestiamo denaro, ma applichiamo una commissione')).toEqual([{ rule: 'commission', match: 'commissione' }]);
  });

  it('keeps the allow-list small and made of real phrases (each one is used somewhere)', () => {
    expect(ALLOWED.length).toBeLessThanOrEqual(40);
    const corpus = [...MATCH_MODULES.flatMap((m) => LOCALES.flatMap((l) => strings(MESSAGES[l][m], m))), ...demoEntries()]
      .map(([, t]) => t.replace(/'/g, '’').toLowerCase())
      .join('\n');
    for (const a of ALLOWED) expect(corpus, a).toContain(a.replace(/'/g, '’').toLowerCase());
    expect(FORBIDDEN.length).toBeGreaterThan(10);
  });
});

describe('copy guardrails: match dictionaries and demo data', () => {
  it.each(LOCALES)('no forbidden phrase in any match dictionary (%s)', (locale) => {
    const entries = MATCH_MODULES.flatMap((m) => strings(MESSAGES[locale][m], `${locale}.${m}`));
    expect(entries.length).toBeGreaterThan(500);
    expect(report(entries)).toEqual([]);
  });

  it('no forbidden phrase in the demo investors, startups, sample decks and example forms (IT + EN)', () => {
    expect(report(demoEntries())).toEqual([]);
  });

  it('the disclaimers that state the limits are still there (IT + EN)', () => {
    const all = (l: 'it' | 'en') => strings(MESSAGES[l].match, 'match').map(([, t]) => t).join('\n');
    expect(all('it')).toContain('Non gestiamo denaro');
    expect(all('it')).toContain('nessuna success fee');
    expect(all('en')).toContain('We don’t handle money');
    expect(all('en')).toContain('no success fee');
  });
});

describe('demo data: emails and names are clearly fictional', () => {
  const REAL_TLD = /\.(com|it|eu|net|org|io|ai|co|vc|app|dev|uk|de|fr|es|ch|us|biz|info|capital|ventures|fund)\b/i;
  const people = [...DEMO_INVESTORS, ...demoInvestors('en')];

  it('every demo investor email ends with .example and its domain has no real TLD in it', () => {
    for (const inv of people) {
      expect(inv.email, inv.id).toMatch(/^[a-z][a-z.-]*@[a-z][a-z-]*\.example$/);
      expect(inv.email.replace(/\.example$/, ''), inv.id).not.toMatch(REAL_TLD);
    }
  });

  it('every email literal anywhere in the app source ends with .example (or is the site’s own domain)', () => {
    const found = sourceFiles(SRC).flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/[\w.+-]+@([\w-]+(?:\.[\w-]+)+)/g)].map((m) => ({ f, email: m[0], domain: m[1]! })),
    );
    expect(found.length).toBeGreaterThan(30);
    const bad = found.filter(({ domain }) => !/^[a-z-]+\.example$/.test(domain) && domain !== 'iltuoavvocato.com');
    expect(bad.map(({ f, email }) => `${f.replace(SRC, 'src')}: ${email}`)).toEqual([]);
  });

  it('no demo investor, contact or startup name looks like a web domain', () => {
    const names = [
      ...people.flatMap((i) => [i.nome, i.referente]),
      ...[...DEMO_STARTUPS, ...demoStartups('en')].map((s) => s.nome ?? ''),
      SAMPLE_DECK_TEXT.it.nome,
      SAMPLE_DECK_TEXT.en.nome,
    ].filter(Boolean);
    expect(names.length).toBeGreaterThan(70);
    for (const n of names) {
      expect(n).not.toMatch(REAL_TLD);
      expect(n).not.toMatch(/www|https?:|@/i);
    }
  });
});
