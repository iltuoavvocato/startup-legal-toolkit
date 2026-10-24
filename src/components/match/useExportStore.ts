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
import { safeGet, safeSet } from '../../lib/matchStorage';

// The exportable profiles live in sessionStorage (this tab only), like the inbox and the guided intake: whitelisted
// fields only (see exportDoc.ts), never names or deck text. Names reach the export page as router state.
const EVENT = 'matchinvstar-export';

export function readExportStore(): ExportStore {
  return parseExportStore(safeGet(EXPORT_STORAGE_KEY));
}

function write(store: ExportStore | null) {
  // Storage full or disabled: the export page will show its empty state.
  safeSet(EXPORT_STORAGE_KEY, store ? serializeExportStore(store) : null);
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
