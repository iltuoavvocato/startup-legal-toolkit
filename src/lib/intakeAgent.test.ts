import { describe, expect, it } from 'vitest';
import { demoInvestors, demoStartups, EXAMPLE_INVESTOR_FORM } from '../data/matchDemo';
import { MESSAGES } from '../i18n/messages';
import { extractFromDeck } from './deckExtract';
import {
  answerText,
  DECK_KEYS,
  demoAnswer,
  EDITABLE,
  explainInvestorMatch,
  explainStartupMatch,
  founderStatus,
  initIntake,
  investorProfileOf,
  investorStatus,
  isUnusualRound,
  list,
  MAX_AMOUNT,
  messageText,
  nextQuestion,
  plan,
  progress,
  questionSpec,
  reduce,
  restore,
  resultIdsFor,
  roundSuggestions,
  serialize,
  startupProfileOf,
  summaryRows,
  ticketSuggestions,
  toStorable,
  validate,
  type Action,
  type IntakeMode,
  type IntakeState,
  type QuestionId,
} from './intakeAgent';
import { evaluate, matchInvestors, matchStartups } from './matching';
import { ownStartup } from './matchQuery';
import { FASI, REGIONI, SETTORI, AREE } from './matchTaxonomy';
import { MONTHLY_PROPOSAL_LIMIT } from './optin';

const MONTH = '2026-10';
const R = (s: IntakeState) => resultIdsFor(s, demoInvestors(), demoStartups());
const run = (s: IntakeState, ...actions: Action[]) => actions.reduce((st, a) => reduce(st, a, R), s);
const ans = (value: Parameters<typeof validate>[1]): Action => ({ type: 'ANSWER', value });
const asked = (s: IntakeState): QuestionId[] =>
  s.messages.flatMap((m) => (m.from === 'agent' && m.body.kind === 'ask' ? [m.body.q] : []));
const lastAsk = (s: IntakeState) => {
  const m = [...s.messages].reverse().find((x) => x.from === 'agent' && x.body.kind === 'ask');
  return m && m.from === 'agent' && m.body.kind === 'ask' ? m.body : undefined;
};

/** Founder answers matching the "Usa un esempio" demo: fintech, seed, Lombardia, 500.000 €. */
function founderDone(): IntakeState {
  return run(
    initIntake('startup', MONTH),
    ans('skip'),
    ans('fintech'),
    ans('seed'),
    ans(500_000),
    ans('lombardia'),
    ans('Pagamenti istantanei per le PMI'),
  );
}

function investorDone(): IntakeState {
  return run(
    initIntake('investor', MONTH),
    ans([...EXAMPLE_INVESTOR_FORM.settori]),
    ans([...EXAMPLE_INVESTOR_FORM.fasi]),
    ans({ min: EXAMPLE_INVESTOR_FORM.ticketMin, max: EXAMPLE_INVESTOR_FORM.ticketMax }),
    ans(['italia']),
    ans(EXAMPLE_INVESTOR_FORM.sede),
  );
}

const DECK_PAGES = [
  'Vignalume\nAgritech per i vigneti: agricoltura di precisione',
  'Trazione\n42 aziende agricole clienti\nMRR di 18.000 €',
  'Il team\nSiamo un team di 7 persone',
  'Il round\nStiamo raccogliendo un round seed da 800.000 €',
  'Contatti\nsede operativa: Bari',
];
const FINDINGS = extractFromDeck(DECK_PAGES);
const withDeck = (s: IntakeState) => run(s, { type: 'DECK_START' }, { type: 'DECK_READY', pages: DECK_PAGES.length, findings: FINDINGS });

