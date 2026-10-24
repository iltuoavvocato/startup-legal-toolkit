// Every key the matching demo writes (sessionStorage, this tab only). Listed here as literals so the privacy page and
// the error fallback can clear them without loading the matching code; matchStorage.test.ts checks they stay in sync.
export const MATCH_STORAGE_KEYS = [
  'matchinvstar-inbox',
  'matchinvstar-export',
  'matchinvstar-agent-startup',
  'matchinvstar-agent-investor',
] as const;

type StorageGetter = () => Storage | null | undefined;

const session: StorageGetter = () => window.sessionStorage;
const local: StorageGetter = () => window.localStorage;

/** A storage area, or null when it is disabled or throws on access (Safari private mode, blocked cookies). */
export function storageOf(get: StorageGetter = session): Storage | null {
  try {
    return get() ?? null;
  } catch {
    return null;
  }
}

/** getItem that never throws: null when the key is missing or storage is unavailable. */
export function safeGet(key: string, get: StorageGetter = session): string | null {
  try {
    return storageOf(get)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** setItem (or removeItem when `value` is null) that never throws (storage full or disabled). False if it failed. */
export function safeSet(key: string, value: string | null, get: StorageGetter = session): boolean {
  try {
    const s = storageOf(get);
    if (!s) return false;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes the matching demo's keys (from sessionStorage, and from localStorage in case an older or future version put
 * them there). Never touches anything else, such as the language preference. Returns false if no storage was usable.
 */
export function clearMatchStorage(getters: StorageGetter[] = [session, local]): boolean {
  let ok = false;
  for (const get of getters) {
    const s = storageOf(get);
    if (!s) continue;
    try {
      for (const key of MATCH_STORAGE_KEYS) s.removeItem(key);
      ok = true;
    } catch {
      // A storage that throws on removeItem has nothing we could have written either.
    }
  }
  return ok;
}
