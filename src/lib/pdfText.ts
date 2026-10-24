// Local PDF text extraction with pdf.js. The library and its worker are bundled with the site and loaded only when
// a founder picks a deck: no CDN, no network, the file never leaves the browser.
import type * as Pdfjs from 'pdfjs-dist';

/** Placeholder limits for the prototype. */
export const MAX_DECK_PAGES = 40;
/** Below this many non-space characters the deck is treated as image-only (scanned or exported as pictures). */
export const MIN_TEXT_CHARS = 60;

export type DeckReadErrorCode = 'encrypted' | 'tooManyPages' | 'noText' | 'unreadable';

export class DeckReadError extends Error {
  readonly code: DeckReadErrorCode;
  readonly pages?: number;
  constructor(code: DeckReadErrorCode, pages?: number) {
    super(code);
    this.name = 'DeckReadError';
    this.code = code;
    this.pages = pages;
  }
}

export interface TextItemLike {
  str: string;
  hasEOL?: boolean;
  /** [a, b, c, d, x, y] */
  transform?: number[];
  width?: number;
}

/**
 * Joins pdf.js text items into lines: a new line when pdf.js says so or the baseline moves, a space when there is a
 * horizontal gap between two items that don't already carry one.
 */
export function joinTextItems(items: readonly TextItemLike[]): string {
  let out = '';
  let lastY: number | null = null;
  let lastEndX: number | null = null;
  for (const it of items) {
    const x = it.transform?.[4];
    const y = it.transform?.[5];
    if (it.str) {
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2 && !out.endsWith('\n')) out += '\n';
      else if (out && !out.endsWith('\n') && !/\s$/.test(out) && !/^\s/.test(it.str) && x !== undefined && lastEndX !== null && x > lastEndX + 0.5)
        out += ' ';
      out += it.str;
      if (y !== undefined) lastY = y;
      if (x !== undefined) lastEndX = x + (it.width ?? 0);
    }
    if (it.hasEOL && !out.endsWith('\n')) out += '\n';
  }
  return out.replace(/[ \t]+\n/g, '\n').trim();
}

/** Non-space characters across all pages. */
export function textChars(pages: readonly string[]): number {
  return pages.reduce((n, p) => n + p.replace(/\s+/g, '').length, 0);
}

type PdfjsLib = Pick<typeof Pdfjs, 'getDocument'>;

/**
 * Reads every page's text with the given pdf.js build (the browser one in the app, the legacy one in Node tests).
 * Throws DeckReadError for encrypted, oversized, unreadable or image-only decks.
 */
export async function extractPages(lib: PdfjsLib, data: Uint8Array, onProgress?: (page: number, total: number) => void): Promise<string[]> {
  let doc: Pdfjs.PDFDocumentProxy;
  try {
    doc = await lib.getDocument({
      data,
      // Nothing may be fetched: no font data, no CMaps, no eval.
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: false,
      stopAtErrors: false,
      verbosity: 0,
    }).promise;
  } catch (e) {
    const name = (e as { name?: string } | null)?.name;
    throw new DeckReadError(name === 'PasswordException' ? 'encrypted' : 'unreadable');
  }
  try {
    const total = doc.numPages;
    if (total > MAX_DECK_PAGES) throw new DeckReadError('tooManyPages', total);
    const pages: string[] = [];
    for (let n = 1; n <= total; n++) {
      onProgress?.(n, total);
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(joinTextItems(content.items.filter((i): i is TextItemLike & typeof i => 'str' in i)));
      page.cleanup();
    }
    if (textChars(pages) < MIN_TEXT_CHARS) throw new DeckReadError('noText', total);
    return pages;
  } catch (e) {
    if (e instanceof DeckReadError) throw e;
    throw new DeckReadError('unreadable');
  } finally {
    void doc.destroy();
  }
}

/**
 * What the bundled pdf.js 4.x needs from the browser and doesn't polyfill (Promise.withResolvers is used throughout;
 * the others by the worker transport and the text layer). Returns the names of the missing features, none when the
 * deck can be read. Older browsers (e.g. Safari before 17.4) get the form without the deck step instead of an error.
 */
export function missingPdfFeatures(env: Record<string, unknown> = globalThis as unknown as Record<string, unknown>): string[] {
  const missing: string[] = [];
  const P = env.Promise as { withResolvers?: unknown } | undefined;
  if (typeof P?.withResolvers !== 'function') missing.push('Promise.withResolvers');
  if (typeof env.structuredClone !== 'function') missing.push('structuredClone');
  if (typeof env.Worker !== 'function') missing.push('Worker');
  const RS = env.ReadableStream as { prototype?: { getReader?: unknown } } | undefined;
  if (typeof RS?.prototype?.getReader !== 'function') missing.push('ReadableStream');
  const A = env.Array as { prototype?: { at?: unknown } } | undefined;
  if (typeof A?.prototype?.at !== 'function') missing.push('Array.prototype.at');
  const B = env.Blob as { prototype?: { arrayBuffer?: unknown } } | undefined;
  if (typeof B?.prototype?.arrayBuffer !== 'function') missing.push('Blob.arrayBuffer');
  return missing;
}

/** True when this browser can read a deck with the bundled pdf.js (false during prerender / without a window). */
export function canReadDecks(): boolean {
  return typeof window !== 'undefined' && missingPdfFeatures().length === 0;
}

let loading: Promise<PdfjsLib> | null = null;

/** Loads pdf.js and its worker (both bundled assets) once, on first use. */
export function loadPdfjs(): Promise<PdfjsLib> {
  loading ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

/** Browser entry point: reads a picked or sample PDF entirely on the device. */
export async function readDeckFile(file: Blob, onProgress?: (page: number, total: number) => void): Promise<string[]> {
  let lib: PdfjsLib;
  try {
    if (!canReadDecks()) throw new Error('unsupported');
    lib = await loadPdfjs();
  } catch {
    throw new DeckReadError('unreadable');
  }
  const data = new Uint8Array(await file.arrayBuffer());
  return extractPages(lib, data, onProgress);
}
