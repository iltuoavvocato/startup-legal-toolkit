import { describe, expect, it } from 'vitest';
import { WEIGHTS } from '../../lib/matching';
import { apply, simulateReply, type Board } from '../logic/board';
import { barPercent, canSimulate, rankNumeral, scoreParts } from './editorial';

describe('v1 editorial helpers', () => {
  it('pads ranks to two digits', () => {
    expect(rankNumeral(1)).toBe('01');
    expect(rankNumeral(12)).toBe('12');
    expect(rankNumeral(-3)).toBe('00');
  });

  it('clamps the score bar', () => {
    expect(barPercent(86)).toBe(86);
    expect(barPercent(140)).toBe(100);
    expect(barPercent(-5)).toBe(0);
    expect(barPercent(Number.NaN)).toBe(0);
  });

  it('lists the score parts in order with their weights', () => {
    const parts = scoreParts({ settore: 30, ticket: 21, fase: 20, area: 14 });
    expect(parts.map((p) => p.key)).toEqual(['settore', 'ticket', 'fase', 'area']);
    expect(parts.map((p) => p.max)).toEqual([WEIGHTS.settore, WEIGHTS.ticket, WEIGHTS.fase, WEIGHTS.area]);
    expect(parts.reduce((s, p) => s + p.max, 0)).toBe(100);
  });

  it('offers the reply simulation only once, after interest, and hides a decline like a pending request', () => {
    const none = new Set<string>();
    let b: Board = {};
    expect(canSimulate(b, 'x', none)).toBe(false);
    b = apply(b, 'x', 'INVESTOR_YES');
    expect(canSimulate(b, 'x', none)).toBe(true);
    expect(canSimulate(b, 'x', new Set(['x']))).toBe(false);
    const declined = apply(b, 'x', 'STARTUP_NO');
    // Same answer as pending: the investor can't tell a decline from silence.
    expect(canSimulate(declined, 'x', none)).toBe(canSimulate(b, 'x', none));
    expect(canSimulate(apply(b, 'x', 'STARTUP_YES'), 'x', none)).toBe(false);
    expect(canSimulate(apply({}, 'y', 'INVESTOR_NO'), 'y', none)).toBe(false);
    expect(simulateReply(b, 'x')).not.toBe(b);
  });
});
