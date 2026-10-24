import { describe, expect, it } from 'vitest';
import { DEMO_INVESTORS, DEMO_STARTUPS } from '../data/matchDemo';
import {
  canPropose,
  consume,
  counterFor,
  introEmail,
  MONTHLY_PROPOSAL_LIMIT,
  monthKey,
  remaining,
  teaserOf,
  transition,
  viewFor,
  type OptInEvent,
  type OptInState,
} from './optin';

const STATES: OptInState[] = ['proposta', 'attesa-startup', 'chiusa-investitore', 'chiusa-startup', 'intro'];
const EVENTS: OptInEvent[] = ['INVESTOR_YES', 'INVESTOR_NO', 'STARTUP_YES', 'STARTUP_NO'];

const run = (events: OptInEvent[]) => events.reduce(transition, 'proposta' as OptInState);

describe('transition', () => {
  it('reaches the intro only when both say yes', () => {
    expect(run(['INVESTOR_YES'])).toBe('attesa-startup');
    expect(run(['INVESTOR_YES', 'STARTUP_YES'])).toBe('intro');
  });

  it('closes on either no', () => {
    expect(run(['INVESTOR_NO'])).toBe('chiusa-investitore');
    expect(run(['INVESTOR_YES', 'STARTUP_NO'])).toBe('chiusa-startup');
  });

  it('ignores events that do not apply', () => {
    expect(transition('proposta', 'STARTUP_YES')).toBe('proposta');
    expect(transition('proposta', 'STARTUP_NO')).toBe('proposta');
    expect(transition('attesa-startup', 'INVESTOR_NO')).toBe('attesa-startup');
    for (const terminal of ['intro', 'chiusa-investitore', 'chiusa-startup'] as const)
      for (const e of EVENTS) expect(transition(terminal, e)).toBe(terminal);
  });

  it('does not let the startup answer before the investor', () => {
    expect(run(['STARTUP_YES', 'INVESTOR_YES'])).toBe('attesa-startup');
  });

  it('resets from every state', () => {
    for (const s of STATES) expect(transition(s, 'RESET')).toBe('proposta');
  });
});

describe('viewFor: a no is never revealed', () => {
  it('shows the startup the same thing whether the investor said no or has not answered', () => {
    expect(viewFor('chiusa-investitore', 'startup')).toEqual(viewFor('proposta', 'startup'));
  });

  it('shows the investor the same thing whether the startup said no or has not answered', () => {
    expect(viewFor('chiusa-startup', 'investitore')).toEqual(viewFor('attesa-startup', 'investitore'));
  });

  it('never tells one side about the other side’s refusal', () => {
    for (const s of STATES)
      for (const side of ['investitore', 'startup'] as const) {
        const v = viewFor(s, side);
        const ownNo = (side === 'investitore' && s === 'chiusa-investitore') || (side === 'startup' && s === 'chiusa-startup');
        if (!ownNo) expect(`${v.titolo} ${v.testo}`).not.toMatch(/rifiut/i);
      }
  });

  it('keeps the startup anonymous for the investor until the intro', () => {
    for (const s of STATES.filter((x) => x !== 'intro')) expect(viewFor(s, 'investitore').conosceNome).toBe(false);
    expect(viewFor('intro', 'investitore').conosceNome).toBe(true);
    expect(viewFor('attesa-startup', 'startup').conosceNome).toBe(true);
  });

  it('offers actions only to the side whose turn it is', () => {
    expect(viewFor('proposta', 'investitore').azioni.map((a) => a.event)).toEqual(['INVESTOR_YES', 'INVESTOR_NO']);
    expect(viewFor('proposta', 'startup').azioni).toEqual([]);
    expect(viewFor('attesa-startup', 'startup').azioni.map((a) => a.event)).toEqual(['STARTUP_YES', 'STARTUP_NO']);
    expect(viewFor('attesa-startup', 'investitore').azioni).toEqual([]);
    expect(viewFor('intro', 'startup').kind).toBe('intro');
  });
});

describe('teaser and intro email', () => {
  const s = DEMO_STARTUPS[0]!;
  const i = DEMO_INVESTORS[0]!;

  it('teaser has no names or contacts', () => {
    const text = JSON.stringify(teaserOf(s));
    expect(text).not.toContain(s.nome);
    expect(text).not.toContain(s.founder);
    expect(text).not.toContain(s.email);
    expect(teaserOf(s).settore).toBe('Fintech');
  });

  it('intro email names both parties and is sent via MatchInvStar', () => {
    const email = introEmail(s, i);
    expect(email.oggetto).toContain(s.nome);
    expect(email.oggetto).toContain(i.nome);
    expect(email.oggetto).toContain('via MatchInvStar');
    expect(email.a.join(' ')).toContain(s.founder);
    expect(email.a.join(' ')).toContain(i.referente);
    expect(email.corpo.join(' ')).toMatch(/non dà consulenza sugli investimenti/);
  });
});

describe('monthly proposal limit', () => {
  it('defaults to 5', () => {
    expect(MONTHLY_PROPOSAL_LIMIT).toBe(5);
  });

  it('allows 5 proposals and refuses the 6th', () => {
    let c = counterFor('2026-10');
    for (let n = 0; n < 5; n++) {
      const r = consume(c);
      expect(r.ok).toBe(true);
      c = r.counter;
    }
    expect(c.used).toBe(5);
    expect(canPropose(c)).toBe(false);
    const sixth = consume(c);
    expect(sixth.ok).toBe(false);
    expect(sixth.counter).toEqual(c);
    if (!sixth.ok) expect(sixth.reason).toContain('valore provvisorio');
  });

  it('resets when the month changes', () => {
    const october = { month: '2026-10', used: 5 };
    expect(counterFor('2026-10', october)).toBe(october);
    expect(counterFor('2026-11', october)).toEqual({ month: '2026-11', used: 0 });
  });

  it('never reports a negative remainder and supports a custom limit', () => {
    expect(remaining({ month: '2026-10', used: 9 })).toBe(0);
    expect(remaining({ month: '2026-10', used: 1 }, 3)).toBe(2);
    expect(consume({ month: '2026-10', used: 2 }, 3).ok).toBe(true);
    expect(consume({ month: '2026-10', used: 3 }, 3).ok).toBe(false);
  });

  it('formats the month key', () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe('2026-01');
    expect(monthKey(new Date(2026, 9, 31))).toBe('2026-10');
  });
});
