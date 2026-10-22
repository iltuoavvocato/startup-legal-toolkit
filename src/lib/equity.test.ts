import { describe, expect, it } from 'vitest';
import { calculateEquity, defaultFounder, defaultWeights, type FactorValues, type Founder } from './equity';

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 10) / 10;

function founder(name: string, values: Partial<FactorValues>): Founder {
  return { name, values: { idea: 0, tempo: 0, capitale: 0, competenze: 0, ruolo: 0, ...values } };
}

describe('calculateEquity', () => {
  it('gives an equal split for equal inputs', () => {
    for (const n of [2, 3, 4, 5]) {
      const founders = Array.from({ length: n }, (_, i) => defaultFounder(i));
      const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: 0 });
      r.founderShares.forEach((s) => expect(s).toBeCloseTo(100 / n, 10));
      expect(sum(r.display)).toBe(100);
    }
  });

  it('displays three equal founders as 33,4 / 33,3 / 33,3', () => {
    const founders = [0, 1, 2].map(defaultFounder);
    const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: 0 });
    expect(r.display).toEqual([33.4, 33.3, 33.3]);
  });

  it('applies the weighted proportional formula', () => {
    const founders = [
      founder('A', { idea: 10, tempo: 100, capitale: 30000, competenze: 6, ruolo: 8 }),
      founder('B', { idea: 0, tempo: 50, capitale: 10000, competenze: 4, ruolo: 2 }),
    ];
    const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: 0 });
    // A: 10*1 + 30*(100/150) + 20*(0.75) + 25*(0.6) + 15*(0.8) = 10 + 20 + 15 + 15 + 12 = 72
    expect(r.founderShares[0]).toBeCloseTo(72, 10);
    expect(r.founderShares[1]).toBeCloseTo(28, 10);
    expect(r.display).toEqual([72, 28]);
  });

  it('excludes a factor with zero total and renormalizes the remaining weights', () => {
    const founders = [
      founder('A', { idea: 8, tempo: 100, capitale: 0, competenze: 5, ruolo: 5 }),
      founder('B', { idea: 2, tempo: 100, capitale: 0, competenze: 5, ruolo: 5 }),
    ];
    const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: 0 });
    expect(r.excludedFactors).toEqual(['capitale']);
    expect(r.effectiveWeights.capitale).toBe(0);
    expect(r.effectiveWeights.idea).toBeCloseTo(12.5, 10); // 10 / 80
    expect(r.effectiveWeights.tempo).toBeCloseTo(37.5, 10); // 30 / 80
    const totalWeight = Object.values(r.effectiveWeights).reduce((a, b) => a + b, 0);
    expect(totalWeight).toBeCloseTo(100, 10);
    // A: 12.5*0.8 + 37.5*0.5 + 31.25*0.5 + 18.75*0.5 = 10 + 43.75 = 53.75
    expect(r.founderShares[0]).toBeCloseTo(53.75, 10);
  });

  it('ignores factors with weight 0', () => {
    const founders = [founder('A', { idea: 10, tempo: 100 }), founder('B', { idea: 0, tempo: 100 })];
    const weights = { ...defaultWeights(), idea: 0 };
    const r = calculateEquity({ founders, weights, poolPercent: 0 });
    expect(r.founderShares).toEqual([50, 50]);
  });

  it('auto-normalizes weights that do not add up to 100', () => {
    const founders = [founder('A', { idea: 3, tempo: 100 }), founder('B', { idea: 1, tempo: 100 })];
    const a = calculateEquity({ founders, weights: { idea: 50, tempo: 50, capitale: 0, competenze: 0, ruolo: 0 }, poolPercent: 0 });
    const b = calculateEquity({ founders, weights: { idea: 1, tempo: 1, capitale: 0, competenze: 0, ruolo: 0 }, poolPercent: 0 });
    expect(a.founderShares[0]).toBeCloseTo(b.founderShares[0]!, 10);
    expect(a.founderShares[0]).toBeCloseTo(62.5, 10);
  });

  it('falls back to an equal split when nothing can be measured', () => {
    const founders = [founder('A', {}), founder('B', {}), founder('C', {})];
    const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: 0 });
    expect(r.fallbackEqual).toBe(true);
    expect(r.display).toEqual([33.4, 33.3, 33.3]);
  });

  it('treats negative or invalid values as zero', () => {
    const founders = [founder('A', { idea: -5, tempo: Number.NaN }), founder('B', { idea: 5, tempo: 100 })];
    const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: 0 });
    expect(r.founderShares[0]).toBe(0);
    expect(r.founderShares[1]).toBeCloseTo(100, 10);
  });

  it('reserves the pool and scales founders proportionally', () => {
    const founders = [founder('A', { tempo: 75 }), founder('B', { tempo: 25 })];
    const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: 10 });
    expect(r.founderShares[0]).toBeCloseTo(67.5, 10);
    expect(r.founderShares[1]).toBeCloseTo(22.5, 10);
    expect(r.display).toEqual([67.5, 22.5, 10]);
  });

  it('caps the pool at 20%', () => {
    const r = calculateEquity({ founders: [defaultFounder(0), defaultFounder(1)], weights: defaultWeights(), poolPercent: 50 });
    expect(r.poolPercent).toBe(20);
    expect(r.display).toEqual([40, 40, 20]);
  });

  it('always displays a total of exactly 100,0%', () => {
    const founders = [
      founder('A', { idea: 7, tempo: 100, capitale: 12345, competenze: 9, ruolo: 3 }),
      founder('B', { idea: 3, tempo: 60, capitale: 777, competenze: 4, ruolo: 7 }),
      founder('C', { idea: 1, tempo: 20, capitale: 0, competenze: 6, ruolo: 2 }),
    ];
    for (const pool of [0, 7, 13.3]) {
      const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: pool });
      expect(sum(r.display)).toBe(100);
    }
  });

  it('breakdown rows add up to the founder share before the pool', () => {
    const founders = [founder('A', { idea: 4, tempo: 80, competenze: 2 }), founder('B', { idea: 6, tempo: 40, competenze: 8 })];
    const r = calculateEquity({ founders, weights: defaultWeights(), poolPercent: 0 });
    r.breakdown.forEach((row, i) => {
      expect(Object.values(row).reduce((a, b) => a + b, 0)).toBeCloseTo(r.founderShares[i]!, 10);
    });
  });
});
