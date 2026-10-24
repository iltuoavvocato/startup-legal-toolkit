// Shared state of the two mock screens of every variant (guided agent chat, investor directory). In memory only.
import { useMemo, useState } from 'react';
import { demoInvestors } from '../../data/matchDemo';
import { useI18n } from '../../i18n/context';
import { labelsFor, type Investor } from '../../lib/matchTaxonomy';
import { ask, agentScript, DIRECTORY_PAGE, filterByTipo, QUICK_REPLIES, tipoCounts, type QuickReply, type TipoFilter } from '../logic/mock';
import { useFounderDemo } from './useDemo';

/** The sample conversation, the top three matches (real engine) and the quick replies asked so far. */
export function useAgentMock() {
  const { locale, t, f } = useI18n();
  const c = t.variants.agentMock;
  const demo = useFounderDemo();
  const L = labelsFor(locale);
  const [asked, setAsked] = useState<QuickReply[]>([]);
  const { core } = demo;
  const script = agentScript(
    c,
    { settore: L.settore[core.settore], fase: L.fase[core.fase], round: f.euro(core.round), regione: L.regione[core.regione] },
    demo.matches.length,
  );
  const top = demo.matches.slice(0, 3);
  const first = top[0];
  const replyOf = (chip: QuickReply) =>
    chip === 'why' && first ? c.replyWhy(first.item.nome, first.evaluation.reasons.slice(0, 2).join('. ')) : c.replyOptin;
  return {
    script,
    top,
    total: demo.matches.length,
    profileLine: demo.profileLine,
    /** Asked quick replies with the agent's answer, in order. */
    replies: asked.map((chip) => ({ chip, question: c.chips[chip], answer: replyOf(chip) })),
    /** Quick replies not asked yet. */
    chips: QUICK_REPLIES.filter((chip) => !asked.includes(chip)).map((chip) => ({ chip, label: c.chips[chip] })),
    ask: (chip: QuickReply) => setAsked((a) => ask(a, chip)),
  };
}

/** Short card fields of an investor, formatted for the current language. */
export function useInvestorSummary() {
  const { locale, t, f } = useI18n();
  const L = labelsFor(locale);
  const card = t.directory.dir.card;
  return (i: Investor) => ({
    tipo: L.tipo[i.tipo],
    settori: i.settori === 'tutti' ? card.generalist : i.settori.map((s) => L.settore[s]).join(', '),
    fasi: i.fasi.map((x) => L.fase[x]).join(', '),
    ticket: `${f.euro(i.ticketMin)}–${f.euro(i.ticketMax)}`,
    aree: i.aree === 'italia' ? card.italy : i.aree.map((a) => L.area[a]).join(', '),
    sede: i.sede ? L.regione[i.sede] : null,
  });
}

/** The demo investors with a type filter and "show more"; links go to the real directory and profiles. */
export function useDirectoryMock() {
  const { locale, t, path } = useI18n();
  const L = labelsFor(locale);
  const all = useMemo(() => demoInvestors(locale), [locale]);
  const [tipo, setTipoState] = useState<TipoFilter>('all');
  const [limit, setLimit] = useState(DIRECTORY_PAGE);
  const list = useMemo(() => filterByTipo(all, tipo), [all, tipo]);
  const shown = list.slice(0, limit);
  return {
    tipo,
    setTipo: (next: TipoFilter) => {
      setTipoState(next);
      setLimit(DIRECTORY_PAGE);
    },
    /** Filter options: "all" first, then the types present. */
    options: [
      { id: 'all' as TipoFilter, label: t.directory.dir.any, count: all.length },
      ...tipoCounts(all).map((x) => ({ id: x.tipo as TipoFilter, label: L.tipo[x.tipo], count: x.count })),
    ],
    list,
    shown,
    total: all.length,
    countLine: t.directory.dir.count(list.length, all.length),
    more: Math.min(DIRECTORY_PAGE, list.length - shown.length),
    showMore: () => setLimit((n) => n + DIRECTORY_PAGE),
    profileHref: (id: string) => `${path('matchInvestorProfile')}?id=${encodeURIComponent(id)}`,
    directoryHref: path('matchDirectory'),
  };
}
