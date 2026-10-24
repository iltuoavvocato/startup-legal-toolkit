import { useCallback, useEffect, useRef, useState } from 'react';
import { extractFromDeck, type DeckFindings } from '../../lib/deckExtract';
import { DeckReadError, readDeckFile, type DeckReadErrorCode } from '../../lib/pdfText';

export type DeckReadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'reading'; page: number; total: number }
  | { status: 'ready'; pages: number; findings: DeckFindings }
  | { status: 'error'; code: DeckReadErrorCode; pages?: number };

/**
 * Reads a picked PDF on the device (pdf.js is loaded on first use) and runs the extraction heuristics.
 * Only the findings are kept, not the deck's text. A newer read or a reset cancels an older one.
 */
export function useDeckReader() {
  const [state, setState] = useState<DeckReadState>({ status: 'idle' });
  const run = useRef(0);

  const read = useCallback(async (file: Blob) => {
    const id = ++run.current;
    setState({ status: 'loading' });
    try {
      const pages = await readDeckFile(file, (page, total) => {
        if (run.current === id) setState({ status: 'reading', page, total });
      });
      if (run.current !== id) return;
      setState({ status: 'ready', pages: pages.length, findings: extractFromDeck(pages) });
    } catch (e) {
      if (run.current !== id) return;
      setState(e instanceof DeckReadError ? { status: 'error', code: e.code, pages: e.pages } : { status: 'error', code: 'unreadable' });
    }
  }, []);

  const reset = useCallback(() => {
    run.current++;
    setState({ status: 'idle' });
  }, []);

  useEffect(
    () => () => {
      run.current++;
    },
    [],
  );

  return { state, read, reset };
}
