import { describe, expect, it } from 'vitest';
import { isoDate, monthKey, pad2 } from './dates';

describe('dates', () => {
  it('pads to two digits', () => {
    expect([0, 1, 9, 12, 123, -3, 4.7].map(pad2)).toEqual(['00', '01', '09', '12', '123', '00', '04']);
  });

  it('formats months and days in local time', () => {
    expect(monthKey(new Date(2026, 0, 31, 23, 59))).toBe('2026-01');
    expect(isoDate(new Date(2026, 9, 4))).toBe('2026-10-04');
    expect(isoDate(new Date(2027, 11, 31, 23, 59))).toBe('2027-12-31');
  });
});
