// Shared demo state for every variant: the sample founder and investor, ranked with the real engine.
// Everything lives in memory; nothing is stored or sent.
import { useMemo, useState } from 'react';
import { demoInvestors, demoStartups, EXAMPLE_INVESTOR_FORM, EXAMPLE_STARTUP_FORM } from '../../data/matchDemo';
import { useI18n } from '../../i18n/context';
import { matchInvestors, matchStartups } from '../../lib/matching';
import { ownInvestor, ownStartup, type StartupCore, type Thesis } from '../../lib/matchQuery';
import { labelsFor } from '../../lib/matchTaxonomy';
import { monthKey, type OptInEvent } from '../../lib/optin';
import { apply, bucketCounts, simulateReply, type Board } from '../logic/board';
import { createProposals, propose, type Proposals } from '../logic/proposals';

export const DEMO_STARTUP_CORE: StartupCore = {
  settore: EXAMPLE_STARTUP_FORM.settore,
  fase: EXAMPLE_STARTUP_FORM.fase,
  regione: EXAMPLE_STARTUP_FORM.regione,
  round: EXAMPLE_STARTUP_FORM.round,
};

export const DEMO_THESIS: Thesis = {
  settori: [...EXAMPLE_INVESTOR_FORM.settori],
  fasi: [...EXAMPLE_INVESTOR_FORM.fasi],
  ticketMin: EXAMPLE_INVESTOR_FORM.ticketMin,
  ticketMax: EXAMPLE_INVESTOR_FORM.ticketMax,
  aree: 'italia',
  sede: EXAMPLE_INVESTOR_FORM.sede,
};

/** Founder side: the sample startup (editable core), its investor matches and proposals within the monthly limit. */
export function useFounderDemo(initial: StartupCore = DEMO_STARTUP_CORE) {
  const { locale, t, f } = useI18n();
  const [core, setCore] = useState<StartupCore>(initial);
  const [proposals, setProposals] = useState<Proposals>(() => createProposals(monthKey(new Date())));
  const startup = useMemo(
    () =>
      ownStartup(
        core,
        { nome: EXAMPLE_STARTUP_FORM.nome, founder: EXAMPLE_STARTUP_FORM.founder, oneLiner: t.matchDemo.exampleDescription },
        locale,
      ),
    [core, locale, t],
  );
  const result = useMemo(() => matchInvestors(startup, demoInvestors(locale), locale), [startup, locale]);
  const L = labelsFor(locale);
  return {
    core,
    setCore,
    startup,
    matches: result.matches,
    excluded: result.excluded,
    proposals,
    propose: (id: string) => setProposals((p) => propose(p, id, locale)),
    /** One-line description of the sample profile. */
    profileLine: t.variants.founderProfile(L.settore[core.settore], L.fase[core.fase], L.regione[core.regione], f.euro(core.round)),
  };
}

/** Investor side: the sample thesis, matching startups (anonymous until intro) and the local opt-in board. */
export function useInvestorDemo(thesis: Thesis = DEMO_THESIS) {
  const { locale, t, f } = useI18n();
  const [board, setBoard] = useState<Board>({});
  const investor = useMemo(() => ownInvestor(thesis, { nome: EXAMPLE_INVESTOR_FORM.nome, referente: EXAMPLE_INVESTOR_FORM.referente }, locale), [thesis, locale]);
  const result = useMemo(() => matchStartups(investor, demoStartups(locale), locale), [investor, locale]);
  const L = labelsFor(locale);
  const ids = result.matches.map((m) => m.item.id);
  return {
    investor,
    matches: result.matches,
    excluded: result.excluded,
    board,
    counts: bucketCounts(board, ids),
    send: (id: string, event: OptInEvent) => setBoard((b) => apply(b, id, event)),
    interested: (id: string) => setBoard((b) => apply(b, id, 'INVESTOR_YES')),
    pass: (id: string) => setBoard((b) => apply(b, id, 'INVESTOR_NO')),
    simulateReply: (id: string) => setBoard((b) => simulateReply(b, id)),
    reset: () => setBoard({}),
    thesisLine: t.variants.investorThesis(
      thesis.settori.map((s) => L.settore[s]).join(', '),
      thesis.fasi.map((x) => L.fase[x]).join(', '),
      `${f.euro(thesis.ticketMin)}–${f.euro(thesis.ticketMax)}`,
    ),
  };
}
