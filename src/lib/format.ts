const cache = new Map<string, Intl.NumberFormat>();

function nf(min: number, max: number): Intl.NumberFormat {
  const key = `${min}-${max}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('it-IT', { minimumFractionDigits: min, maximumFractionDigits: max });
    cache.set(key, f);
  }
  return f;
}

/** 62.5 → "62,5%" (Italian format, no space before %, as commonly written in Italy). */
export function formatPercent(value: number, decimals = 1, minDecimals = decimals): string {
  return `${nf(minDecimals, decimals).format(value)}%`;
}

export function formatNumber(value: number, decimals = 0): string {
  return nf(0, decimals).format(value);
}

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export function formatEuro(value: number): string {
  return euro.format(value);
}

const monthYear = new Intl.DateTimeFormat('it-IT', { month: 'short', year: 'numeric' });
/** "gen 2027" */
export function formatMonthYear(date: Date): string {
  return monthYear.format(date).replace('.', '');
}

const longDate = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
export function formatLongDate(date: Date): string {
  return longDate.format(date);
}
