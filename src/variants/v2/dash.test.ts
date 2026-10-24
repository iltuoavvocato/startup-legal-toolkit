import { describe, expect, it } from 'vitest';
import { apply, simulateReply, type Board } from '../logic/board';
import {
  ariaSort,
  avgScore,
  bandTally,
  clampIndex,
  inTab,
  isTypingTarget,
  parseAmount,
  partPoints,
  rowShortcut,
  stackedSegments,
  topScore,
} from './dash';

const rows = (...scores: number[]) => scores.map((score) => ({ evaluation: { score } }));

describe('v2 dashboard helpers', () => {
  it('computes average and top scores, 0 for empty lists', () => {
    expect(avgScore(rows(80, 61, 70))).toBe(70);
    expect(avgScore(rows(81, 82))).toBe(82);
    expect(avgScore([])).toBe(0);
    expect(topScore(rows(40, 92, 60))).toBe(92);
    expect(topScore([])).toBe(0);
  });

  it('tallies score bands with the engine thresholds', () => {
    expect(bandTally(rows(95, 80, 79, 60, 59, 0))).toEqual({
      'molto-affine': 2,
      affine: 2,
      'da-valutare': 2,
    });
  });

  it('builds stacked segments that add up to the score', () => {
    const segs = stackedSegments({
      settore: 30,
      ticket: 22.5,
      fase: 12,
      area: 8,
    });
    expect(segs.map((s) => s.key)).toEqual(['settore', 'ticket', 'fase', 'area']);
    expect(segs.reduce((s, x) => s + x.width, 0)).toBeCloseTo(72.5);
    expect(partPoints({ settore: 30, ticket: 22.456, fase: 12, area: 8 }, 'ticket')).toEqual({ pts: 22.5, max: 30 });
  });

  it('maps row shortcuts', () => {
    expect(rowShortcut('Enter')).toBe('toggle');
    expect(rowShortcut(' ')).toBe('toggle');
    expect(rowShortcut('i')).toBe('interested');
    expect(rowShortcut('P')).toBe('pass');
    expect(rowShortcut('x')).toBeNull();
  });

  it('recognises text fields so global keys are not hijacked', () => {
    expect(isTypingTarget({ tagName: 'INPUT', type: 'search' })).toBe(true);
    expect(isTypingTarget({ tagName: 'input' })).toBe(true);
    expect(isTypingTarget({ tagName: 'INPUT', type: 'checkbox' })).toBe(false);
    expect(isTypingTarget({ tagName: 'INPUT', type: 'range' })).toBe(false);
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  it('filters by bucket tab without telling a decline from a pending interest', () => {
    let b: Board = {};
    b = apply(b, 'a', 'INVESTOR_YES');
    b = apply(b, 'b', 'INVESTOR_YES');
    b = apply(b, 'b', 'STARTUP_NO');
    b = apply(b, 'c', 'INVESTOR_NO');
    expect(inTab(b, 'a', 'inviato')).toBe(true);
    expect(inTab(b, 'b', 'inviato')).toBe(true);
    expect(inTab(b, 'c', 'passato')).toBe(true);
    expect(inTab(b, 'd', 'nuovo')).toBe(true);
    expect(inTab(b, 'd', 'all')).toBe(true);
    expect(inTab(simulateReply(apply({}, 'x', 'INVESTOR_YES'), 'x'), 'x', 'nuovo')).toBe(false);
  });

  it('returns aria-sort only for the active column', () => {
    expect(ariaSort({ key: 'score', dir: 'desc' }, 'score')).toBe('descending');
    expect(ariaSort({ key: 'nome', dir: 'asc' }, 'nome')).toBe('ascending');
    expect(ariaSort({ key: 'score', dir: 'desc' }, 'nome')).toBeUndefined();
  });

  it('parses typed euro amounts', () => {
    expect(parseAmount('500.000')).toBe(500000);
    expect(parseAmount('€ 1,000,000')).toBe(1000000);
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('99999999999')).toBeNull();
  });

  it('clamps a row index to the list', () => {
    expect(clampIndex(5, 3)).toBe(2);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(4, 0)).toBe(0);
  });
});
