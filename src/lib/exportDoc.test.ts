import { describe, expect, it } from 'vitest';
import { demoInvestors } from '../data/matchDemo';
import { MESSAGES } from '../i18n/messages';
import {
  buildInvestorDoc,
  buildStartupDoc,
  cleanLine,
  cleanText,
  emptyExportStore,
  exportQuery,
  investorSheetOf,
  isoDay,
  kindFromQuery,
  mdEscape,
  NAME_MAX,
  NOTES_MAX,
  parseExportStore,
  serializeExportStore,
  startupSheetOf,
  toMarkdown,
  toPlainText,
  topInvestorTypes,
  TRACTION_MAX_ITEMS,
  type ExportDoc,
  type InvestorSheet,
  type StartupSheet,
} from './exportDoc';

const NOW = new Date(2026, 9, 24, 12).getTime();
const LOCALES = ['it', 'en'] as const;
const core = { settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000 } as const;
const sheet = (): StartupSheet =>
  startupSheetOf({ source: 'form', core, oneLiner: 'Pagamenti istantanei per le PMI', team: 7, traction: ['MRR 18.000 €', '42 clienti'] })!;
const thesis = { settori: ['fintech', 'saas-b2b'], fasi: ['seed', 'pre-seed'], ticketMin: 25_000, ticketMax: 150_000, aree: ['nord-ovest'], sede: 'lombardia' } as const;
const invSheet = (): InvestorSheet =>
  investorSheetOf({ source: 'agent', thesis: { ...thesis, settori: [...thesis.settori], fasi: [...thesis.fasi], aree: [...thesis.aree] } })!;

const plain = (doc: ExportDoc) => toPlainText(doc).replace(/[\u00a0\u202f]/g, ' ');
const all = (doc: ExportDoc) => [toMarkdown(doc), toPlainText(doc), JSON.stringify(doc)];

// Text that must never reach an export: deck text, snippets, file name, founder name, e-mails, descriptions.
const SECRET = {
  description: 'DESCRIZIONE-PRIVATA del modulo',
  deckText: 'TESTO-DEL-DECK pagina 3 riservato',
  snippet: 'SNIPPET-DAL-DECK',
  findings: { tagline: { value: 'TAGLINE-NON-ACCETTATA', snippet: 'SNIPPET-2' } },
  fileName: 'deck-segreto.pdf',
  founder: 'Giulia Founderini',
  email: 'giulia@startup.example',
  nome: 'NOME-NON-DIGITATO',
};

