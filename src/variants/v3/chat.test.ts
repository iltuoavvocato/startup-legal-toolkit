import { describe, expect, it } from 'vitest';
import { demoReply, stateOf } from '../logic/board';
import { chipsFor, currentId, initChat, isFinished, reduce, type AgentBody, type ChatState, type Chip } from './chat';

const FOUNDER_IDS = ['i1', 'i2', 'i3'];
// demoReply is deterministic: s01 declines, s08 accepts.
const INVESTOR_IDS = ['s01', 's08'];

const founder = (ids = FOUNDER_IDS, excludedCount = 2, limit = 5) =>
  initChat({ mode: 'founder', ids, excludedCount, month: '2026-10', limit });
const investor = (ids = INVESTOR_IDS) => initChat({ mode: 'investor', ids, excludedCount: 3, month: '2026-10' });

const run = (s: ChatState, ...chips: Chip[]) => chips.reduce(reduce, s);
const bodies = (s: ChatState): AgentBody[] => s.messages.flatMap((m) => (m.from === 'agent' ? [m.body] : []));
const lastBody = (s: ChatState) => bodies(s).at(-1);

describe('v3 chat: founder', () => {
  it('opens with greeting, criteria and the first match card, deterministically', () => {
    const s = founder();
    expect(bodies(s)).toEqual([{ kind: 'greet' }, { kind: 'criteria' }, { kind: 'match', index: 0 }]);
    expect(s.messages.every((m) => m.from === 'agent')).toBe(true);
    expect(chipsFor(s)).toEqual(['why', 'propose', 'next', 'excluded', 'restart']);
    expect(founder()).toEqual(s);
  });

  it('with no matches it goes straight to the end message', () => {
    const s = founder([], 4);
    expect(lastBody(s)).toEqual({ kind: 'end', proposed: 0, left: 5 });
    expect(isFinished(s)).toBe(true);
    expect(chipsFor(s)).toEqual(['excluded', 'restart']);
  });

  it('records the user chip, then the agent answer, with increasing ids', () => {
    const s = run(founder(), 'why');
    const tail = s.messages.slice(-2);
    expect(tail[0]).toMatchObject({ from: 'user', chip: 'why' });
    expect(tail[1]).toMatchObject({ from: 'agent', body: { kind: 'why', index: 0 } });
    const ids = s.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort((a, b) => a - b)).toEqual(ids);
  });

  it('hides "why" once answered for the current match and offers it again on the next one', () => {
    let s = run(founder(), 'why');
    expect(chipsFor(s)).not.toContain('why');
    s = run(s, 'next');
    expect(chipsFor(s)).toContain('why');
    expect(lastBody(s)).toEqual({ kind: 'match', index: 1 });
    expect(currentId(s)).toBe('i2');
  });

  it('proposes within the monthly limit with a neutral confirmation and a decreasing counter', () => {
    let s = run(founder(), 'propose');
    expect(lastBody(s)).toEqual({ kind: 'proposed', index: 0, left: 4 });
    expect(s.proposals.sent).toEqual(['i1']);
    expect(chipsFor(s)).not.toContain('propose');
    s = run(s, 'next', 'propose');
    expect(lastBody(s)).toEqual({ kind: 'proposed', index: 1, left: 3 });
  });

  it('refuses a proposal over the limit and does not count it', () => {
    let s = run(founder(FOUNDER_IDS, 0, 1), 'propose', 'next', 'propose');
    expect(lastBody(s)).toEqual({ kind: 'limit', index: 1 });
    expect(s.proposals.sent).toEqual(['i1']);
    expect(s.proposals.counter.used).toBe(1);
    // Still offered, so the user can see why it does not go through.
    expect(chipsFor(s)).toContain('propose');
    s = run(s, 'next');
    expect(lastBody(s)).toEqual({ kind: 'match', index: 2 });
  });

  it('shows the excluded list once', () => {
    const s = run(founder(), 'excluded');
    expect(lastBody(s)).toEqual({ kind: 'excluded' });
    expect(chipsFor(s)).not.toContain('excluded');
    expect(run(s, 'excluded')).toBe(s);
  });

  it('never offers "excluded" when nobody was excluded', () => {
    expect(chipsFor(founder(FOUNDER_IDS, 0))).not.toContain('excluded');
  });

  it('ends after the last match with proposals made and left', () => {
    const s = run(founder(), 'propose', 'next', 'next', 'propose', 'next');
    expect(lastBody(s)).toEqual({ kind: 'end', proposed: 2, left: 3 });
    expect(isFinished(s)).toBe(true);
    expect(chipsFor(s)).toEqual(['excluded', 'restart']);
    expect(run(s, 'next')).toBe(s);
  });

  it('restart rebuilds the opening, keeps the monthly counter and keeps ids unique', () => {
    const before = run(founder(), 'propose', 'next', 'excluded');
    const s = run(before, 'restart');
    expect(bodies(s)).toEqual([{ kind: 'greet' }, { kind: 'criteria' }, { kind: 'match', index: 0 }]);
    expect(s.cursor).toBe(0);
    expect(s.excludedShown).toBe(false);
    expect(s.proposals.sent).toEqual(['i1']);
    expect(chipsFor(s)).not.toContain('propose');
    expect(Math.min(...s.messages.map((m) => m.id))).toBeGreaterThan(Math.max(...before.messages.map((m) => m.id)));
  });

  it('ignores investor-only chips', () => {
    const s = founder();
    for (const chip of ['interested', 'pass', 'simulate'] as Chip[]) expect(reduce(s, chip)).toBe(s);
  });
});

