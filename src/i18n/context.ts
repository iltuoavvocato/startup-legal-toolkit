import { createContext, useContext } from 'react';
import { FORMATTERS, type Formatters } from './format';
import { DEFAULT_LOCALE, type Locale } from './locales';
import { MESSAGES, type Messages } from './messages';
import { pathFor, type RouteId } from './routes';

export interface I18n {
  locale: Locale;
  t: Messages;
  f: Formatters;
  /** Localised path of a page. */
  path: (id: RouteId) => string;
}

export function makeI18n(locale: Locale): I18n {
  return { locale, t: MESSAGES[locale], f: FORMATTERS[locale], path: (id) => pathFor(id, locale) };
}

export const I18nContext = createContext<I18n>(makeI18n(DEFAULT_LOCALE));

export function useI18n(): I18n {
  return useContext(I18nContext);
}
