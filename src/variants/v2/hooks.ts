// V2 Dashboard: keyboard hooks (roving row focus, "/" to search).
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { clampIndex, isTypingTarget } from './dash';

/** Roving tabindex over table rows: one row is tabbable, j/k and arrows move between rows. */
export function useRovingRows(count: number) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLTableRowElement | null)[]>([]);
  const idx = count ? Math.min(active, count - 1) : 0;
  const focusRow = useCallback((i: number) => {
    setActive(i);
    refs.current[i]?.focus();
  }, []);
  const countRef = useRef(count);
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  /** After an action that may remove the row: focus the row now at index i (clamped), on the next frame. */
  const refocus = useCallback(
    (i: number) => {
      requestAnimationFrame(() => {
        if (!countRef.current) return;
        focusRow(clampIndex(i, countRef.current));
      });
    },
    [focusRow],
  );
  const refFor = useCallback(
    (i: number) => (el: HTMLTableRowElement | null) => {
      refs.current[i] = el;
    },
    [],
  );
  return { idx, setActive, focusRow, refocus, refFor };
}

/** "/" anywhere outside a text field focuses the given input. */
export function useSlashFocus(ref: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      e.preventDefault();
      ref.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ref]);
}