describe('startup one-pager', () => {
  it('has the profile, team and traction, investor types, double opt-in, disclaimer, footer and date (IT and EN)', () => {
    for (const locale of LOCALES) {
      const D = MESSAGES[locale].exportDoc.doc;
      for (const variant of ['teaser', 'full'] as const) {
        const doc = buildStartupDoc(sheet(), { variant, locale, now: NOW, name: 'Pagalampo', investors: demoInvestors(locale) });
        expect(doc.sections.map((s) => s.id)).toEqual(['profile', 'pitch', 'signals', 'types', 'optin']);
        const md = toMarkdown(doc);
        for (const needle of [
          locale === 'it' ? 'Fintech' : 'Fintech',
          locale === 'it' ? '500.000 €' : '€500,000',
          locale === 'it' ? 'Lombardia' : 'Lombardy',
          locale === 'it' ? 'Seed' : 'Seed',
          D.teamValue(7),
          'MRR 18.000 €',
          D.footer(locale === 'it' ? '24 ottobre 2026' : '24 October 2026'),
        ]) {
          expect(plain(doc), needle).toContain(needle.replace(/[\u00a0\u202f]/g, ' '));
        }
        expect(md).toContain(`## ${mdEscape(D.optinTitle)}`);
        expect(md).toContain(mdEscape(MESSAGES[locale].common.disclaimer));
        expect(doc.date).toBe(locale === 'it' ? '24 ottobre 2026' : '24 October 2026');
        expect(doc.fileName).toMatch(/^matchinvstar-[a-z-]+-2026-10-24\.md$/);
        const types = doc.sections.find((s) => s.id === 'types')!;
        expect(types.items!.length).toBeGreaterThan(0);
        expect(types.note).toContain(locale === 'it' ? 'fittizi' : 'fictional');
      }
    }
  });

  it('the teaser is anonymous; the full version names the startup only when the founder typed a name', () => {
    for (const locale of LOCALES) {
      const investors = demoInvestors(locale);
      const teaser = buildStartupDoc(sheet(), { variant: 'teaser', locale, now: NOW, name: 'Pagalampo', investors });
      expect(teaser.name).toBeNull();
      for (const text of all(teaser)) expect(text).not.toContain('Pagalampo');
      const full = buildStartupDoc(sheet(), { variant: 'full', locale, now: NOW, name: '  Pagalampo  ', investors });
      expect(full.name).toBe('Pagalampo');
      expect(toMarkdown(full)).toMatch(/^# Pagalampo$/m);
      for (const name of [undefined, null, '', '   ']) {
        const unnamed = buildStartupDoc(sheet(), { variant: 'full', locale, now: NOW, name, investors });
        expect(unnamed.name).toBeNull();
        // No placeholder name ("La tua startup") is invented either.
        expect(toPlainText(unnamed)).not.toContain(MESSAGES[locale].match.own.startupName);
      }
    }
  });

  it('never leaks deck text or fields outside the whitelist, even if the input object carries them', () => {
    const dirty = { ...sheet(), ...SECRET, core: { ...core, ...SECRET } } as unknown as StartupSheet;
    for (const locale of LOCALES) {
      for (const variant of ['teaser', 'full'] as const) {
        const doc = buildStartupDoc(dirty, { variant, locale, now: NOW, investors: demoInvestors(locale) });
        for (const text of all(doc)) {
          for (const v of ['DESCRIZIONE-PRIVATA', 'TESTO-DEL-DECK', 'SNIPPET', 'TAGLINE-NON-ACCETTATA', 'deck-segreto', 'Giulia', '@', 'NOME-NON-DIGITATO']) {
            expect(text, `${locale}/${variant}: ${v}`).not.toContain(v);
          }
        }
      }
    }
    // The sanitised sheet itself keeps only whitelisted keys.
    const clean = startupSheetOf(dirty)!;
    expect(Object.keys(clean).sort()).toEqual(['core', 'oneLiner', 'source', 'team', 'traction']);
    expect(Object.keys(clean.core).sort()).toEqual(['fase', 'regione', 'round', 'settore']);
  });

  it('without accepted deck signals or a one-liner, it says so and adds nothing', () => {
    const bare = startupSheetOf({ source: 'agent', core })!;
    const doc = buildStartupDoc(bare, { variant: 'teaser', locale: 'it', now: NOW, investors: demoInvestors() });
    expect(doc.sections.map((s) => s.id)).toEqual(['profile', 'signals', 'types', 'optin']);
    expect(toPlainText(doc)).toContain(MESSAGES.it.exportDoc.doc.noSignals);
  });

  it('with no fitting investor, says so (still labelled fictional)', () => {
    const doc = buildStartupDoc(startupSheetOf({ source: 'form', core: { ...core, fase: 'serie-a', round: 1 } })!, {
      variant: 'teaser',
      locale: 'en',
      now: NOW,
      investors: [],
    });
    const types = doc.sections.find((s) => s.id === 'types')!;
    expect(types.paragraphs).toEqual([MESSAGES.en.exportDoc.doc.noTypes]);
    expect(types.note).toContain('fictional');
  });

  it('counts investor types from the fictional matches, most frequent first', () => {
    const { types, matches } = topInvestorTypes(core, demoInvestors());
    expect(types.reduce((n, t) => n + t.count, 0)).toBe(matches);
    for (let i = 1; i < types.length; i++) expect(types[i - 1]!.count).toBeGreaterThanOrEqual(types[i]!.count);
  });

  it('clips and cleans free text; caps traction lines', () => {
    const s = startupSheetOf({
      source: 'form',
      core,
      oneLiner: `riga\u0000uno\n\n${'x'.repeat(300)}`,
      team: 3.5,
      traction: Array.from({ length: 12 }, (_, k) => `T${k}`),
    })!;
    expect(s.oneLiner!.length).toBeLessThanOrEqual(140);
    // eslint-disable-next-line no-control-regex
    expect(s.oneLiner).not.toMatch(/[\u0000\n]/);
    expect(s.team).toBeNull();
    expect(s.traction).toHaveLength(TRACTION_MAX_ITEMS);
    const doc = buildStartupDoc(s, { variant: 'full', locale: 'it', now: NOW, name: 'n'.repeat(500), investors: demoInvestors() });
    expect(doc.name!.length).toBeLessThanOrEqual(NAME_MAX);
    expect(startupSheetOf({ source: 'form', core: { ...core, round: -1 } })).toBeNull();
    expect(startupSheetOf({ source: 'form', core: { ...core, settore: 'crypto' as never } })).toBeNull();
  });

  it('escapes Markdown in typed text so a name can\'t inject links, headings or HTML', () => {
    const doc = buildStartupDoc(sheet(), {
      variant: 'full',
      locale: 'it',
      now: NOW,
      name: '# [clic](https://x.example) <img src=x onerror=alert(1)>',
      investors: demoInvestors(),
    });
    const md = toMarkdown(doc);
    expect(md).not.toMatch(/[^\\]\]\(https:/);
    expect(md).not.toMatch(/(^|[^\\])<img/);
    expect(md).toMatch(/^# \\# \\\[clic\\\]/m);
  });
});

describe('investor thesis sheet', () => {
  it('has sectors (main first), stages, ticket, regions, base, double opt-in, disclaimer and footer (IT and EN)', () => {
    for (const locale of LOCALES) {
      const D = MESSAGES[locale].exportDoc.doc;
      const doc = buildInvestorDoc(invSheet(), { locale, now: NOW, name: 'Club Deal Esempio', notes: 'Preferiamo round con lead.' });
      expect(doc.sections.map((s) => s.id)).toEqual(['thesis', 'notes', 'optin']);
      const text = plain(doc);
      expect(text).toContain(`Fintech${D.mainSuffix}`);
      expect(text).toContain(locale === 'it' ? 'da 25.000 € a 150.000 €' : '€25,000 to €150,000');
      expect(text).toContain(locale === 'it' ? 'Nord-Ovest' : 'North-West');
      expect(text).toContain('Preferiamo round con lead.');
      expect(text).toContain(MESSAGES[locale].common.disclaimer);
      expect(text).toContain(D.footer(doc.date));
      expect(doc.tags).not.toContain(D.tags.fictional);
    }
    const italy = investorSheetOf({ source: 'form', thesis: { ...invSheet().thesis, aree: 'italia', sede: null } })!;
    const it = toPlainText(buildInvestorDoc(italy, { locale: 'it', now: NOW }));
    expect(it).toContain('Tutta Italia');
    expect(it).toContain('Non indicata');
  });

  it('labels a demo investor\'s sheet as fictional; generalists read as such', () => {
    const doc = buildInvestorDoc(invSheet(), { locale: 'en', now: NOW, name: 'Demo', fictional: true, generalist: true });
    expect(doc.tags).toContain('Fictional sample data');
    expect(doc.sections[0]!.rows![0]!.value).toBe('All sectors (generalist)');
  });

  it('keeps notes multi-line but clipped, and drops unknown fields', () => {
    const doc = buildInvestorDoc({ ...invSheet(), ...SECRET } as unknown as InvestorSheet, {
      locale: 'it',
      now: NOW,
      notes: `uno\n\n\n\ndue ${'y'.repeat(2000)}`,
    });
    const notes = doc.sections.find((s) => s.id === 'notes')!;
    expect(notes.paragraphs![0]).toBe('uno');
    expect(notes.paragraphs!.join('\n\n').length).toBeLessThanOrEqual(NOTES_MAX);
    for (const text of all(doc)) for (const v of ['DESCRIZIONE', 'TESTO-DEL-DECK', 'Giulia', '@']) expect(text).not.toContain(v);
    expect(cleanText('  a \t b \r\n\r\n\r\n c ', 100)).toBe('a b\n\nc');
    expect(cleanLine(42, 10)).toBe('');
  });

  it('rejects invalid theses', () => {
    expect(investorSheetOf({ source: 'form', thesis: { ...invSheet().thesis, settori: [] } })).toBeNull();
    expect(investorSheetOf({ source: 'form', thesis: { ...invSheet().thesis, ticketMin: 9, ticketMax: 1 } })).toBeNull();
    expect(investorSheetOf({ source: 'form', thesis: { ...invSheet().thesis, aree: [] } })).toBeNull();
  });
});

describe('every export', () => {
  it('always carries the disclaimer, the limits and the local/prototype footer', () => {
    const docs: ExportDoc[] = LOCALES.flatMap((locale) => [
      buildStartupDoc(sheet(), { variant: 'teaser', locale, now: NOW, investors: demoInvestors(locale) }),
      buildStartupDoc(sheet(), { variant: 'full', locale, now: NOW, name: 'X', investors: demoInvestors(locale) }),
      buildStartupDoc(startupSheetOf({ source: 'agent', core })!, { variant: 'full', locale, now: NOW, investors: [] }),
      buildInvestorDoc(invSheet(), { locale, now: NOW }),
      buildInvestorDoc(invSheet(), { locale, now: NOW, fictional: true, notes: 'n' }),
    ]);
    for (const doc of docs) {
      const disclaimer = MESSAGES[doc.locale].common.disclaimer;
      expect(doc.disclaimer).toBe(disclaimer);
      expect(toPlainText(doc)).toContain(disclaimer);
      expect(toMarkdown(doc)).toContain(`**${mdEscape(disclaimer)}**`);
      expect(toPlainText(doc)).toContain(doc.limits);
      expect(doc.footer).toMatch(doc.locale === 'it' ? /^Generato localmente – dati di esempio\/prototipo · / : /^Generated locally – sample\/prototype data · /);
      expect(toPlainText(doc)).toContain(doc.footer);
      expect(toPlainText(doc)).not.toMatch(/undefined|NaN|\$\{|\[object/);
    }
  });
});

describe('storage and query', () => {
  it('round-trips the store and drops anything malformed or not whitelisted', () => {
    const store = { v: 1 as const, startup: sheet(), investor: invSheet() };
    expect(parseExportStore(serializeExportStore(store))).toEqual(store);
    expect(parseExportStore(null)).toEqual(emptyExportStore());
    expect(parseExportStore('{nope')).toEqual(emptyExportStore());
    expect(parseExportStore('{"v":2}')).toEqual(emptyExportStore());
    const dirty = JSON.stringify({ v: 1, startup: { ...sheet(), ...SECRET }, investor: { source: 'form', thesis: { settori: ['crypto'] } } });
    const back = parseExportStore(dirty);
    expect(back.investor).toBeNull();
    expect(serializeExportStore(back)).not.toMatch(/DESCRIZIONE|TESTO-DEL-DECK|SNIPPET|Giulia|@|deck-segreto|NOME-NON/);
  });

  it('reads and writes the document kind in both languages', () => {
    expect(kindFromQuery(new URLSearchParams('tipo=investitore'))).toBe('investor');
    expect(kindFromQuery(new URLSearchParams('type=investor'))).toBe('investor');
    expect(kindFromQuery(new URLSearchParams('tipo=startup'))).toBe('startup');
    expect(kindFromQuery(new URLSearchParams(''))).toBe('startup');
    expect(exportQuery('investor', 'it')).toBe('?tipo=investitore');
    expect(exportQuery('investor', 'en', 'i07')).toBe('?type=investor&id=i07');
    expect(exportQuery('startup', 'en')).toBe('?type=startup');
    expect(isoDay(NOW)).toBe('2026-10-24');
  });
});
