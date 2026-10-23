import { describe, expect, it } from 'vitest';
import { apply, simulateReply } from '../logic/board';
import { createDeck, decide } from '../logic/deck';
import { deckKey, groupByBucket, isTypingTarget, position, swipeIntensity, tiltFor, undoAllowed, undoLocked } from './swipe';

describe('v4 swipe helpers', () => {
  it('recognises typing targets', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'textarea' })).toBe(true);
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  it('maps keys to deck actions, ignoring modifiers and form fields', () => {
    expect(deckKey({ key: 'ArrowLeft' }, { tagName: 'BODY' })).toBe('pass');
    expect(deckKey({ key: 'ArrowRight' }, { tagName: 'BUTTON' })).toBe('interested');
    expect(deckKey({ key: 'u' }, null)).toBe('undo');
    expect(deckKey({ key: 'Backspace' }, null)).toBe('undo');
    expect(deckKey({ key: 'Enter' }, null)).toBeNull();
    expect(deckKey({ key: 'ArrowLeft', altKey: true }, null)).toBeNull();
    expect(deckKey({ key: 'ArrowLeft', ctrlKey: true }, null)).toBeNull();
    expect(deckKey({ key: 'ArrowRight', metaKey: true }, null)).toBeNull();
    expect(deckKey({ key: 'ArrowRight', shiftKey: true }, null)).toBeNull();
    expect(deckKey({ key: 'ArrowRight', defaultPrevented: true }, null)).toBeNull();
    expect(deckKey({ key: 'ArrowRight' }, { tagName: 'INPUT' })).toBeNull();
    expect(deckKey({ key: 'Backspace' }, { tagName: 'TEXTAREA' })).toBeNull();
  });

  it('tilts proportionally and caps the rotation', () => {
    expect(tiltFor(0)).toBe(0);
    expect(tiltFor(90)).toBe(5);
    expect(tiltFor(-90)).toBe(-5);
    expect(tiltFor(1000)).toBe(12);
    expect(tiltFor(-1000)).toBe(-12);
  });

  it('computes the swipe hint intensity', () => {
    expect(swipeIntensity(0)).toBe(0);
    expect(swipeIntensity(45)).toBe(0.5);
    expect(swipeIntensity(-90)).toBe(1);
    expect(swipeIntensity(300)).toBe(1);
    expect(swipeIntensity(10, 0)).toBe(0);
  });

  it('allows undo only after a pass', () => {
    const d0 = createDeck(['a', 'b', 'c']);
    expect(undoAllowed(d0)).toBe(false);
    expect(undoLocked(d0)).toBe(false);
    const d1 = decide(d0, 'pass');
    expect(undoAllowed(d1)).toBe(true);
    expect(undoLocked(d1)).toBe(false);
    const d2 = decide(d1, 'interested');
    expect(undoAllowed(d2)).toBe(false);
    expect(undoLocked(d2)).toBe(true);
  });

  it('reports the 1-based card position, capped at the end', () => {
    let d = createDeck(['a', 'b']);
    expect(position(d)).toBe(1);
    d = decide(d, 'pass');
    expect(position(d)).toBe(2);
    d = decide(d, 'pass');
    expect(position(d)).toBe(2);
  });

  it('groups by bucket without telling a decline from pending', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    let board = {};
    for (const id of ids.slice(0, 5)) board = apply(board, id, 'INVESTOR_YES');
    board = apply(board, 'f', 'INVESTOR_NO');
    for (const id of ids.slice(0, 5)) board = simulateReply(board, id);
    const g = groupByBucket(board, [...ids, 'g']);
    expect(g.passato).toEqual(['f']);
    expect(g.nuovo).toEqual(['g']);
    // Every replied id is either intro or still "interest sent", never a separate "declined" group.
    expect([...g.intro, ...g.inviato].sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(g.intro.length).toBeGreaterThan(0);
    expect(g.inviato.length).toBeGreaterThan(0);
    expect(Object.keys(g).sort()).toEqual(['intro', 'inviato', 'nuovo', 'passato']);
  });
});
