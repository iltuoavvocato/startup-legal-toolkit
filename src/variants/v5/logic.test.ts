import { describe, expect, it } from 'vitest';
import { WEIGHTS } from '../../lib/matching';
import { nextIndex, pad2, partBars, usedPct } from './logic';

describe('v5 partBars', () => {
  it('keeps the engine order and maxima', () => {
    const bars = partBars({ settore: 30, ticket: 15, fase: 12, area: 8 });
    expect(bars.map((b) => b.key)).toEqual(['settore', 'ticket', 'fase', 'area']);
    expect(bars.map((b) => b.max)).toEqual([WEIGHTS.settore, WEIGHTS.ticket, WEIGHTS.fase, WEIGHTS.area]);
    expect(bars.map((b) => b.pct)).toEqual([100, 50, 60, 40]);
  });
  it('rounds and clamps values', () => {
    const [settore, ticket] = partBars({ settore: 31, ticket: 12.6, fase: -1, area: 0 });
    expect(settore).toMatchObject({ value: 30, pct: 100 });
    expect(ticket).toMatchObject({ value: 13, pct: 43 });
    expect(partBars({ settore: 0, ticket: 0, fase: -1, area: 0 })[2]).toMatchObject({ value: 0, pct: 0 });
  });
});

describe('v5 nextIndex', () => {
  it('moves with arrows and clamps at the ends', () => {
    expect(nextIndex('ArrowDown', 0, 3)).toBe(1);
    expect(nextIndex('ArrowDown', 2, 3)).toBe(2);
    expect(nextIndex('ArrowUp', 0, 3)).toBe(0);
    expect(nextIndex('ArrowUp', 2, 3)).toBe(1);
  });
  it('handles Home/End, ignores other keys and empty lists', () => {
    expect(nextIndex('Home', 2, 3)).toBe(0);
    expect(nextIndex('End', 0, 3)).toBe(2);
    expect(nextIndex('Enter', 0, 3)).toBeNull();
    expect(nextIndex('ArrowDown', 0, 0)).toBeNull();
    expect(nextIndex('ArrowDown', 9, 3)).toBe(2);
  });
});

describe('v5 pad2 and usedPct', () => {
  it('pads to two digits', () => {
    expect(pad2(1)).toBe('01');
    expect(pad2(12)).toBe('12');
    expect(pad2(-3)).toBe('00');
  });
  it('bounds the bar width', () => {
    expect(usedPct(2, 5)).toBe(40);
    expect(usedPct(7, 5)).toBe(100);
    expect(usedPct(1, 0)).toBe(0);
  });
});
