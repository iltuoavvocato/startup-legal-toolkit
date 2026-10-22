/**
 * Largest-remainder rounding: rounds each value to `decimals` places so that the
 * rounded values sum exactly to `total`. Ties go to the earlier index.
 * Input values are expected to be non-negative and to sum (approximately) to `total`.
 */
export function largestRemainder(values: number[], total = 100, decimals = 1): number[] {
  if (values.length === 0) return [];
  const scale = 10 ** decimals;
  const target = Math.round(total * scale);
  const sum = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (sum <= 0) return values.map(() => 0);
  // Rescale defensively so the inputs sum exactly to the target.
  const scaled = values.map((v) => (Math.max(0, v) / sum) * target);
  const floors = scaled.map((v) => Math.floor(v + 1e-9));
  let remaining = target - floors.reduce((a, b) => a + b, 0);
  const order = scaled
    .map((v, i) => ({ i, rem: v - floors[i]! }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (let k = 0; remaining > 0 && k < order.length; k++, remaining--) {
    floors[order[k]!.i]! += 1;
  }
  return floors.map((v) => v / scale);
}
