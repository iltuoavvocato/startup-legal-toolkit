// Italian formatters (default locale). Locale-aware versions live in src/i18n/format.ts.
import { FORMATTERS } from '../i18n/format';

const it = FORMATTERS.it;

/** 62.5 → "62,5%" (Italian format, no space before %, as commonly written in Italy). */
export const formatPercent = it.percent;
export const formatNumber = it.number;
export const formatEuro = it.euro;
/** "gen 2027" */
export const formatMonthYear = it.monthYear;
export const formatLongDate = it.longDate;