describe('initIntake', () => {
  it('greets and asks the first question of each mode', () => {
    const s = initIntake('startup', MONTH);
    expect(s.messages.map((m) => m.body.kind)).toEqual(['hello', 'ask']);
    expect(s.current).toBe('deck');
    expect(initIntake('investor', MONTH).current).toBe('settori');
  });

  it('message ids are unique and increasing', () => {
    const s = founderDone();
    const ids = s.messages.map((m) => m.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
    expect(s.nextId).toBe(Math.max(...ids) + 1);
  });
});

describe('questions and validation', () => {
  it('asks the founder questions in order and ends on the confirmation', () => {
    const s = founderDone();
    expect(asked(s)).toEqual(['deck', 'settore', 'fase', 'round', 'regione', 'oneLiner', 'confirm']);
    expect(s.current).toBe('confirm');
    expect(progress(s)).toEqual({ done: 5, total: 5 });
  });

  it('asks the investor questions in order', () => {
    const s = investorDone();
    expect(asked(s)).toEqual(['settori', 'fasi', 'ticket', 'aree', 'sede', 'confirm']);
    expect(s.answers.aree).toBe('italia');
  });

  it('rejects invalid answers without moving on, and clears the error on a valid one', () => {
    let s = run(initIntake('startup', MONTH), ans('skip'));
    s = run(s, ans('not-a-sector'));
    expect(s.error).toBe('invalid');
    expect(s.current).toBe('settore');
    s = run(s, ans('fintech'), ans('seed'), ans(0));
    expect(s.error).toBe('positive');
    s = run(s, ans(MAX_AMOUNT + 1));
    expect(s.error).toBe('tooBig');
    s = run(s, ans(250_000.4));
    expect(s.error).toBeNull();
    expect(s.answers.round).toBe(250_000);
  });

  it('validates every input kind', () => {
    expect(validate('settori', [])).toEqual({ ok: false, error: 'required' });
    expect(validate('settori', ['fintech', 'xx'])).toEqual({ ok: false, error: 'invalid' });
    // Multi: deduplicated, in the order picked (the first is the main sector or stage).
    expect(validate('settori', ['saas-b2b', 'fintech', 'saas-b2b'])).toEqual({ ok: true, value: ['saas-b2b', 'fintech'] });
    // "Tutta Italia" excludes the single areas.
    expect(validate('aree', ['centro', 'italia'])).toEqual({ ok: true, value: ['italia'] });
    expect(validate('ticket', { min: 100, max: 50 })).toEqual({ ok: false, error: 'order' });
    expect(validate('ticket', { min: 0, max: 50 })).toEqual({ ok: false, error: 'positive' });
    expect(validate('ticket', null)).toEqual({ ok: false, error: 'positive' });
    expect(validate('ticket', { min: 1, max: MAX_AMOUNT + 1 })).toEqual({ ok: false, error: 'tooBig' });
    expect(validate('ticket', { min: 25_000, max: 25_000 })).toEqual({ ok: true, value: { min: 25_000, max: 25_000 } });
    expect(validate('oneLiner', '   ')).toEqual({ ok: false, error: 'required' });
    expect(validate('oneLiner', 'x'.repeat(141))).toEqual({ ok: false, error: 'tooLong' });
    expect(validate('oneLiner', '  Due   spazi  ')).toEqual({ ok: true, value: 'Due spazi' });
    expect(validate('round', Number.NaN)).toEqual({ ok: false, error: 'positive' });
    expect(validate('deck', 'read')).toEqual({ ok: false, error: 'invalid' });
    expect(validate('confirm', 'go')).toEqual({ ok: true, value: 'go' });
  });

  it('only optional questions can be skipped', () => {
    let s = run(initIntake('startup', MONTH), ans('skip'));
    expect(run(s, { type: 'SKIP' })).toBe(s);
    s = run(s, ans('fintech'), ans('seed'), ans(500_000), ans('lombardia'), { type: 'SKIP' });
    expect(s.answers.oneLiner).toBeNull();
    expect(s.current).toBe('confirm');
    const i = run(initIntake('investor', MONTH), ans(['fintech']), ans(['seed']), ans({ min: 1, max: 2 }), ans(['centro']), { type: 'SKIP' });
    expect(i.answers.sede).toBeNull();
    expect(i.current).toBe('confirm');
    expect(summaryRows(i).find((r) => r.key === 'sede')).toMatchObject({ value: null, skipped: true });
  });

  it('ignores answers when no question is open', () => {
    const s = run(initIntake('startup', MONTH), { type: 'DECK_START' });
    expect(s.current).toBeNull();
    expect(run(s, ans('fintech'))).toBe(s);
  });
});

describe('branching and follow-ups', () => {
  it('suggests round sizes by stage and ticket ranges by stages', () => {
    expect(roundSuggestions('pre-seed')).toEqual([150_000, 300_000, 500_000]);
    expect(roundSuggestions('serie-a')[0]).toBeGreaterThan(roundSuggestions('seed')[0]!);
    expect(roundSuggestions(null)).toHaveLength(3);
    expect(ticketSuggestions(['pre-seed'])).toEqual([
      { min: 10_000, max: 50_000 },
      { min: 25_000, max: 100_000 },
    ]);
    // Stage order, not click order; at most four.
    expect(ticketSuggestions(['serie-a', 'pre-seed'])[0]).toEqual({ min: 10_000, max: 50_000 });
    expect(ticketSuggestions(['pre-seed', 'seed', 'serie-a'])).toHaveLength(4);
    expect(ticketSuggestions([])).toHaveLength(4);
  });

  it('passes the stage to the round question and the stages to the ticket question', () => {
    const s = run(initIntake('startup', MONTH), ans('skip'), ans('fintech'), ans('pre-seed'));
    expect(lastAsk(s)).toMatchObject({ q: 'round', fase: 'pre-seed' });
    const i = run(initIntake('investor', MONTH), ans(['fintech']), ans(['seed', 'pre-seed']));
    expect(lastAsk(i)).toMatchObject({ q: 'ticket', fasi: ['seed', 'pre-seed'] });
  });

  it('double-checks a round that is unusual for the stage', () => {
    expect(isUnusualRound('pre-seed', 3_000_000)).toBe(true);
    expect(isUnusualRound('seed', 500_000)).toBe(false);
    expect(isUnusualRound('serie-a', 500_000)).toBe(true);
    let s = run(initIntake('startup', MONTH), ans('skip'), ans('fintech'), ans('pre-seed'), ans(3_000_000));
    expect(s.current).toBe('roundCheck');
    expect(lastAsk(s)).toMatchObject({ round: 3_000_000, fase: 'pre-seed' });
    s = run(s, ans('change'));
    expect(s.current).toBe('round');
    expect(s.answers.round).toBeUndefined();
    s = run(s, ans(3_000_000), ans('ok'));
    expect(s.current).toBe('regione');
    expect(plan(s)).toContain('roundCheck');
    // A usual amount needs no check.
    expect(run(initIntake('startup', MONTH), ans('skip'), ans('fintech'), ans('seed'), ans(500_000)).current).toBe('regione');
  });

  it('asks the check again when the stage changes and makes the amount unusual', () => {
    let s = run(founderDone(), { type: 'EDIT', q: 'fase' }, ans('pre-seed'));
    expect(s.current).toBe('confirm');
    s = run(s, { type: 'EDIT', q: 'round' }, ans(2_000_000));
    expect(s.current).toBe('roundCheck');
  });
});

describe('edit and back', () => {
  it('reopens any answered question and resumes where it was', () => {
    let s = run(initIntake('startup', MONTH), ans('skip'), ans('fintech'), ans('seed'), ans(500_000));
    expect(s.current).toBe('regione');
    s = run(s, { type: 'EDIT', q: 'settore' });
    expect(s.current).toBe('settore');
    expect(s.editing).toBe('settore');
    expect(lastAsk(s)).toMatchObject({ q: 'settore', edit: true });
    s = run(s, ans('healthtech'));
    expect(s.answers.settore).toBe('healthtech');
    expect(s.current).toBe('regione');
    expect(s.editing).toBeNull();
  });

  it('ignores edits of questions not answered yet or not editable', () => {
    const s = run(initIntake('startup', MONTH), ans('skip'));
    expect(run(s, { type: 'EDIT', q: 'regione' })).toBe(s);
    expect(run(founderDone(), { type: 'EDIT', q: 'confirm' }).current).toBe('confirm');
    expect(run(s, { type: 'EDIT', q: 'settori' })).toBe(s);
    expect(EDITABLE).not.toContain('deck');
  });

  it('back reopens the previous answer', () => {
    let s = run(initIntake('investor', MONTH), ans(['fintech']), ans(['seed']));
    s = run(s, { type: 'BACK' });
    expect(s.current).toBe('fasi');
    s = run(s, ans(['seed', 'serie-a']));
    expect(s.answers.fasi).toEqual(['seed', 'serie-a']);
    expect(s.current).toBe('ticket');
    expect(run(initIntake('investor', MONTH), { type: 'BACK' }).current).toBe('settori');
  });

  it('editing after the results goes back to the intake and finds new matches on confirm', () => {
    let s = run(founderDone(), ans('go'));
    expect(s.phase).toBe('results');
    s = run(s, { type: 'EDIT', q: 'regione' });
    expect(s.phase).toBe('intake');
    s = run(s, ans('sicilia'));
    expect(s.current).toBe('confirm');
    s = run(s, ans('go'));
    expect(s.phase).toBe('results');
    const results = s.messages.filter((m) => m.body.kind === 'results');
    expect(results).toHaveLength(2);
  });
});

describe('deck in the conversation', () => {
  it('asks to confirm each finding, then skips the questions the deck answered', () => {
    let s = withDeck(initIntake('startup', MONTH));
    expect(s.deck.status).toBe('read');
    expect(s.messages.some((m) => m.body.kind === 'deckRead')).toBe(true);
    expect(s.current).toBe('deck:settore');
    expect(lastAsk(s)?.finding).toMatchObject({ key: 'settore', value: 'agritech', page: 1 });
    expect(lastAsk(s)?.finding?.snippet).toContain('Agritech');
    s = run(s, ans('accept'), ans('accept'), ans('accept'), ans('accept'));
    expect(s.answers).toMatchObject({ settore: 'agritech', fase: 'seed', round: 800_000, regione: 'puglia' });
    expect(s.sources).toEqual({ settore: 1, fase: 4, round: 4, regione: 5 });
    expect(s.current).toBe('deck:oneLiner');
    s = run(s, ans('accept'));
    expect(s.answers.oneLiner).toBeTruthy();
    expect(s.current).toBe('deck:extras');
    s = run(s, ans('accept'));
    expect(s.deck.signals.map((x) => x.kind)).toEqual(['team', 'traction', 'traction']);
    // Every regular question was answered by the deck.
    expect(s.current).toBe('confirm');
    expect(asked(s).filter((q) => !q.startsWith('deck'))).toEqual(['confirm']);
  });

  it('asks the regular question after "ignore", with the deck value as a suggestion after "edit"', () => {
    let s = run(withDeck(initIntake('startup', MONTH)), ans('ignore'), ans('edit'));
    expect(s.answers.settore).toBeUndefined();
    s = run(s, ans('ignore'), ans('ignore'), ans('ignore'), ans('ignore'));
    expect(s.current).toBe('settore');
    s = run(s, ans('fintech'));
    expect(s.current).toBe('fase');
    expect(lastAsk(s)).toMatchObject({ q: 'fase', suggested: 'seed' });
    expect(s.deck.signals).toEqual([]);
  });

  it('a deck dropped mid-conversation only asks about values that differ from the answers', () => {
    let s = run(initIntake('startup', MONTH), ans('skip'), ans('fintech'), ans('seed'));
    s = withDeck(s);
    // Stage agrees (seed): no question. Sector differs: asked, with the founder's earlier answer.
    expect(plan(s)).not.toContain('deck:fase');
    expect(s.current).toBe('deck:settore');
    expect(lastAsk(s)?.finding?.conflict).toBe('fintech');
    s = run(s, ans('ignore'));
    expect(s.answers.settore).toBe('fintech');
    expect(s.current).toBe('deck:round');
  });

  it('carries on with the questions when the deck cannot be read', () => {
    let s = run(initIntake('startup', MONTH), { type: 'DECK_START' });
    expect(s.deck.status).toBe('reading');
    expect(nextQuestion(s)).toBeNull();
    s = run(s, { type: 'DECK_ERROR', code: 'tooManyPages', pages: 55 });
    expect(s.deck.status).toBe('error');
    expect(s.current).toBe('settore');
    const err = s.messages.find((m) => m.body.kind === 'deckError')!;
    expect(messageText(err, 'startup', 'it')).toContain('55 pagine');
    // Results of a cancelled or stale read are ignored.
    expect(run(s, { type: 'DECK_READY', pages: 1, findings: FINDINGS })).toBe(s);
  });

  it('a deck with nothing useful just continues', () => {
    const empty = extractFromDeck(['Grazie per l’attenzione']);
    const s = run(initIntake('startup', MONTH), { type: 'DECK_START' }, { type: 'DECK_READY', pages: 1, findings: empty });
    expect(s.current).toBe('settore');
    expect(messageText(s.messages.find((m) => m.body.kind === 'deckRead')!, 'startup', 'en')).toMatch(/found nothing useful/);
  });

  it('investors cannot add a deck', () => {
    const s = initIntake('investor', MONTH);
    expect(run(s, { type: 'DECK_START' })).toBe(s);
  });
});

describe('matching and results', () => {
  it('builds the same profile objects the engine uses and ranks like the existing pages', () => {
    const s = run(founderDone(), ans('go'));
    const p = startupProfileOf(s)!;
    expect(p).toEqual(ownStartup({ settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 500_000 }, { oneLiner: 'Pagamenti istantanei per le PMI' }));
    const direct = matchInvestors(p, demoInvestors());
    const matchIds = s.messages.flatMap((m) => (m.from === 'agent' && m.body.kind === 'match' ? [m.body.id] : []));
    expect(matchIds).toEqual(direct.matches.map((m) => m.item.id));
    expect(matchIds.length).toBeGreaterThan(0);
    const wrap = s.messages.at(-1)!;
    expect(wrap.body).toEqual({ kind: 'wrap', count: direct.matches.length, excluded: direct.excluded.length });
  });

  it('builds the investor profile from the thesis', () => {
    const s = run(investorDone(), ans('go'));
    const i = investorProfileOf(s)!;
    expect(i).toMatchObject({ settori: EXAMPLE_INVESTOR_FORM.settori, ticketMin: 25_000, ticketMax: 100_000, aree: 'italia', sede: 'lombardia' });
    const direct = matchStartups(i, demoStartups());
    expect(resultIdsFor(s, demoInvestors(), demoStartups()).matches).toEqual(direct.matches.map((m) => m.item.id));
  });

  it('shows the excluded list once', () => {
    let s = run(founderDone(), ans('go'), { type: 'SHOW_EXCLUDED' });
    expect(s.messages.at(-1)!.body.kind).toBe('excluded');
    const n = s.messages.length;
    s = run(s, { type: 'SHOW_EXCLUDED' });
    expect(s.messages).toHaveLength(n);
    expect(run(initIntake('startup', MONTH), { type: 'SHOW_EXCLUDED' }).messages).toHaveLength(2);
  });
});

describe('double opt-in (local state only)', () => {
  const ids = (s: IntakeState) => R(s).matches;

  it('founder: propose within the monthly limit, never twice', () => {
    let s = run(founderDone(), ans('go'));
    const [a] = ids(s);
    s = run(s, { type: 'PROPOSE', id: a! });
    expect(s.counter.used).toBe(1);
    expect(founderStatus(s, a!)).toBe('waiting');
    expect(run(s, { type: 'PROPOSE', id: a! })).toBe(s);
    // Limit: the sixth proposal is refused and nothing changes but the notice.
    let t = run(founderDone(), ans('go'));
    const all = ['i01', 'i02', 'i03', 'i04', 'i05', 'i06'];
    for (const id of all) t = run(t, { type: 'PROPOSE', id });
    expect(t.counter.used).toBe(MONTHLY_PROPOSAL_LIMIT);
    expect(t.limitHit).toBe('i06');
    expect(t.board.i06).toBeUndefined();
  });

  it('founder: an investor\'s no looks exactly like no answer', () => {
    const base = { passed: [] as string[] };
    expect(founderStatus({ ...base, board: { x: 'chiusa-investitore' }, simulated: ['x'] }, 'x')).toBe(
      founderStatus({ ...base, board: { x: 'proposta' }, simulated: ['x'] }, 'x'),
    );
    expect(founderStatus({ ...base, board: { x: 'chiusa-investitore' }, simulated: [] }, 'x')).toBe(
      founderStatus({ ...base, board: { x: 'proposta' }, simulated: [] }, 'x'),
    );
    const s = run(founderDone(), ans('go'));
    const no = ids(s).find((id) => !demoAnswer(id));
    const yes = ids(s).find((id) => demoAnswer(id));
    expect(no && yes).toBeTruthy();
    const t = run(s, { type: 'PROPOSE', id: no! }, { type: 'SIMULATE', id: no! }, { type: 'PROPOSE', id: yes! }, { type: 'SIMULATE', id: yes! });
    expect(t.board[no!]).toBe('chiusa-investitore');
    expect(founderStatus(t, no!)).toBe('noNews');
    expect(founderStatus(t, yes!)).toBe('request');
    // The explanation for a "no" never says no.
    const p = startupProfileOf(t)!;
    const inv = demoInvestors().find((i) => i.id === no)!;
    for (const locale of ['it', 'en'] as const) {
      const e = explainInvestorMatch(p, inv, evaluate(p, inv, 'startup', locale), founderStatus(t, no!), locale);
      expect(e.next).not.toMatch(/rifiut|declin|non è interessato a te|said no/i);
    }
    // Accept or decline the intro only when asked.
    expect(run(t, { type: 'INTRO_YES', id: no! })).toBe(t);
    expect(founderStatus(run(t, { type: 'INTRO_YES', id: yes! }), yes!)).toBe('intro');
    expect(founderStatus(run(t, { type: 'INTRO_NO', id: yes! }), yes!)).toBe('declined');
  });

  it('founder: simulate only after proposing; pass sets an investor aside', () => {
    let s = run(founderDone(), ans('go'));
    const [a, b] = ids(s);
    expect(run(s, { type: 'SIMULATE', id: a! })).toBe(s);
    s = run(s, { type: 'PASS', id: b! });
    expect(founderStatus(s, b!)).toBe('passed');
    expect(run(s, { type: 'PROPOSE', id: b! })).toBe(s);
    expect(s.counter.used).toBe(0);
  });

  it('investor: interest, simulated answer, and a startup\'s no looks like no answer', () => {
    let s = run(investorDone(), ans('go'));
    expect(investorStatus({ board: { x: 'chiusa-startup' }, simulated: [] }, 'x')).toBe(investorStatus({ board: { x: 'attesa-startup' }, simulated: [] }, 'x'));
    expect(investorStatus({ board: { x: 'chiusa-startup' }, simulated: ['x'] }, 'x')).toBe(investorStatus({ board: { x: 'attesa-startup' }, simulated: ['x'] }, 'x'));
    const list = ids(s);
    const no = list.find((id) => !demoAnswer(id))!;
    const yes = list.find((id) => demoAnswer(id))!;
    s = run(s, { type: 'INTERESTED', id: no }, { type: 'INTERESTED', id: yes });
    expect(investorStatus(s, no)).toBe('waiting');
    s = run(s, { type: 'SIMULATE', id: no }, { type: 'SIMULATE', id: yes });
    expect(investorStatus(s, no)).toBe('noNews');
    expect(investorStatus(s, yes)).toBe('intro');
    // Founders' actions don't apply to investors and vice versa.
    expect(run(s, { type: 'PROPOSE', id: list[0]! })).toBe(s);
    const f = run(founderDone(), ans('go'));
    expect(run(f, { type: 'INTERESTED', id: 'i01' })).toBe(f);
    // Passing.
    const third = list.find((id) => id !== no && id !== yes)!;
    expect(investorStatus(run(s, { type: 'PASS', id: third }), third)).toBe('passed');
  });

  it('the investor never sees the startup name before the intro', () => {
    const s = run(investorDone(), ans('go'));
    const inv = investorProfileOf(s)!;
    for (const locale of ['it', 'en'] as const) {
      for (const st of demoStartups(locale).filter((x) => s.messages.some((m) => m.body.kind === 'match' && m.body.id === x.id))) {
        const ev = evaluate(st, inv, 'investitore', locale);
        for (const status of ['idle', 'waiting', 'noNews', 'passed'] as const) {
          const e = explainStartupMatch(st, inv, ev, status, locale);
          const text = [e.lead, e.fits, ...e.gaps, e.next].join(' ');
          expect(text).not.toContain(st.nome);
          expect(text).not.toContain(st.founder);
        }
        expect(explainStartupMatch(st, inv, ev, 'intro', locale).next).toContain(st.nome);
      }
    }
  });
});

describe('explanations', () => {
  it('give a lead, why it fits, what does not and the next step for every match, in both languages', () => {
    const s = run(founderDone(), ans('go'));
    for (const locale of ['it', 'en'] as const) {
      const p = startupProfileOf(s, locale)!;
      for (const { item, evaluation } of matchInvestors(p, demoInvestors(locale), locale).matches) {
        for (const status of ['idle', 'passed', 'waiting', 'noNews', 'request', 'intro', 'declined'] as const) {
          const e = explainInvestorMatch(p, item, evaluation, status, locale);
          expect(e.lead).toContain(item.nome);
          expect(e.fits.length).toBeGreaterThan(20);
          expect(e.gaps.length).toBeGreaterThan(0);
          expect(e.next).toContain(item.nome);
          expect(`${e.lead} ${e.fits} ${e.gaps.join(' ')} ${e.next}`).not.toMatch(/undefined|NaN|\$\{/);
        }
      }
    }
  });

  it('names the weak points: secondary sector, partial ticket, secondary stage, Italy-wide', () => {
    const p = ownStartup({ settore: 'fintech', fase: 'seed', regione: 'lombardia', round: 1_000_000 });
    const inv = {
      ...demoInvestors()[0]!,
      settori: ['saas-b2b', 'fintech'] as const,
      fasi: ['pre-seed', 'seed'] as const,
      ticketMin: 10_000,
      ticketMax: 100_000,
      aree: 'italia' as const,
      sede: null,
    };
    const i = { ...inv, settori: [...inv.settori], fasi: [...inv.fasi] };
    const e = explainInvestorMatch(p, i, evaluate(p, i), 'idle', 'it');
    expect(e.gaps).toHaveLength(4);
    expect(e.gaps.join(' ')).toContain('SaaS B2B');
    expect(e.gaps.join(' ')).toContain('10%');
    expect(e.lead).not.toContain('sede in');
    const en = explainInvestorMatch(p, i, evaluate(p, i, 'startup', 'en'), 'idle', 'en');
    expect(en.gaps.join(' ')).toContain('10%');
    // A perfect match has no weak points.
    const perfect = { ...i, settori: ['fintech' as const], fasi: ['seed' as const], ticketMax: 1_000_000, sede: 'lombardia' as const };
    expect(explainInvestorMatch(p, perfect, evaluate(p, perfect), 'idle', 'it').gaps).toEqual([MESSAGES.it.intake.explain.noGaps]);
  });

  it('joins lists in each language', () => {
    expect(list(['a'], 'it')).toBe('a');
    expect(list(['a', 'b', 'c'], 'it')).toBe('a, b e c');
    expect(list(['a', 'b'], 'en')).toBe('a and b');
    expect(list([], 'en')).toBe('');
  });
});

describe('both languages', () => {
  const MODES: IntakeMode[] = ['startup', 'investor'];

  it('state is language-free: the same actions give the same state, rendered in either language', () => {
    for (const mode of MODES) {
      const s = run(mode === 'startup' ? withDeck(initIntake('startup', MONTH)) : investorDone(), ans(mode === 'startup' ? 'accept' : 'go'));
      const it = s.messages.map((m) => messageText(m, mode, 'it'));
      const en = s.messages.map((m) => messageText(m, mode, 'en'));
      expect(it).toHaveLength(en.length);
      it.forEach((text, k) => {
        expect(text, `it #${k}`).toBeTruthy();
        expect(en[k], `en #${k}`).toBeTruthy();
      });
      // The hello and the questions differ by language (no untranslated copy).
      expect(it[0]).not.toBe(en[0]);
    }
  });

  it('every question, option and summary row has a label in it and en', () => {
    const all: QuestionId[] = ['deck', 'settore', 'fase', 'round', 'roundCheck', 'regione', 'oneLiner', 'confirm', 'settori', 'fasi', 'ticket', 'aree', 'sede'];
    for (const q of [...all, ...DECK_KEYS.map((k) => `deck:${k}` as QuestionId)]) {
      for (const option of questionSpec(q).options) {
        const value = questionSpec(q).kind === 'multi' ? [option] : option;
        const a = answerText(q, value, 'it');
        const b = answerText(q, value, 'en');
        expect(a, `${q}:${option}`).toBeTruthy();
        expect(b, `${q}:${option}`).toBeTruthy();
        expect(a).not.toBe('undefined');
      }
    }
    expect(SETTORI.length + FASI.length + REGIONI.length + AREE.length).toBeGreaterThan(30);
    for (const s of [founderDone(), investorDone()]) {
      const keysIt = summaryRows(s, 'it').map((r) => r.key);
      expect(summaryRows(s, 'en').map((r) => r.key)).toEqual(keysIt);
      expect(summaryRows(s, 'en').every((r) => r.value || r.skipped)).toBe(true);
    }
  });

  it('formats amounts per language in answers', () => {
    const sp = (x: string) => x.replace(/\u00a0/g, ' ');
    expect(sp(answerText('round', 500_000, 'it'))).toBe('500.000 €');
    expect(answerText('round', 500_000, 'en')).toBe('€500,000');
    expect(sp(answerText('ticket', { min: 25_000, max: 100_000 }, 'it'))).toBe('da 25.000 € a 100.000 €');
    expect(answerText('aree', ['italia'], 'en')).toBe(MESSAGES.en.match.taxonomy.allItaly);
    expect(answerText('settori', ['fintech', 'saas-b2b'], 'it')).toBe('Fintech e SaaS B2B');
  });
});

describe('storage', () => {
  it('never stores the deck text: no findings, no snippets, no tagline unless accepted', () => {
    const s = withDeck(initIntake('startup', MONTH));
    const raw = serialize(s);
    expect(s.deck.findings).not.toBeNull();
    expect(JSON.parse(raw).deck.findings).toBeNull();
    for (const page of DECK_PAGES) for (const line of page.split('\n')) if (line.length > 12) expect(raw).not.toContain(line);
    expect(raw).not.toContain('snippet');
    // Tagline: dropped while pending or ignored, kept once accepted (it's then the founder's own pitch).
    let t = run(s, ans('accept'), ans('accept'), ans('accept'), ans('accept'));
    expect(t.current).toBe('deck:oneLiner');
    expect(serialize(t)).not.toContain('agricoltura di precisione');
    t = run(t, ans('accept'));
    expect(serialize(t)).toContain('agricoltura di precisione');
  });

  it('round-trips a conversation', () => {
    const s = run(founderDone(), ans('go'), { type: 'PROPOSE', id: 'i01' });
    const back = restore(serialize(s), 'startup', MONTH)!;
    expect(back).toEqual(toStorable(s));
    expect(founderStatus(back, 'i01')).toBe('waiting');
  });

  it('rejects other modes, other versions and junk', () => {
    const raw = serialize(founderDone());
    expect(restore(raw, 'investor', MONTH)).toBeNull();
    expect(restore(raw.replace('"version":1', '"version":2'), 'startup', MONTH)).toBeNull();
    expect(restore('{nope', 'startup', MONTH)).toBeNull();
    expect(restore(null, 'startup', MONTH)).toBeNull();
    expect(restore(JSON.stringify({ ...JSON.parse(raw), answers: { settore: 'crypto' } }), 'startup', MONTH)).toBeNull();
    expect(restore(JSON.stringify({ ...JSON.parse(raw), answers: { round: -5 } }), 'startup', MONTH)).toBeNull();
  });

  it('resets the monthly counter in a new month', () => {
    const s = run(founderDone(), ans('go'), { type: 'PROPOSE', id: 'i01' });
    expect(restore(serialize(s), 'startup', '2026-11')!.counter).toEqual({ month: '2026-11', used: 0 });
  });

  it('after a reload during the deck review, the regular questions take over', () => {
    const s = withDeck(initIntake('startup', MONTH));
    expect(s.current).toBe('deck:settore');
    const back = restore(serialize(s), 'startup', MONTH)!;
    expect(back.current).toBe('settore');
    expect(back.messages.some((m) => m.body.kind === 'restored')).toBe(true);
    // A read in progress is not resumed either.
    const reading = run(initIntake('startup', MONTH), { type: 'DECK_START' });
    expect(restore(serialize(reading), 'startup', MONTH)!.current).toBe('settore');
  });

  it('restart clears the answers but keeps this month\'s proposals', () => {
    const s = run(founderDone(), ans('go'), { type: 'PROPOSE', id: 'i01' }, { type: 'RESTART' });
    expect(s.answers).toEqual({});
    expect(s.board).toEqual({});
    expect(s.counter.used).toBe(1);
    expect(s.current).toBe('deck');
    expect(s.messages).toHaveLength(2);
  });
});
