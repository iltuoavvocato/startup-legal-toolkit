export const LOCALES = ['it', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'it';

/** BCP 47 tags used for number, currency and date formatting. English uses British conventions (€500,000 · 62.5%). */
export const INTL_LOCALE: Record<Locale, string> = { it: 'it-IT', en: 'en-GB' };
export const OG_LOCALE: Record<Locale, string> = { it: 'it_IT', en: 'en_GB' };

export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);
