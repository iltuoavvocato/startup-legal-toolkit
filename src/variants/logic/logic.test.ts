import { describe, expect, it } from 'vitest';
import { demoInvestors, demoStartups, EXAMPLE_INVESTOR_FORM } from '../../data/matchDemo';
import { MESSAGES } from '../../i18n/messages';
import { matchInvestors, matchStartups } from '../../lib/matching';
import { ownInvestor, ownStartup } from '../../lib/matchQuery';
import { TIPI_INVESTITORE } from '../../lib/matchTaxonomy';
import { MONTHLY_PROPOSAL_LIMIT } from '../../lib/optin';
import { AGENT_QUESTIONS, agentScript, ask, filterByTipo, tipoCounts } from './mock';
import { apply, bucketCounts, bucketOf, demoReply, investorStatus, simulateReply, stateOf } from './board';
import {
  createDeck,
  current,
  decide,
  decided,
  isDone,
  keyAction,
  lastDecision,
  progress,
  remainingCards,
  stack,
  swipeDecision,
  undo,
} from './deck';
import { createProposals, isSent, left, propose } from './proposals';
import {
  filterInvestorMatches,
  filterStartupMatches,
  investorSortValue,
  nextRow,
  NO_INVESTOR_FILTERS,
  NO_STARTUP_FILTERS,
  partShares,
  sortRows,
  startupSortValue,
  toggleSort,
  toggleValue,
} from './table';
import { DEMO_STARTUP_CORE, DEMO_THESIS } from '../shared/useDemo';

describe('swipe deck', () => {
  const ids = ['a', 'b', 'c'];

  it('walks the deck one card at a time and records decisions', () => {
    let d = createDeck(ids);
    expect(current(d)).toBe('a');
    expect(stack(d, 2)).toEqual(['a', 'b']);
    expect(progress(d)).toBe(0);
    d = decide(d, 'interested');
    d = decide(d, 'pass');
    expect(current(d)).toBe('c');
    expect(remainingCards(d)).toBe(1);
    expect(lastDecision(d)).toEqual({ id: 'b', decision: 'pass' });
    d = decide(d, 'interested');
    expect(isDone(d)).toBe(true);
    expect(current(d)).toBeNull();
    expect(progress(d)).toBe(1);
    expect(decided(d, 'interested')).toEqual(['a', 'c']);
    expect(decided(d, 'pass')).toEqual(['b']);
    expect(decide(d, 'pass')).toBe(d);
  });

  it('undoes the last decision and is a no-op at the start', () => {
    const start = createDeck(ids);
    expect(undo(start)).toBe(start);
    expect(lastDecision(start)).toBeNull();
    const d = undo(decide(decide(start, 'pass'), 'interested'));
    expect(current(d)).toBe('b');
    expect(d.decisions).toEqual({ a: 'pass' });
  });

  it('treats an empty deck as finished', () => {
    const d = createDeck([]);
    expect(isDone(d)).toBe(true);
    expect(progress(d)).toBe(1);
    expect(stack(d)).toEqual([]);
  });

  it('maps keys and drag distance to decisions', () => {
    expect(keyAction('ArrowLeft')).toBe('pass');
    expect(keyAction('ArrowRight')).toBe('interested');
    expect(keyAction('Backspace')).toBe('undo');
    expect(keyAction('z')).toBe('undo');
    expect(keyAction('Enter')).toBeNull();
    expect(swipeDecision(-120)).toBe('pass');
    expect(swipeDecision(120)).toBe('interested');
    expect(swipeDecision(40)).toBeNull();
    expect(swipeDecision(-89)).toBeNull();
  });
});

