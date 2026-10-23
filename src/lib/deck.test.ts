import { describe, expect, it } from 'vitest';
import {
  agentSteps,
  DEMO_EXTRACTION,
  formatFileSize,
  MAX_DECK_MB,
  draftExtraction,
  startupFlowSteps,
  toOneLiner,
  validateDeck,
  type AcceptedDeck,
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

describe('draftExtraction', () => {
  it('falls back to the fixed demo extraction', () => {
    const x = draftExtraction(empty, null);
    expect(x.settore).toEqual({ value: DEMO_EXTRACTION.settore, fonte: 'esempio' });
    expect(x.round).toEqual({ value: DEMO_EXTRACTION.round, fonte: 'esempio' });
    expect(x.oneLiner.fonte).toBe('esempio');
  });

  it('never infers anything from the file name any more', () => {
    // The old mock read "healthtech" or "roma" from the name; now only the deck's text (via the review) counts.
    expect(draftExtraction(empty, { traction: [] }).settore.fonte).toBe('esempio');
  });

  it('uses what the founder accepted from the deck, with its page, over the form', () => {
    const deck: AcceptedDeck = {
      settore: { value: 'agritech', page: 3 },
      round: { value: 800_000, page: 7 },
      traction: [{ value: 'MRR 18.000 €', page: 4 }],
    };
    const x = draftExtraction({ ...empty, settore: 'fintech', fase: 'seed' }, deck);
    expect(x.settore).toEqual({ value: 'agritech', fonte: 'deck', page: 3 });
    expect(x.round).toEqual({ value: 800_000, fonte: 'deck', page: 7 });
    expect(x.fase).toEqual({ value: 'seed', fonte: 'modulo' });
    expect(x.regione.fonte).toBe('esempio');
  });

  it('uses an accepted one-liner from the deck over the description', () => {
    const x = draftExtraction({ ...empty, descrizione: 'Dal modulo.' }, { oneLiner: { value: 'Sensori per vigneti.', page: 1 }, traction: [] });
    expect(x.oneLiner).toEqual({ value: 'Sensori per vigneti.', fonte: 'deck', page: 1 });
  });

  it('takes form values when the deck gave nothing for a field', () => {
    const x = draftExtraction({ settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000, descrizione: 'Pagamenti per PMI.' }, null);
    expect(x.settore).toEqual({ value: 'fintech', fonte: 'modulo' });
    expect(x.regione).toEqual({ value: 'lombardia', fonte: 'modulo' });
    expect(x.round).toEqual({ value: 500_000, fonte: 'modulo' });
    expect(x.oneLiner).toEqual({ value: 'Pagamenti per PMI.', fonte: 'modulo' });
  });

  it('ignores invalid form values', () => {
    expect(draftExtraction({ ...empty, settore: 'astrologia' }, null).settore.fonte).toBe('esempio');
    expect(draftExtraction({ ...empty, round: 0 }, null).round.fonte).toBe('esempio');
  });

  it('is deterministic', () => {
    const deck: AcceptedDeck = { fase: { value: 'seed', page: 2 }, traction: [] };
    expect(draftExtraction({ ...empty, descrizione: 'Una frase.' }, deck)).toEqual(draftExtraction({ ...empty, descrizione: 'Una frase.' }, deck));
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
    expect(startupFlowSteps('it', true)[2]).toBe('Cosa abbiamo trovato');
    expect(startupFlowSteps('en', true)[2]).toBe('What we found');
    expect(startupFlowSteps('it', true)).toHaveLength(5);
    expect(startupFlowSteps('it', false)).toHaveLength(4);
    expect(startupFlowSteps('en', false)[1]).toBe('Analysing your details');
    for (const locale of ['it', 'en'] as const) {
      const steps = startupFlowSteps(locale, false);
      expect(steps).toHaveLength(startupFlowSteps(locale, true).length - 1);
      // Only the first step (where the deck can be uploaded) may mention it.
      expect(steps.slice(1).join(' ')).not.toMatch(/deck/i);
    }
  });
});
