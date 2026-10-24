// Shared state of the round-3 mock screens of every variant (double opt-in inbox, teaser one-pager). In memory only.
import { useMemo, useState } from 'react';
import { demoInvestors, demoStartups } from '../../data/matchDemo';
import { useI18n } from '../../i18n/context';
import { buildStartupDoc } from '../../lib/exportDoc';
import type { InboxRole } from '../../lib/inbox';
import { labelsFor } from '../../lib/matchTaxonomy';
import { mockInbox, mockRows, type MockRow } from '../logic/inboxMock';
import { DEMO_STARTUP_CORE, useFounderDemo } from './useDemo';

/** One row of the inbox, ready to render. Founder rows carry only what the founder may see (no declined state). */
export interface RequestItem extends MockRow {
  /** Investor name (founder tab), or the startup's name after the intro, else the anonymous label. */
  title: string;
  /** Investor type (founder tab) or the teaser line (investor tab). */
  detail: string;
  label: string;
  /** "expires in n days" while pending, else null. */
  due: string | null;
}

/** The mock inbox: tab state and the rows of both sides, from the real inbox rules and the real matches. */
export function useRequestsMock() {
  const { locale, t, f, path } = useI18n();
  const c = t.variants.requestsMock;
  const L = labelsFor(locale);
  const demo = useFounderDemo();
  const [tab, setTab] = useState<InboxRole>('founder');
  const [now] = useState(() => Date.now());
  const investors = useMemo(() => new Map(demoInvestors(locale).map((i) => [i.id, i])), [locale]);
  const startups = useMemo(() => demoStartups(locale), [locale]);
  const byStartup = useMemo(() => new Map(startups.map((s) => [s.id, s])), [startups]);
  const matchIds = demo.matches.slice(0, 5).map((m) => m.item.id);
  const store = useMemo(() => mockInbox(matchIds, startups.map((s) => s.id), now), [matchIds.join(), startups, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const founder: RequestItem[] = mockRows(store, 'founder', now).map((r) => {
    const i = investors.get(r.counterpartId)!;
    return { ...r, title: i.nome, detail: L.tipo[i.tipo], label: c.status[r.status], due: r.daysLeft ? c.daysLeft(r.daysLeft) : null };
  });
  const investor: RequestItem[] = mockRows(store, 'investor', now).map((r) => {
    const s = byStartup.get(r.counterpartId)!;
    return {
      ...r,
      title: r.knowsName ? s.nome : c.anonymous,
      detail: `${L.settore[s.settore]} · ${L.fase[s.fase]} · ${L.regione[s.regione]} · ${f.euro(s.round)}`,
      label: c.investorStatus[r.status],
      due: r.daysLeft ? c.daysLeft(r.daysLeft) : null,
    };
  });
  return {
    tab,
    setTab,
    tabs: (['founder', 'investor'] as const).map((id) => ({ id, label: c.tabs[id], count: (id === 'founder' ? founder : investor).length })),
    rows: tab === 'founder' ? founder : investor,
    note: tab === 'founder' ? c.founderNote : c.investorNote,
    profileLine: demo.profileLine,
    realHref: path('matchRequests'),
  };
}

/** The teaser one-pager of the sample startup, built by the real export (anonymous: no name, no deck text). */
export function useExportMock() {
  const { locale, t, path } = useI18n();
  const [now] = useState(() => Date.now());
  const doc = useMemo(
    () =>
      buildStartupDoc(
        { source: 'form', core: DEMO_STARTUP_CORE, oneLiner: t.matchDemo.exampleDescription, team: 4, traction: [] },
        { variant: 'teaser', locale, now, investors: demoInvestors(locale) },
      ),
    [locale, now, t],
  );
  return { doc, realHref: path('matchExport') };
}