describe('table helpers on real matches', () => {
  const startup = ownStartup(DEMO_STARTUP_CORE);
  const { matches } = matchInvestors(startup, demoInvestors());

  it('toggles sort direction on the same column and resets on a new one', () => {
    expect(toggleSort({ key: 'score', dir: 'desc' }, 'score')).toEqual({ key: 'score', dir: 'asc' });
    expect(toggleSort({ key: 'score', dir: 'asc' }, 'nome', 'asc')).toEqual({ key: 'nome', dir: 'asc' });
    expect(toggleSort({ key: 'score', dir: 'asc' }, 'ticket')).toEqual({ key: 'ticket', dir: 'desc' });
  });

  it('sorts by score, name and ticket, stably', () => {
    const byScore = sortRows(matches, (r) => investorSortValue(r, 'score'), 'desc');
    expect(byScore.map((r) => r.item.id)).toEqual(matches.map((r) => r.item.id));
    const asc = sortRows(matches, (r) => investorSortValue(r, 'score'), 'asc').map((r) => r.evaluation.score);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const names = sortRows(matches, (r) => investorSortValue(r, 'nome'), 'asc').map((r) => r.item.nome);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'it')));
    const tickets = sortRows(matches, (r) => investorSortValue(r, 'ticket'), 'desc').map((r) => r.item.ticketMax);
    expect(tickets).toEqual([...tickets].sort((a, b) => b - a));
    const ties = sortRows([{ k: 1, n: 'x' }, { k: 1, n: 'y' }, { k: 0, n: 'z' }], (r) => r.k, 'desc');
    expect(ties.map((r) => r.n)).toEqual(['x', 'y', 'z']);
  });

  it('filters by investor type, minimum score and text', () => {
    expect(filterInvestorMatches(matches, NO_INVESTOR_FILTERS)).toHaveLength(matches.length);
    const tipo = matches[0]!.item.tipo;
    expect(filterInvestorMatches(matches, { ...NO_INVESTOR_FILTERS, tipi: [tipo] }).every((r) => r.item.tipo === tipo)).toBe(true);
    const min = matches[0]!.evaluation.score;
    expect(filterInvestorMatches(matches, { ...NO_INVESTOR_FILTERS, minScore: min }).every((r) => r.evaluation.score >= min)).toBe(true);
    expect(filterInvestorMatches(matches, { ...NO_INVESTOR_FILTERS, minScore: 101 })).toEqual([]);
    const name = matches[0]!.item.nome;
    expect(filterInvestorMatches(matches, { ...NO_INVESTOR_FILTERS, query: `  ${name.toUpperCase()} ` }).map((r) => r.item.id)).toContain(
      matches[0]!.item.id,
    );
  });

  it('filters and sorts startup matches for the investor', () => {
    const inv = ownInvestor(DEMO_THESIS);
    const rows = matchStartups(inv, demoStartups()).matches;
    expect(rows.length).toBeGreaterThan(1);
    expect(filterStartupMatches(rows, NO_STARTUP_FILTERS)).toHaveLength(rows.length);
    const s = rows[0]!.item.settore;
    expect(filterStartupMatches(rows, { ...NO_STARTUP_FILTERS, settori: [s] }).every((r) => r.item.settore === s)).toBe(true);
    expect(filterStartupMatches(rows, { ...NO_STARTUP_FILTERS, fasi: ['serie-a'] })).toEqual([]);
    const rounds = sortRows(rows, (r) => startupSortValue(r, 'round'), 'asc').map((r) => r.item.round);
    expect(rounds).toEqual([...rounds].sort((a, b) => a - b));
    const fasi = sortRows(rows, (r) => startupSortValue(r, 'fase'), 'asc').map((r) => r.item.fase);
    expect(fasi.indexOf('seed')).toBeGreaterThanOrEqual(fasi.lastIndexOf('pre-seed'));
  });

  it('toggles chips, moves between rows and computes part shares', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
    expect(nextRow(0, 3, 'j')).toBe(1);
    expect(nextRow(2, 3, 'ArrowDown')).toBe(2);
    expect(nextRow(0, 3, 'k')).toBe(0);
    expect(nextRow(1, 3, 'End')).toBe(2);
    expect(nextRow(2, 3, 'Home')).toBe(0);
    expect(nextRow(0, 3, 'x')).toBeNull();
    expect(nextRow(0, 0, 'j')).toBeNull();
    const shares = partShares(matches[0]!.evaluation, { settore: 30, ticket: 30, fase: 20, area: 20 });
    for (const v of Object.values(shares)) expect(v).toBeGreaterThanOrEqual(0);
    for (const v of Object.values(shares)) expect(v).toBeLessThanOrEqual(100);
  });
});

