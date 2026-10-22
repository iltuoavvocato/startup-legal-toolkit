import { describe, expect, it } from 'vitest';
import { largestRemainder } from './rounding';

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 10) / 10;

describe('largestRemainder', () => {
  it('splits thirds so they sum to exactly 100', () => {
    const r = largestRemainder([100 / 3, 100 / 3, 100 / 3]);
    expect(r).toEqual([33.4, 33.3, 33.3]);
    expect(sum(r)).toBe(100);
  });

  it('keeps exact values untouched', () => {
    expect(largestRemainder([50, 25, 25])).toEqual([50, 25, 25]);
  });

  it('gives the extra unit to the largest remainder', () => {
    expect(largestRemainder([14.28, 14.29, 71.43])).toEqual([14.3, 14.3, 71.4]);
  });

  it('works for sevenths and other awkward splits', () => {
    for (const n of [3, 6, 7, 9, 11]) {
      const r = largestRemainder(Array.from({ length: n }, () => 100 / n));
      expect(sum(r)).toBe(100);
    }
  });

  it('handles empty and zero inputs', () => {
    expect(largestRemainder([])).toEqual([]);
    expect(largestRemainder([0, 0])).toEqual([0, 0]);
  });
});
