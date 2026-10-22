import { useEffect, useRef } from 'react';

/** Reads the current query string (used once, to seed the initial state). */
export function readQuery(): URLSearchParams {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
}

/**
 * Mirrors state into the URL query string (replaceState, no history entries) so results are shareable.
 * The first render is skipped, so untouched pages keep a clean URL. Nothing is stored anywhere else.
 */
export function useSyncQuery(params: Record<string, string> | null) {
  const serialized = params ? new URLSearchParams(params).toString() : '';
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const url = `${window.location.pathname}${serialized ? `?${serialized}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', url);
  }, [serialized]);
}