describe('v3 chat: investor', () => {
  it('opens with greeting and the first teaser', () => {
    const s = investor();
    expect(bodies(s)).toEqual([{ kind: 'greet' }, { kind: 'match', index: 0 }]);
    expect(chipsFor(s)).toEqual(['interested', 'pass', 'why', 'next', 'restart']);
  });

  it('with no matches it opens with an empty summary', () => {
    expect(lastBody(investor([]))).toEqual({ kind: 'summary', counts: { nuovo: 0, passato: 0, inviato: 0, intro: 0 } });
  });

  it('interest moves to waiting and offers the simulated reply', () => {
    const s = run(investor(), 'interested');
    expect(stateOf(s.board, 's01')).toBe('attesa-startup');
    expect(lastBody(s)).toEqual({ kind: 'interested', index: 0 });
    expect(chipsFor(s)).toEqual(['simulate', 'why', 'next', 'restart']);
  });

  it('a decline is reported exactly like no answer and the chips do not reveal it', () => {
    expect(demoReply('s01')).toBe('STARTUP_NO');
    const s = run(investor(), 'interested', 'simulate');
    expect(stateOf(s.board, 's01')).toBe('chiusa-startup');
    expect(lastBody(s)).toEqual({ kind: 'reply', index: 0, intro: false });
    const accepted = run(investor(['s08']), 'interested', 'simulate');
    expect(lastBody(accepted)).toEqual({ kind: 'reply', index: 0, intro: true });
    // Same chips after either outcome.
    expect(chipsFor(s)).toEqual(chipsFor(accepted));
  });

  it('an accepted reply leads to the intro', () => {
    const s = run(investor(), 'next', 'interested', 'simulate');
    expect(stateOf(s.board, 's08')).toBe('intro');
    expect(lastBody(s)).toEqual({ kind: 'reply', index: 1, intro: true });
  });

  it('pass confirms and moves straight to the next teaser', () => {
    const s = run(investor(), 'pass');
    expect(stateOf(s.board, 's01')).toBe('chiusa-investitore');
    expect(bodies(s).slice(-2)).toEqual([
      { kind: 'passed', index: 0 },
      { kind: 'match', index: 1 },
    ]);
    expect(s.cursor).toBe(1);
  });

  it('after the last teaser it summarises with bucket counts that merge declines into "interest sent"', () => {
    const s = run(investor(), 'interested', 'simulate', 'next', 'interested', 'simulate', 'next');
    expect(lastBody(s)).toEqual({ kind: 'summary', counts: { nuovo: 0, passato: 0, inviato: 1, intro: 1 } });
    expect(chipsFor(s)).toEqual(['restart']);
  });

  it('summary after passing the last teaser', () => {
    const s = run(investor(), 'next', 'pass');
    expect(lastBody(s)).toEqual({ kind: 'summary', counts: { nuovo: 1, passato: 1, inviato: 0, intro: 0 } });
  });

  it('restart clears the demo board', () => {
    const s = run(investor(), 'interested', 'simulate', 'restart');
    expect(s.board).toEqual({});
    expect(s.simulated).toEqual([]);
    expect(bodies(s)).toEqual([{ kind: 'greet' }, { kind: 'match', index: 0 }]);
  });

  it('ignores founder-only chips', () => {
    const s = investor();
    for (const chip of ['propose', 'excluded'] as Chip[]) expect(reduce(s, chip)).toBe(s);
  });
});
