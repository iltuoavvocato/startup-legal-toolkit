import { useEffect, useState } from 'react';
import {
  emptyExportStore,
  EXPORT_STORAGE_KEY,
  investorSheetOf,
  parseExportStore,
  serializeExportStore,
  startupSheetOf,
  type ExportStore,
} from '../../lib/exportDoc';

// The exportable profiles live in sessionStorage (this tab only), like the inbox and the guided intake: whitelisted
// fields only (see exportDoc.ts), never names or deck text. Names reach the export page as router state.
const EVENT = 'matchinvstar-export';

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readExportStore(): ExportStore {
  try {
    return parseExportStore(storage()?.getItem(EXPORT_STORAGE_KEY) ?? null);
  } catch {
    return emptyExportStore();
  }
}

function write(store: ExportStore | null) {
  try {
    if (store) storage()?.setItem(EXPORT_STORAGE_KEY, serializeExportStore(store));
    else storage()?.removeItem(EXPORT_STORAGE_KEY);
  } catch {
    // Storage full or disabled: the export page will show its empty state.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function saveStartupSheet(input: Parameters<typeof startupSheetOf>[0]) {
  const sheet = startupSheetOf(input);
  if (sheet) write({ ...readExportStore(), startup: sheet });
}

export function saveInvestorSheet(input: Parameters<typeof investorSheetOf>[0]) {
  const sheet = investorSheetOf(input);
  if (sheet) write({ ...readExportStore(), investor: sheet });
}

export function resetExportStore() {
  write(null);
}

export function useExportStore(): ExportStore {
  const [store, setStore] = useState(() => (typeof window === 'undefined' ? emptyExportStore() : readExportStore()));
  useEffect(() => {
    const refresh = () => setStore(readExportStore());
    window.addEventListener(EVENT, refresh);
    return () => window.removeEventListener(EVENT, refresh);
  }, []);
  return store;
}
