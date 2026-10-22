import { largestRemainder } from './rounding';

export type FactorId = 'idea' | 'tempo' | 'capitale' | 'competenze' | 'ruolo';
export type FactorKind = 'score' | 'percent' | 'euro';

export interface Factor {
  id: FactorId;
  label: string;
  hint: string;
  kind: FactorKind;
  defaultWeight: number;
  /** Default value for a new founder. */
  defaultValue: number;
  max: number;
}

export const FACTORS: readonly Factor[] = [
  {
    id: 'idea',
    label: 'Idea e visione',
    hint: 'Chi ha portato l’idea e la direzione del progetto (0–10).',
    kind: 'score',
    defaultWeight: 10,
    defaultValue: 5,
    max: 10,
  },
  {
    id: 'tempo',
    label: 'Tempo e impegno',
    hint: 'Percentuale di un tempo pieno dedicata al progetto (100% = full-time).',
    kind: 'percent',
    defaultWeight: 30,
    defaultValue: 100,
    max: 100,
  },
  {
    id: 'capitale',
    label: 'Capitale investito',
    hint: 'Denaro messo (o che verrà messo) nella società, in euro.',
    kind: 'euro',
    defaultWeight: 20,
    defaultValue: 0,
    max: 10_000_000,
  },
  {
    id: 'competenze',
    label: 'Competenze chiave',
    hint: 'Quanto sono decisive le competenze che porta (0–10).',
    kind: 'score',
    defaultWeight: 25,
    defaultValue: 5,
    max: 10,
  },
  {
    id: 'ruolo',
    label: 'Ruolo e responsabilità',
    hint: 'Peso del ruolo operativo e delle responsabilità assunte (0–10).',
    kind: 'score',
    defaultWeight: 15,
    defaultValue: 5,
    max: 10,
  },
] as const;

export const FACTOR_IDS: readonly FactorId[] = FACTORS.map((f) => f.id);

export type FactorValues = Record<FactorId, number>;

export interface Founder {
  name: string;
  values: FactorValues;
}

export interface EquityInput {
  founders: Founder[];
  weights: FactorValues;
  /** Pool/ESOP reserve in percent of the company, 0–20. */
  poolPercent: number;
}

export interface EquityResult {
  /** Normalized weights in percent (sum 100) over the factors that count; 0 for excluded ones. */
  effectiveWeights: FactorValues;
  /** Factors excluded because every founder scored 0 on them. */
  excludedFactors: FactorId[];
  /** True if no factor could be used (all weights or all values zero): equal split is returned. */
  fallbackEqual: boolean;
  /** Exact founder shares of the whole company (percent, before display rounding), pool already deducted. */
  founderShares: number[];
  /** Per founder, per factor contribution in percent of the founders' total (before pool). */
  breakdown: FactorValues[];
  poolPercent: number;
  /** Rounded to one decimal with largest remainder; founders first, then pool if > 0. Sums to exactly 100. */
  display: number[];
}

export const MIN_FOUNDERS = 2;
export const MAX_FOUNDERS = 5;
export const MAX_POOL = 20;

export function defaultWeights(): FactorValues {
  return Object.fromEntries(FACTORS.map((f) => [f.id, f.defaultWeight])) as FactorValues;
}

export function defaultFounder(index: number): Founder {
  return {
    name: `Founder ${index + 1}`,
    values: Object.fromEntries(FACTORS.map((f) => [f.id, f.defaultValue])) as FactorValues,
  };
}

const clean = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

function zeroValues(): FactorValues {
  return { idea: 0, tempo: 0, capitale: 0, competenze: 0, ruolo: 0 };
}

/**
 * quota_i = Σ_f peso_f × (punteggio_i,f / Σ_j punteggio_j,f), with weights normalized to 100%
 * over the factors whose total is > 0.
 */
export function calculateEquity(input: EquityInput): EquityResult {
  const n = input.founders.length;
  const pool = Math.min(MAX_POOL, clean(input.poolPercent));
  const excludedFactors: FactorId[] = [];
  const totals = zeroValues();

  for (const id of FACTOR_IDS) {
    totals[id] = input.founders.reduce((s, f) => s + clean(f.values[id]), 0);
    if (totals[id] === 0) excludedFactors.push(id);
  }

  const usable = FACTOR_IDS.filter((id) => totals[id] > 0 && clean(input.weights[id]) > 0);
  const weightSum = usable.reduce((s, id) => s + clean(input.weights[id]), 0);
  const effectiveWeights = zeroValues();
  for (const id of usable) effectiveWeights[id] = (clean(input.weights[id]) / weightSum) * 100;

  const fallbackEqual = n > 0 && usable.length === 0;
  const breakdown = input.founders.map((f) => {
    const row = zeroValues();
    for (const id of usable) row[id] = effectiveWeights[id] * (clean(f.values[id]) / totals[id]);
    return row;
  });

  const raw = fallbackEqual
    ? input.founders.map(() => 100 / n)
    : breakdown.map((row) => FACTOR_IDS.reduce((s, id) => s + row[id], 0));

  const founderShares = raw.map((v) => (v * (100 - pool)) / 100);
  const display = n === 0 ? [] : largestRemainder(pool > 0 ? [...founderShares, pool] : founderShares, 100, 1);

  return { effectiveWeights, excludedFactors, fallbackEqual, founderShares, breakdown, poolPercent: pool, display };
}
