import { INTL_LOCALE, type Locale } from './locales';

export interface Formatters {
  /** 62.5 → "62,5%" (it) / "62.5%" (en) */
  percent: (value: number, decimals?: number, minDecimals?: number) => string;
  number: (value: number, decimals?: number) => string;
  /** "500.000 €" (it) / "€500,000" (en) */
  euro: (value: number) => string;
  /** "gen 2027" (it) / "Jan 2027" (en) */
  monthYear: (date: Date) => string;
  /** "15 gennaio 2027" / "15 January 2027" */
  longDate: (date: Date) => string;
  /** "ottobre" / "October" */
  monthName: (date: Date) => string;
}

function make(locale: Locale): Formatters {
  const tag = INTL_LOCALE[locale];
  const cache = new Map<string, Intl.NumberFormat>();
  const nf = (min: number, max: number) => {
    const key = `${min}-${max}`;
    let f = cache.get(key);
    if (!f) {
      f = new Intl.NumberFormat(tag, { minimumFractionDigits: min, maximumFractionDigits: max });
      cache.set(key, f);
    }
    return f;
  };
  const euro = new Intl.NumberFormat(tag, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const monthYear = new Intl.DateTimeFormat(tag, { month: 'short', year: 'numeric' });
  const longDate = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' });
  const monthName = new Intl.DateTimeFormat(tag, { month: 'long' });
  return {
    percent: (value, decimals = 1, minDecimals = decimals) => `${nf(minDecimals, decimals).format(value)}%`,
    number: (value, decimals = 0) => nf(0, decimals).format(value),
    euro: (value) => euro.format(value),
    monthYear: (date) => monthYear.format(date).replace('.', ''),
    longDate: (date) => longDate.format(date),
    monthName: (date) => monthName.format(date),
  };
}

export const FORMATTERS: Record<Locale, Formatters> = { it: make('it'), en: make('en') };
