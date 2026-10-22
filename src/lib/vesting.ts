import { largestRemainder } from './rounding';

export type Frequency = 'mensile' | 'trimestrale' | 'annuale';

export const FREQUENCY_MONTHS: Record<Frequency, number> = {
  mensile: 1,
  trimestrale: 3,
  annuale: 12,
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  mensile: 'Mensile',
  trimestrale: 'Trimestrale',
  annuale: 'Annuale',
};

export interface VestingParams {
  /** Founder's total stake, in percent of the company. */
  totalPercent: number;
  durationMonths: number;
  cliffMonths: number;
  frequency: Frequency;
}

export const DEFAULT_VESTING: VestingParams = {
  totalPercent: 25,
  durationMonths: 48,
  cliffMonths: 12,
  frequency: 'mensile',
};

export const MAX_DURATION = 120;

/** Clamps params to a valid range: duration 1–120, cliff 0–duration, stake 0–100. */
export function normalizeParams(p: VestingParams): VestingParams {
  const durationMonths = Math.min(MAX_DURATION, Math.max(1, Math.round(p.durationMonths) || 1));
  const cliffMonths = Math.min(durationMonths, Math.max(0, Math.round(p.cliffMonths) || 0));
  const totalPercent = Math.min(100, Math.max(0, Number.isFinite(p.totalPercent) ? p.totalPercent : 0));
  const frequency = p.frequency in FREQUENCY_MONTHS ? p.frequency : 'mensile';
  return { totalPercent, durationMonths, cliffMonths, frequency };
}

/**
 * Share of the package vested after `month` full months (0–1).
 * - before the cliff nothing vests;
 * - at the cliff everything accrued so far vests at once (cliff catch-up);
 * - afterwards vesting happens only at period boundaries (multiples of 1/3/12 months from the start);
 * - at or after the duration the package is fully vested.
 */
export function vestedFraction(month: number, params: VestingParams): number {
  const p = normalizeParams(params);
  const m = Math.floor(Math.max(0, month));
  if (m >= p.durationMonths) return 1;
  if (m < p.cliffMonths) return 0;
  const period = FREQUENCY_MONTHS[p.frequency];
  const vestedMonths = Math.floor(m / period) * period;
  return Math.min(1, vestedMonths / p.durationMonths);
}

/** Vested stake in percent of the company. */
export function vestedPercent(month: number, params: VestingParams): number {
  return normalizeParams(params).totalPercent * vestedFraction(month, params);
}

export interface SchedulePoint {
  month: number;
  fraction: number;
  percent: number;
}

/** One point per month from 0 to the duration (inclusive). */
export function vestingSchedule(params: VestingParams): SchedulePoint[] {
  const p = normalizeParams(params);
  return Array.from({ length: p.durationMonths + 1 }, (_, month) => ({
    month,
    fraction: vestedFraction(month, p),
    percent: vestedPercent(month, p),
  }));
}

export interface LeaverOutcome {
  month: number;
  vestedFraction: number;
  vestedPercent: number;
  unvestedPercent: number;
}

export function leaverOutcome(month: number, params: VestingParams): LeaverOutcome {
  const p = normalizeParams(params);
  const fraction = vestedFraction(month, p);
  const vested = p.totalPercent * fraction;
  return { month: Math.floor(Math.max(0, month)), vestedFraction: fraction, vestedPercent: vested, unvestedPercent: p.totalPercent - vested };
}

export interface LeaverDisplay {
  /** Founder's stake rounded to `decimals`. */
  total: number;
  vested: number;
  unvested: number;
  /** Share of the package, one decimal; always sums to 100. */
  vestedOfPackage: number;
  unvestedOfPackage: number;
}

/**
 * Rounded figures for display: vested + unvested always equal the displayed total
 * (largest-remainder rounding), and the package shares always add up to 100.
 */
export function leaverDisplay(month: number, params: VestingParams, decimals = 2): LeaverDisplay {
  const p = normalizeParams(params);
  const o = leaverOutcome(month, p);
  const scale = 10 ** decimals;
  const total = Math.round(p.totalPercent * scale) / scale;
  const [vested = 0, unvested = 0] =
    total > 0 ? largestRemainder([o.vestedPercent, o.unvestedPercent], total, decimals) : [0, 0];
  const [vestedOfPackage = 0, unvestedOfPackage = 0] = largestRemainder(
    [o.vestedFraction * 100, (1 - o.vestedFraction) * 100],
    100,
    1,
  );
  return { total, vested, unvested, vestedOfPackage, unvestedOfPackage };
}

/** Adds calendar months, clamping the day to the end of the target month (31 gen + 1 → 28/29 feb). */
export function addMonths(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth() + months;
  const target = new Date(y, m, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** Parses a yyyy-mm-dd string as a local date; returns null when invalid. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return date.getMonth() === Number(mo) - 1 && date.getDate() === Number(d) ? date : null;
}

export function toISODate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
