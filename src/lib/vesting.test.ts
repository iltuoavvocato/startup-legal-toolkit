import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VESTING,
  addMonths,
  leaverDisplay,
  leaverOutcome,
  normalizeParams,
  parseISODate,
  toISODate,
  vestedFraction,
  vestedPercent,
  vestingSchedule,
  type VestingParams,
} from './vesting';

const p = (over: Partial<VestingParams> = {}): VestingParams => ({ ...DEFAULT_VESTING, ...over });

describe('vestedFraction', () => {
  it('matches the example: 4 years, 1-year cliff', () => {
    expect(vestedFraction(11, p())).toBe(0);
    expect(vestedFraction(12, p())).toBe(0.25);
    expect(vestedFraction(30, p())).toBe(0.625);
  });

  it('vests nothing at month 0 (leaver at month 0)', () => {
    expect(vestedFraction(0, p())).toBe(0);
    expect(leaverOutcome(0, p()).vestedPercent).toBe(0);
    expect(leaverOutcome(0, p()).unvestedPercent).toBe(25);
  });

  it('applies the cliff catch-up exactly at the boundary', () => {
    expect(vestedFraction(11.99, p())).toBe(0);
    expect(vestedFraction(12, p())).toBe(12 / 48);
    expect(vestedFraction(13, p())).toBe(13 / 48);
  });

  it('vests monthly from month 1 with cliff 0', () => {
    const q = p({ cliffMonths: 0 });
    expect(vestedFraction(0, q)).toBe(0);
    expect(vestedFraction(1, q)).toBe(1 / 48);
    expect(vestedFraction(5, q)).toBe(5 / 48);
  });

  it('vests only at quarter boundaries with quarterly frequency', () => {
    const q = p({ frequency: 'trimestrale' });
    expect(vestedFraction(12, q)).toBe(12 / 48);
    expect(vestedFraction(14, q)).toBe(12 / 48);
    expect(vestedFraction(15, q)).toBe(15 / 48);
    const noCliff = p({ frequency: 'trimestrale', cliffMonths: 0 });
    expect(vestedFraction(2, noCliff)).toBe(0);
    expect(vestedFraction(3, noCliff)).toBe(3 / 48);
  });

  it('respects a cliff that is not a multiple of the period', () => {
    const q = p({ frequency: 'trimestrale', cliffMonths: 5 });
    expect(vestedFraction(4, q)).toBe(0);
    expect(vestedFraction(5, q)).toBe(3 / 48);
    expect(vestedFraction(6, q)).toBe(6 / 48);
  });

  it('vests only at year boundaries with annual frequency', () => {
    const q = p({ frequency: 'annuale' });
    expect(vestedFraction(12, q)).toBe(0.25);
    expect(vestedFraction(23, q)).toBe(0.25);
    expect(vestedFraction(24, q)).toBe(0.5);
    expect(vestedFraction(47, q)).toBe(0.75);
    expect(vestedFraction(48, q)).toBe(1);
  });

  it('is fully vested at the duration and beyond', () => {
    for (const frequency of ['mensile', 'trimestrale', 'annuale'] as const) {
      expect(vestedFraction(48, p({ frequency }))).toBe(1);
      expect(vestedFraction(100, p({ frequency }))).toBe(1);
    }
    // Duration not a multiple of the period: still full at the duration.
    expect(vestedFraction(29, p({ durationMonths: 30, frequency: 'annuale' }))).toBe(24 / 30);
    expect(vestedFraction(30, p({ durationMonths: 30, frequency: 'annuale' }))).toBe(1);
  });

  it('handles cliff equal to duration (all at once)', () => {
    const q = p({ cliffMonths: 48 });
    expect(vestedFraction(47, q)).toBe(0);
    expect(vestedFraction(48, q)).toBe(1);
  });

  it('never decreases over time', () => {
    for (const frequency of ['mensile', 'trimestrale', 'annuale'] as const) {
      const s = vestingSchedule(p({ frequency, cliffMonths: 7, durationMonths: 37 }));
      for (let i = 1; i < s.length; i++) expect(s[i]!.fraction).toBeGreaterThanOrEqual(s[i - 1]!.fraction);
      expect(s.at(-1)!.fraction).toBe(1);
    }
  });
});

describe('vestedPercent and schedule', () => {
  it('scales by the founder stake', () => {
    expect(vestedPercent(30, p())).toBe(15.625);
    expect(vestedPercent(48, p({ totalPercent: 40 }))).toBe(40);
  });

  it('builds one point per month including the duration', () => {
    const s = vestingSchedule(p({ durationMonths: 24, cliffMonths: 6 }));
    expect(s).toHaveLength(25);
    expect(s[0]).toEqual({ month: 0, fraction: 0, percent: 0 });
    expect(s[24]!.percent).toBe(25);
  });
});

describe('leaverDisplay', () => {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  it('makes rounded vested + unvested equal the displayed total', () => {
    // 25% stake, exit at month 18: exact 9.375 / 15.625 would display as 9,38 + 15,63 = 25,01.
    const d = leaverDisplay(18, p());
    expect(d.total).toBe(25);
    expect(round2(d.vested + d.unvested)).toBe(25);
    expect(d.vested).toBe(9.38);
    expect(d.unvested).toBe(15.62);
    expect(d.vestedOfPackage + d.unvestedOfPackage).toBe(100);
  });

  it('always adds up for every month, stake and frequency', () => {
    for (const totalPercent of [1, 7, 12.5, 25, 33, 100]) {
      for (const frequency of ['mensile', 'trimestrale', 'annuale'] as const) {
        const params = p({ totalPercent, frequency, durationMonths: 37, cliffMonths: 5 });
        for (let m = 0; m <= 40; m++) {
          const d = leaverDisplay(m, params);
          expect(round2(d.vested + d.unvested)).toBe(d.total);
          expect(Math.round((d.vestedOfPackage + d.unvestedOfPackage) * 10) / 10).toBe(100);
        }
      }
    }
  });

  it('handles the boundaries', () => {
    expect(leaverDisplay(0, p())).toMatchObject({ vested: 0, unvested: 25, vestedOfPackage: 0, unvestedOfPackage: 100 });
    expect(leaverDisplay(48, p())).toMatchObject({ vested: 25, unvested: 0, vestedOfPackage: 100, unvestedOfPackage: 0 });
  });
});

describe('normalizeParams', () => {
  it('clamps cliff to the duration and keeps values in range', () => {
    expect(normalizeParams(p({ cliffMonths: 60 })).cliffMonths).toBe(48);
    expect(normalizeParams(p({ cliffMonths: -3 })).cliffMonths).toBe(0);
    expect(normalizeParams(p({ durationMonths: 0 })).durationMonths).toBe(1);
    expect(normalizeParams(p({ totalPercent: 150 })).totalPercent).toBe(100);
  });
});

describe('dates', () => {
  it('adds months clamping to the end of month', () => {
    expect(toISODate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(toISODate(addMonths(new Date(2027, 10, 15), 2))).toBe('2028-01-15');
  });

  it('parses ISO dates strictly', () => {
    expect(toISODate(parseISODate('2026-10-23')!)).toBe('2026-10-23');
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('nope')).toBeNull();
  });
});
