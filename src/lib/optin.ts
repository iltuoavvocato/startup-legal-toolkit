// Double opt-in: an intro happens only if both sides say yes, and a "no" is never revealed to the other side.
import { FORMATTERS } from '../i18n/format';
import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';
import { MONTHLY_PROPOSAL_LIMIT } from './matchConfig';
import { labelsFor, type Investor, type StartupProfile } from './matchTaxonomy';

export const PRODUCT_NAME = 'MatchInvStar';

export type OptInState = 'proposta' | 'attesa-startup' | 'chiusa-investitore' | 'chiusa-startup' | 'intro';
export type OptInEvent = 'INVESTOR_YES' | 'INVESTOR_NO' | 'STARTUP_YES' | 'STARTUP_NO' | 'RESET';
export type Side = 'investitore' | 'startup';

const TRANSITIONS: Record<OptInState, Partial<Record<OptInEvent, OptInState>>> = {
  proposta: { INVESTOR_YES: 'attesa-startup', INVESTOR_NO: 'chiusa-investitore' },
  'attesa-startup': { STARTUP_YES: 'intro', STARTUP_NO: 'chiusa-startup' },
  'chiusa-investitore': {},
  'chiusa-startup': {},
  intro: {},
};

/** Pure transition. Events that don't apply to the current state are ignored (same state returned). */
export function transition(state: OptInState, event: OptInEvent): OptInState {
  if (event === 'RESET') return 'proposta';
  return TRANSITIONS[state][event] ?? state;
}

export function stateSteps(locale: Locale = 'it'): { state: OptInState; label: string }[] {
  const steps = MESSAGES[locale].match.optin.steps;
  return [
    { state: 'proposta', label: steps.proposta },
    { state: 'attesa-startup', label: steps.attesa },
    { state: 'intro', label: steps.intro },
  ];
}

export const STATE_STEPS = stateSteps('it');

export type SideAction = { event: OptInEvent; label: string; variant: 'primary' | 'secondary' };

export interface SideView {
  /** What this side sees: teaser (anonymous startup), investor card, intro email or a status message. */
  kind: 'teaser' | 'richiesta' | 'stato' | 'intro';
  titolo: string;
  testo: string;
  azioni: SideAction[];
  /** Whether this side currently knows who the other party is. */
  conosceNome: boolean;
}

/**
 * What each side sees in each state. A "no" is indistinguishable from silence:
 * the startup sees the same thing whether the investor said no or hasn't answered yet,
 * and the investor sees the same thing whether the startup said no or hasn't answered yet.
 */
export function viewFor(state: OptInState, side: Side, locale: Locale = 'it'): SideView {
  const m = MESSAGES[locale].match.optin;
  const status = (copy: { titolo: string; testo: string }, conosceNome: boolean): SideView => ({
    kind: 'stato',
    ...copy,
    azioni: [],
    conosceNome,
  });
  if (state === 'intro') return { kind: 'intro', ...m.intro, azioni: [], conosceNome: true };
  if (side === 'investitore') {
    switch (state) {
      case 'proposta':
        return {
          kind: 'teaser',
          ...m.investorTeaser,
          azioni: [
            { event: 'INVESTOR_YES', label: m.actions.investorYes, variant: 'primary' },
            { event: 'INVESTOR_NO', label: m.actions.investorNo, variant: 'secondary' },
          ],
          conosceNome: false,
        };
      case 'chiusa-investitore':
        return status(m.investorClosed, false);
      case 'attesa-startup':
      case 'chiusa-startup':
        return status(m.waitingInvestor, false);
    }
  }
  switch (state) {
    case 'attesa-startup':
      return {
        kind: 'richiesta',
        ...m.startupRequest,
        azioni: [
          { event: 'STARTUP_YES', label: m.actions.startupYes, variant: 'primary' },
          { event: 'STARTUP_NO', label: m.actions.startupNo, variant: 'secondary' },
        ],
        conosceNome: true,
      };
    case 'chiusa-startup':
      return status(m.startupClosed, true);
    case 'proposta':
    case 'chiusa-investitore':
      return status(m.neutralStartup, false);
  }
}

export interface Teaser {
  settore: string;
  regione: string;
  fase: string;
  importo: string;
  oneLiner: string;
}

/** Anonymous teaser: no startup name, no founder name, no contact. */
export function teaserOf(
  s: Pick<StartupProfile, 'settore' | 'regione' | 'fase' | 'round' | 'oneLiner'>,
  locale: Locale = 'it',
): Teaser {
  const L = labelsFor(locale);
  return {
    settore: L.settore[s.settore],
    regione: L.regione[s.regione],
    fase: L.fase[s.fase],
    importo: FORMATTERS[locale].euro(s.round),
    oneLiner: s.oneLiner,
  };
}

export interface IntroEmail {
  da: string;
  a: string[];
  oggetto: string;
  corpo: string[];
}

export function introEmail(s: StartupProfile, i: Investor, locale: Locale = 'it'): IntroEmail {
  const e = MESSAGES[locale].match.optin.email;
  const L = labelsFor(locale);
  return {
    da: `${PRODUCT_NAME} <intro@matchinvstar.example>`,
    a: [`${s.founder} <${s.email}>`, `${i.referente} <${i.email}>`],
    oggetto: e.subject(s.nome, i.nome, PRODUCT_NAME),
    corpo: [
      e.greeting(s.founder, i.referente),
      e.startupLine(s.founder, s.nome, L.settore[s.settore], L.regione[s.regione], L.fase[s.fase], FORMATTERS[locale].euro(s.round), s.oneLiner),
      e.investorLine(i.referente, i.nome, L.tipo[i.tipo], i.tesi),
      e.next,
      e.disclaimer(PRODUCT_NAME),
      e.signature(PRODUCT_NAME),
    ],
  };
}

// ---------- Monthly proposal limit ----------

/** Max proposals per startup per calendar month (valore provvisorio, defined in matchConfig.ts). */
export { MONTHLY_PROPOSAL_LIMIT };

export interface ProposalCounter {
  /** 'YYYY-MM' */
  month: string;
  used: number;
}

/** Returns the counter for `month`, starting from zero when the month changes. */
export function counterFor(month: string, prev?: ProposalCounter): ProposalCounter {
  return prev && prev.month === month ? prev : { month, used: 0 };
}

export function remaining(c: ProposalCounter, limit = MONTHLY_PROPOSAL_LIMIT): number {
  return Math.max(0, limit - c.used);
}

export function canPropose(c: ProposalCounter, limit = MONTHLY_PROPOSAL_LIMIT): boolean {
  return remaining(c, limit) > 0;
}

export type ConsumeResult = { ok: true; counter: ProposalCounter } | { ok: false; reason: string; counter: ProposalCounter };

export function consume(c: ProposalCounter, limit = MONTHLY_PROPOSAL_LIMIT, locale: Locale = 'it'): ConsumeResult {
  if (!canPropose(c, limit)) {
    return { ok: false, counter: c, reason: MESSAGES[locale].match.optin.limitReached(limit) };
  }
  return { ok: true, counter: { month: c.month, used: c.used + 1 } };
}

/** 'YYYY-MM' for a date (local time). */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
