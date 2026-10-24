// The two mock screens of every variant (guided agent chat, investor directory): a scripted conversation from the
// sample profile and a type filter over the demo investors. Pure; the copy and the labels are passed in.
import type { Investor, TipoInvestitore } from '../../lib/matchTaxonomy';
import { TIPI_INVESTITORE } from '../../lib/matchTaxonomy';

export const AGENT_QUESTIONS = ['settore', 'fase', 'round', 'regione'] as const;
export type AgentQuestion = (typeof AGENT_QUESTIONS)[number];

export interface ScriptLine {
  key: string;
  from: 'agent' | 'user';
  text: string;
}

/** Greeting, then one question and the sample answer per step, then the summary of the matches. */
export function agentScript(
  copy: { greeting: string; questions: Record<AgentQuestion, string>; summary: (n: number) => string },
  answers: Record<AgentQuestion, string>,
  matchCount: number,
): ScriptLine[] {
  return [
    { key: 'greeting', from: 'agent', text: copy.greeting },
    ...AGENT_QUESTIONS.flatMap((q): ScriptLine[] => [
      { key: `q-${q}`, from: 'agent', text: copy.questions[q] },
      { key: `a-${q}`, from: 'user', text: answers[q] },
    ]),
    { key: 'summary', from: 'agent', text: copy.summary(matchCount) },
  ];
}

export const QUICK_REPLIES = ['why', 'optin'] as const;
export type QuickReply = (typeof QUICK_REPLIES)[number];

/** Asks a quick reply once: the order of the questions is kept, a repeat is ignored. */
export const ask = (asked: readonly QuickReply[], chip: QuickReply): QuickReply[] => (asked.includes(chip) ? [...asked] : [...asked, chip]);

export type TipoFilter = TipoInvestitore | 'all';

export const filterByTipo = <T extends Pick<Investor, 'tipo'>>(list: readonly T[], tipo: TipoFilter): T[] =>
  tipo === 'all' ? [...list] : list.filter((i) => i.tipo === tipo);

/** The types present in the list, in taxonomy order, with how many investors each has. */
export function tipoCounts(list: readonly Pick<Investor, 'tipo'>[]): { tipo: TipoInvestitore; count: number }[] {
  return TIPI_INVESTITORE.map((tipo) => ({ tipo, count: list.filter((i) => i.tipo === tipo).length })).filter((x) => x.count > 0);
}

/** Cards shown at first in the mock directory; "show more" adds the same amount again. */
export const DIRECTORY_PAGE = 6;
