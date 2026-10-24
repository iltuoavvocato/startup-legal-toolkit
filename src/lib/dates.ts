// Small date and numbering helpers shared by the tools (local time, no locale).

/** Two-digit numbering: 1 → "01", 12 → "12"; negatives become "00", decimals are truncated. */
export const pad2 = (n: number): string => String(Math.max(0, Math.trunc(n))).padStart(2, '0');

/** 'YYYY-MM' for a date (local time). */
export const monthKey = (date: Date): string => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

/** 'YYYY-MM-DD' for a date (local time). */
export const isoDate = (date: Date): string => `${monthKey(date)}-${pad2(date.getDate())}`;
