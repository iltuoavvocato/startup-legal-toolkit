// The only thing this site stores: the language chosen with the switcher (localStorage key "lang").
import { isLocale, type Locale } from './locales';

export const LANG_KEY = 'lang';

export function readStoredLocale(): Locale | null {
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LANG_KEY, locale);
  } catch {
    // Storage unavailable (private mode, disabled): the switcher still works, nothing is remembered.
  }
}

/**
 * The stored preference is consulted only on the first load of the Italian home ("/"):
 * if the user previously chose English with the switcher, they go to "/en/". Any other URL always wins.
 */
export function initialRedirect(pathname: string, stored: Locale | null): string | null {
  return pathname === '/' && stored === 'en' ? '/en/' : null;
}
