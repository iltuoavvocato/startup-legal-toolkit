import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { describe, expect, it } from 'vitest';
import { extractFromDeck } from './deckExtract';
import { canReadDecks, DeckReadError, extractPages, joinTextItems, MAX_DECK_PAGES, missingPdfFeatures, textChars } from './pdfText';

const load = (path: string) => new Uint8Array(readFileSync(path));

async function blankPdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([960, 540]);
  return doc.save();
}

async function codeOf(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p;
    return undefined;
  } catch (e) {
    return e instanceof DeckReadError ? e.code : `other: ${String(e)}`;
  }
}

describe('joinTextItems', () => {
  it('breaks lines on hasEOL and on a baseline change, adds spaces only at gaps', () => {
    const text = joinTextItems([
      { str: 'Il', transform: [1, 0, 0, 1, 10, 500], width: 10 },
      { str: 'round', transform: [1, 0, 0, 1, 24, 500], width: 30 },
      { str: '800k', transform: [1, 0, 0, 1, 54, 500], width: 20, hasEOL: true },
      { str: 'Bari', transform: [1, 0, 0, 1, 10, 470], width: 20 },
      { str: 'Sede', transform: [1, 0, 0, 1, 10, 440], width: 20 },
    ]);
    expect(text).toBe('Il round800k\nBari\nSede');
  });

  it('skips empty items and trims', () => {
    expect(joinTextItems([{ str: '' }, { str: ' Ciao ', hasEOL: true }, { str: '' }])).toBe('Ciao');
  });

  it('counts non-space characters', () => {
    expect(textChars(['a b', ' c\n'])).toBe(3);
  });
});

describe('extractPages with pdf.js on the fictional sample decks', () => {
  it('reads the Italian sample and finds the expected profile', async () => {
    const progress: number[] = [];
    const pages = await extractPages(pdfjs, load('public/demo/deck-esempio-vignalume.pdf'), (n) => progress.push(n));
    expect(pages).toHaveLength(8);
    expect(progress).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const f = extractFromDeck(pages);
    expect(f.settore?.value).toBe('agritech');
    expect(f.fase?.value).toBe('seed');
    expect(f.round).toMatchObject({ value: 800_000, page: 7 });
    expect(f.regione).toMatchObject({ value: 'puglia', place: 'Bari', page: 8 });
    expect(f.team?.value).toBe(7);
    expect(f.traction.map((t) => t.value.kind)).toEqual(expect.arrayContaining(['mrr', 'customers', 'growth', 'pilots', 'loi']));
  });

  it('reads the English sample and finds the expected profile', async () => {
    const pages = await extractPages(pdfjs, load('public/demo/sample-deck-kelpwise.pdf'));
    const f = extractFromDeck(pages);
    expect(f.settore?.value).toBe('healthtech');
    expect(f.fase?.value).toBe('seed');
    expect(f.round).toMatchObject({ value: 1_200_000, page: 7 });
    expect(f.regione).toMatchObject({ value: 'campania', place: 'Naples' });
    expect(f.team?.value).toBe(12);
    expect(f.traction.map((t) => t.value.kind)).toEqual(expect.arrayContaining(['arr', 'users', 'customers', 'growth', 'pilots', 'loi']));
  });
});

describe('extractPages errors', () => {
  it('image-only / textless decks → noText', async () => {
    expect(await codeOf(extractPages(pdfjs, await blankPdf(3)))).toBe('noText');
  });

  it(`more than ${MAX_DECK_PAGES} pages → tooManyPages`, async () => {
    const err = await extractPages(pdfjs, await blankPdf(MAX_DECK_PAGES + 1)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DeckReadError);
    expect((err as DeckReadError).code).toBe('tooManyPages');
    expect((err as DeckReadError).pages).toBe(MAX_DECK_PAGES + 1);
  });

  it('not a PDF → unreadable', async () => {
    expect(await codeOf(extractPages(pdfjs, new TextEncoder().encode('just some text, not a PDF')))).toBe('unreadable');
  });

  it('password-protected → encrypted', async () => {
    const fake = {
      getDocument: () => ({ promise: Promise.reject(Object.assign(new Error('No password given'), { name: 'PasswordException' })) }),
    } as unknown as Parameters<typeof extractPages>[0];
    expect(await codeOf(extractPages(fake, new Uint8Array([1])))).toBe('encrypted');
  });
});

describe('missingPdfFeatures', () => {
  const full = {
    Promise: { withResolvers: () => null },
    structuredClone: () => null,
    Worker: function Worker() {},
    ReadableStream: { prototype: { getReader: () => null } },
    Array: { prototype: { at: () => null } },
    Blob: { prototype: { arrayBuffer: () => null } },
  };

  it('finds nothing missing in a recent browser', () => {
    expect(missingPdfFeatures(full)).toEqual([]);
  });

  it('names each missing feature (older Safari, no workers, empty env)', () => {
    expect(missingPdfFeatures({ ...full, Promise: {} })).toEqual(['Promise.withResolvers']);
    expect(missingPdfFeatures({ ...full, Worker: undefined, ReadableStream: {} })).toEqual(['Worker', 'ReadableStream']);
    expect(missingPdfFeatures({})).toEqual(['Promise.withResolvers', 'structuredClone', 'Worker', 'ReadableStream', 'Array.prototype.at', 'Blob.arrayBuffer']);
  });

  it('is false without a window (prerender, Node)', () => {
    expect(canReadDecks()).toBe(false);
  });
});