describe('investor opt-in board (double opt-in, local only)', () => {
  it('starts every teaser as a proposal and follows the real state machine', () => {
    let b = {};
    expect(stateOf(b, 's01')).toBe('proposta');
    b = apply(b, 's01', 'INVESTOR_YES');
    expect(stateOf(b, 's01')).toBe('attesa-startup');
    b = apply(b, 's02', 'INVESTOR_NO');
    expect(stateOf(b, 's02')).toBe('chiusa-investitore');
    expect(stateOf(apply(b, 's02', 'RESET'), 's02')).toBe('proposta');
  });

  it('gives a deterministic fictional answer, with both outcomes in the demo data', () => {
    const replies = demoStartups().map((s) => demoReply(s.id));
    expect(replies).toEqual(demoStartups().map((s) => demoReply(s.id)));
    expect(replies).toContain('STARTUP_YES');
    expect(replies).toContain('STARTUP_NO');
  });

  it('simulates the reply only after interest was sent', () => {
    expect(simulateReply({}, 's01')).toEqual({});
    const sent = apply({}, 's01', 'INVESTOR_YES');
    const after = simulateReply(sent, 's01');
    expect(['intro', 'chiusa-startup']).toContain(stateOf(after, 's01'));
    expect(simulateReply(apply({}, 's01', 'INVESTOR_NO'), 's01')).toEqual({ s01: 'chiusa-investitore' });
  });

  it('never reveals a startup’s no to the investor', () => {
    const declined = { x: 'chiusa-startup' as const };
    const pending = { x: 'attesa-startup' as const };
    for (const locale of ['it', 'en'] as const) {
      expect(investorStatus(declined, 'x', locale)).toEqual(investorStatus(pending, 'x', locale));
      expect(investorStatus(declined, 'x', locale).conosceNome).toBe(false);
      expect(investorStatus(declined, 'x', locale).titolo).toBe(MESSAGES[locale].match.optin.waitingInvestor.titolo);
    }
    expect(bucketOf(declined, 'x')).toBe('inviato');
    expect(bucketOf(pending, 'x')).toBe('inviato');
    expect(investorStatus({ x: 'intro' }, 'x').conosceNome).toBe(true);
  });

  it('counts buckets without a separate "declined" bucket', () => {
    const b = { a: 'attesa-startup', b: 'chiusa-startup', c: 'intro', d: 'chiusa-investitore' } as const;
    expect(bucketCounts(b, ['a', 'b', 'c', 'd', 'e'])).toEqual({ nuovo: 1, passato: 1, inviato: 2, intro: 1 });
  });

  it('works on the real investor-side matches', () => {
    const inv = ownInvestor(DEMO_THESIS, { nome: EXAMPLE_INVESTOR_FORM.nome });
    const ids = matchStartups(inv, demoStartups()).matches.map((m) => m.item.id);
    let b = {};
    for (const id of ids) b = simulateReply(apply(b, id, 'INVESTOR_YES'), id);
    const counts = bucketCounts(b, ids);
    expect(counts.inviato + counts.intro).toBe(ids.length);
    expect(counts.nuovo).toBe(0);
  });
});

describe('founder proposals within the monthly limit', () => {
  it('counts each investor once and stops at the limit with a localised reason', () => {
    let p = createProposals('2026-10');
    p = propose(p, 'i01');
    p = propose(p, 'i01');
    expect(p.counter.used).toBe(1);
    expect(isSent(p, 'i01')).toBe(true);
    expect(left(p)).toBe(MONTHLY_PROPOSAL_LIMIT - 1);
    for (let i = 2; i <= MONTHLY_PROPOSAL_LIMIT; i++) p = propose(p, `i0${i}`);
    expect(left(p)).toBe(0);
    const refused = propose(p, 'i99', 'en');
    expect(isSent(refused, 'i99')).toBe(false);
    expect(refused.error).toBe(MESSAGES.en.match.optin.limitReached(MONTHLY_PROPOSAL_LIMIT));
    expect(refused.counter).toEqual(p.counter);
  });
});

describe('sample data used by the variants', () => {
  it('gives the founder several matches and some exclusions, in both languages', () => {
    for (const locale of ['it', 'en'] as const) {
      const r = matchInvestors(ownStartup(DEMO_STARTUP_CORE, undefined, locale), demoInvestors(locale), locale);
      expect(r.matches.length).toBeGreaterThanOrEqual(5);
      expect(r.excluded.length).toBeGreaterThan(0);
    }
  });

  it('gives the investor several anonymous startups', () => {
    const r = matchStartups(ownInvestor(DEMO_THESIS), demoStartups());
    expect(r.matches.length).toBeGreaterThanOrEqual(3);
  });
});

describe('mock screens (agent chat, directory)', () => {
  const copy = { greeting: 'hi', questions: { settore: 'S?', fase: 'F?', round: 'R?', regione: 'G?' }, summary: (n: number) => `found ${n}` };

  it('scripts greeting, four question/answer pairs and the summary', () => {
    const s = agentScript(copy, { settore: 'Fintech', fase: 'Seed', round: '€ 500.000', regione: 'Lombardia' }, 7);
    expect(s.map((l) => l.from)).toEqual(['agent', ...AGENT_QUESTIONS.flatMap(() => ['agent', 'user']), 'agent']);
    expect(s.filter((l) => l.from === 'user').map((l) => l.text)).toEqual(['Fintech', 'Seed', '€ 500.000', 'Lombardia']);
    expect(s.at(-1)!.text).toBe('found 7');
    expect(new Set(s.map((l) => l.key)).size).toBe(s.length);
  });

  it('asks each quick reply once, in order', () => {
    expect(ask(ask(ask([], 'optin'), 'why'), 'optin')).toEqual(['optin', 'why']);
  });

  it('filters the demo investors by type, with counts that add up', () => {
    const all = demoInvestors('it');
    expect(filterByTipo(all, 'all')).toHaveLength(all.length);
    const counts = tipoCounts(all);
    expect(counts.reduce((n, x) => n + x.count, 0)).toBe(all.length);
    for (const { tipo, count } of counts) {
      const list = filterByTipo(all, tipo);
      expect(list).toHaveLength(count);
      expect(list.every((i) => i.tipo === tipo)).toBe(true);
    }
    expect(counts.map((x) => x.tipo)).toEqual(TIPI_INVESTITORE.filter((t) => counts.some((x) => x.tipo === t)));
  });
});
