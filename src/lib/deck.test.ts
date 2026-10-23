import { describe, expect, it } from 'vitest';
import {
  agentSteps,
  DEMO_EXTRACTION,
  formatFileSize,
  MAX_DECK_MB,
  mockExtract,
  startupFlowSteps,
  toOneLiner,
  validateDeck,
  type StartupForm,
} from './deck';

const empty: StartupForm = { settore: '', fase: '', regione: '', round: null, descrizione: '' };

describe('validateDeck', () => {
  it('accepts PDFs, by MIME type or extension (any case)', () => {
    expect(validateDeck({ name: 'deck.pdf', type: 'application/pdf', size: 1000 })).toBeNull();
    expect(validateDeck({ name: 'DECK.PDF', type: '', size: 1000 })).toBeNull();
  });

  it('rejects other formats, empty files and files over the limit', () => {
    expect(validateDeck({ name: 'deck.pptx', type: 'application/vnd.ms-powerpoint', size: 1000 })).toMatch(/PDF/);
    expect(validateDeck({ name: 'deck.pdf', type: 'application/pdf', size: 0 })).toMatch(/vuoto/);
    expect(validateDeck({ name: 'deck.pdf', type: 'application/pdf', size: MAX_DECK_MB * 1024 * 1024 })).toBeNull();
    expect(validateDeck({ name: 'deck.pdf', type: 'application/pdf', size: MAX_DECK_MB * 1024 * 1024 + 1 })).toMatch(/MB/);
  });
});

describe('mockExtract', () => {
  it('falls back to the fixed demo extraction', () => {
    const x = mockExtract(null, empty);
    expect(x.settore).toEqual({ value: DEMO_EXTRACTION.settore, fonte: 'esempio' });
    expect(x.round).toEqual({ value: DEMO_EXTRACTION.round, fonte: 'esempio' });
    expect(x.oneLiner.fonte).toBe('esempio');
  });

  it('reads keywords from the file name', () => {
    const x = mockExtract({ name: 'Healthtech_PreSeed-Roma_250k.pdf' }, empty);
    expect(x.settore).toEqual({ value: 'healthtech', fonte: 'deck' });
    expect(x.fase).toEqual({ value: 'pre-seed', fonte: 'deck' });
    expect(x.regione).toEqual({ value: 'lazio', fonte: 'deck' });
    expect(x.round).toEqual({ value: 250_000, fonte: 'deck' });
  });

  it('distinguishes seed from pre-seed and serie A', () => {
    expect(mockExtract({ name: 'deck-seed.pdf' }, empty).fase.value).toBe('seed');
    expect(mockExtract({ name: 'deck serie A.pdf' }, empty).fase.value).toBe('serie-a');
  });

  it('lets form values win over the file name', () => {
    const x = mockExtract(
      { name: 'healthtech-roma.pdf' },
      { settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000, descrizione: 'Pagamenti per PMI.' },
    );
    expect(x.settore).toEqual({ value: 'fintech', fonte: 'modulo' });
    expect(x.regione).toEqual({ value: 'lombardia', fonte: 'modulo' });
    expect(x.round).toEqual({ value: 500_000, fonte: 'modulo' });
    expect(x.oneLiner).toEqual({ value: 'Pagamenti per PMI.', fonte: 'modulo' });
  });

  it('ignores invalid form values', () => {
    expect(mockExtract(null, { ...empty, settore: 'astrologia' }).settore.fonte).toBe('esempio');
  });

  it('is deterministic', () => {
    const input = [{ name: 'Fintech Milano seed.pdf' }, { ...empty, descrizione: 'Una frase.' }] as const;
    expect(mockExtract(...input)).toEqual(mockExtract(...input));
  });
});

describe('toOneLiner', () => {
  it('keeps short text and caps long text at 140 characters', () => {
    expect(toOneLiner('  Breve   frase. ')).toBe('Breve frase.');
    const long = 'parola '.repeat(60);
    const out = toOneLiner(long);
    expect(out.length).toBeLessThanOrEqual(140);
    expect(out.endsWith('…')).toBe(true);
  });

  it('prefers the first sentence when it fits', () => {
    const text = `Prima frase breve. ${'Seconda frase molto lunga '.repeat(10)}`;
    expect(toOneLiner(text)).toBe('Prima frase breve.');
  });
});

describe('formatFileSize', () => {
  it('formats KB and MB in Italian', () => {
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1,5 MB');
  });
});

describe('agentSteps', () => {
  it('mentions reading the deck only when there is one', () => {
    expect(agentSteps('it', true)[0]).toBe('Lettura del deck');
    expect(agentSteps('en', true)[0]).toBe('Reading the deck');
    for (const locale of ['it', 'en'] as const) {
      const steps = agentSteps(locale, false);
      expect(steps).toHaveLength(agentSteps(locale, true).length);
      expect(steps.join(' ')).not.toMatch(/deck/i);
    }
  });
});

describe('startupFlowSteps', () => {
  it('labels the analysis step as reading the deck only when there is one', () => {
    expect(startupFlowSteps('it', true)[1]).toBe('Lettura del deck');
    expect(startupFlowSteps('en', true)[1]).toBe('Reading the deck');
    expect(startupFlowSteps('it', false)[1]).toBe('Analisi dei dati');
    expect(startupFlowSteps('en', false)[1]).toBe('Analysing your details');
    for (const locale of ['it', 'en'] as const) {
      const steps = startupFlowSteps(locale, false);
      expect(steps).toHaveLength(startupFlowSteps(locale, true).length);
      // Only the first step (where the deck can be uploaded) may mention it.
      expect(steps.slice(1).join(' ')).not.toMatch(/deck/i);
    }
  });
});
