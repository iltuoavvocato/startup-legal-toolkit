import { useCallback, useEffect, useState } from 'react';
import { advance, clockOf, emptyStore, INBOX_STORAGE_KEY, parseStore, serializeStore, type InboxStore } from '../../lib/inbox';

// The requests inbox lives in sessionStorage (this tab only), like the guided intake. Pages and the header badge
// listen to one window event, so a proposal made on one page shows up everywhere without a reload.
const EVENT = 'matchinvstar-inbox';

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reads the stored inbox and applies the simulated answers that arrived by now (demo clock). */
export function readInbox(realNow = Date.now()): InboxStore {
  let raw: string | null = null;
  try {
    raw = storage()?.getItem(INBOX_STORAGE_KEY) ?? null;
  } catch {
    // Storage disabled: start empty.
  }
  const store = parseStore(raw);
  return advance(store, clockOf(store, realNow));
}

function writeInbox(store: InboxStore | null) {
  try {
    if (store) storage()?.setItem(INBOX_STORAGE_KEY, serializeStore(store));
    else storage()?.removeItem(INBOX_STORAGE_KEY);
  } catch {
    // Storage full or disabled: the inbox simply isn't kept across pages.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Updates the inbox with the demo clock's current time and saves it. */
export function updateInbox(fn: (store: InboxStore, now: number) => InboxStore): InboxStore {
  const realNow = Date.now();
  const current = readInbox(realNow);
  const next = fn(current, clockOf(current, realNow));
  const settled = advance(next, clockOf(next, realNow));
  writeInbox(settled);
  return settled;
}

export function resetInbox() {
  writeInbox(null);
}

/** The inbox and the demo clock, kept in sync across components. */
export function useInbox(): { store: InboxStore; now: number } {
  const [snapshot, setSnapshot] = useState(() => {
    const realNow = Date.now();
    const store = typeof window === 'undefined' ? emptyStore() : readInbox(realNow);
    return { store, now: clockOf(store, realNow) };
  });
  const refresh = useCallback(() => {
    const realNow = Date.now();
    const store = readInbox(realNow);
    setSnapshot({ store, now: clockOf(store, realNow) });
  }, []);
  useEffect(() => {
    window.addEventListener(EVENT, refresh);
    return () => window.removeEventListener(EVENT, refresh);
  }, [refresh]);
  return snapshot;
}
