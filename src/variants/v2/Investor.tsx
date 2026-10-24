// V2 Dashboard: investor view — thesis filters, bucket tabs with counters, sortable anonymous teaser table.
import { Fragment, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n/context';
import type { Ranked } from '../../lib/matching';
import { teaserOf } from '../../lib/optin';
import { labelsFor, type StartupProfile } from '../../lib/matchTaxonomy';
import { bucketOf, demoReply, investorStatus, stateOf } from '../logic/board';
import {
  filterStartupMatches,
  nextRow,
  NO_STARTUP_FILTERS,
  sortRows,
  startupSortValue,
  toggleSort,
  toggleValue,
  type SortState,
  type StartupFilters,
  type StartupSortKey,
} from '../logic/table';
import { DEMO_THESIS, useInvestorDemo } from '../shared/useDemo';
import { BUCKET_TABS, inTab, rowShortcut, type BucketTab } from './dash';
import { Eyebrow, KeyLegend, PartsBreakdown, PartsLegend, ScoreCell, SortTh, StatusLine } from './parts';
import { useRovingRows } from './hooks';

export function Investor() {
  const { t, locale } = useI18n();
  const c = t.variants.v2.common;
  const v = t.variants.v2.investor;
  const A = t.variants.actions;
  const L = labelsFor(locale);
  const demo = useInvestorDemo();
  const { board, matches, counts } = demo;

  const [filters, setFilters] = useState<StartupFilters>(NO_STARTUP_FILTERS);
  const [sort, setSort] = useState<SortState<StartupSortKey>>({
    key: 'score',
    dir: 'desc',
  });
  const [tab, setTab] = useState<BucketTab>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState('');

  const rankOf = useMemo(() => new Map(matches.map((m, i) => [m.item.id, i + 1])), [matches]);
  const filtered = useMemo(() => filterStartupMatches(matches, filters), [matches, filters]);
  const rows = useMemo(
    () =>
      sortRows(
        filtered.filter((m) => inTab(board, m.item.id, tab)),
        (x) => startupSortValue(x, sort.key),
        sort.dir,
      ),
    [filtered, board, tab, sort],
  );
  const roving = useRovingRows(rows.length);

  const colLabels: Record<StartupSortKey, string> = {
    score: v.cols.score,
    settore: v.cols.settore,
    fase: v.cols.fase,
    regione: v.cols.regione,
    round: v.cols.round,
  };
  const tabLabel = (b: BucketTab) => (b === 'all' ? v.all : t.variants.buckets[b]);
  const tabCount = (b: BucketTab) => (b === 'all' ? matches.length : counts[b]);
  const rowLabel = (s: StartupProfile) => {
    const tz = teaserOf(s, locale);
    return t.match.ui.investor.startupTitle(tz.settore, tz.regione);
  };

  const onSort = (key: StartupSortKey) => {
    const next = toggleSort(sort, key, key === 'settore' || key === 'regione' ? 'asc' : 'desc');
    setSort(next);
    setMsg(c.sorted(colLabels[key], next.dir === 'asc' ? c.asc : c.desc));
  };
  const updateFilters = (next: StartupFilters) => {
    setFilters(next);
    setMsg(c.filtersChanged(filterStartupMatches(matches, next).filter((m) => inTab(board, m.item.id, tab)).length));
  };
  const chooseTab = (b: BucketTab) => {
    setTab(b);
    roving.setActive(0);
    setMsg(v.announce.tab(tabLabel(b), filtered.filter((m) => inTab(board, m.item.id, b)).length));
  };

  const interested = (s: StartupProfile) => {
    if (stateOf(board, s.id) !== 'proposta') return;
    demo.interested(s.id);
    setMsg(v.announce.interested(rowLabel(s)));
    roving.refocus(rows.findIndex((r) => r.item.id === s.id));
  };
  const pass = (s: StartupProfile) => {
    if (stateOf(board, s.id) !== 'proposta') return;
    demo.pass(s.id);
    setMsg(v.announce.passed(rowLabel(s)));
    roving.refocus(rows.findIndex((r) => r.item.id === s.id));
  };
  const simulate = (s: StartupProfile) => {
    demo.simulateReply(s.id);
    // Same deterministic answer the hook applies. A decline must look like no answer: only an intro gets its own message.
    const accepted = stateOf(board, s.id) === 'attesa-startup' && demoReply(s.id) === 'STARTUP_YES';
    setMsg(accepted ? v.announce.intro(t.variants.introReveal(s.nome, s.founder)) : v.announce.waiting(rowLabel(s)));
    if (accepted) roving.refocus(rows.findIndex((r) => r.item.id === s.id));
  };

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, i: number, row: Ranked<StartupProfile>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const n = nextRow(i, rows.length, e.key);
    if (n !== null) {
      e.preventDefault();
      roving.focusRow(n);
      return;
    }
    const sc = rowShortcut(e.key);
    if (!sc) return;
    if (sc === 'toggle') {
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
      toggle(row.item.id);
      return;
    }
    e.preventDefault();
    if (sc === 'interested') interested(row.item);
    else pass(row.item);
  };

  const anySent = counts.inviato + counts.intro > 0;

  return (
    <div className="v2-page">
      <header className="v2-head">
        <div>
          <Eyebrow>{v.eyebrow}</Eyebrow>
          <h1 id="page-title" tabIndex={-1} className="v2-h1">
            {v.title}
          </h1>
          <p className="v2-sub">{demo.thesisLine}</p>
        </div>
        <StatusLine message={msg} />
      </header>

      <div className="v2-layout">
        <aside className="v2-side">
          <section className="v2-panel" aria-labelledby="v2-filt-h">
            <div className="v2-panel-row">
              <h2 id="v2-filt-h" className="v2-panel-h">
                {c.filtersTitle}
              </h2>
              <button type="button" className="v2-link-btn" onClick={() => updateFilters(NO_STARTUP_FILTERS)}>
                {c.resetFilters}
              </button>
            </div>
            <fieldset className="v2-checks">
              <legend>{t.match.ui.investor.settori}</legend>
              {DEMO_THESIS.settori.map((s) => (
                <label key={s}>
                  <input
                    type="checkbox"
                    checked={filters.settori.includes(s)}
                    onChange={() =>
                      updateFilters({
                        ...filters,
                        settori: toggleValue(filters.settori, s),
                      })
                    }
                  />
                  <span>{L.settore[s]}</span>
                  <span className="v2-count v2-num">{matches.filter((m) => m.item.settore === s).length}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="v2-checks">
              <legend>{t.match.ui.investor.fasi}</legend>
              {DEMO_THESIS.fasi.map((s) => (
                <label key={s}>
                  <input
                    type="checkbox"
                    checked={filters.fasi.includes(s)}
                    onChange={() =>
                      updateFilters({
                        ...filters,
                        fasi: toggleValue(filters.fasi, s),
                      })
                    }
                  />
                  <span>{L.fase[s]}</span>
                  <span className="v2-count v2-num">{matches.filter((m) => m.item.fase === s).length}</span>
                </label>
              ))}
            </fieldset>
            <div className="v2-field">
              <label htmlFor="v2-min">
                {c.minScore} <output className="v2-num">{c.scoreValue(filters.minScore)}</output>
              </label>
              <input
                id="v2-min"
                type="range"
                min={0}
                max={100}
                step={5}
                value={filters.minScore}
                aria-valuetext={c.scoreValue(filters.minScore)}
                style={{ '--fill': `${filters.minScore}%` } as CSSProperties}
                onChange={(e) =>
                  updateFilters({
                    ...filters,
                    minScore: Number(e.target.value),
                  })
                }
              />
            </div>
          </section>
          <KeyLegend
            rows={[
              { keys: ['j', 'k', '↓', '↑'], label: c.keys.move },
              { keys: ['Enter'], label: c.keys.expand },
              { keys: ['i'], label: c.keys.interested },
              { keys: ['p'], label: c.keys.pass },
            ]}
          />
        </aside>

        <div className="v2-main">
          <div className="v2-tabs" role="group" aria-label={v.bucketsLabel}>
            {BUCKET_TABS.map((b) => (
              <button
                key={b}
                type="button"
                className={`v2-tab v2-tab-${b}`}
                aria-pressed={tab === b}
                onClick={() => chooseTab(b)}
              >
                <span className="v2-tab-label">{tabLabel(b)}</span>
                <span className="v2-tab-count v2-num">{tabCount(b)}</span>
              </button>
            ))}
          </div>

          <p className="v2-note v2-note-neutral">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="v2-lock">
              <rect x="2.5" y="6" width="9" height="6.5" rx="1.2" fill="currentColor" />
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            {t.match.ui.investor.anonymousNote}
          </p>
          {anySent && <p className="v2-note">{t.variants.replyNote}</p>}

          <div className="v2-toolbar">
            <PartsLegend />
            <span className="v2-toolbar-end">
              <span className="v2-muted v2-num">{c.shown(rows.length, matches.length)}</span>
              <button
                type="button"
                className="v2-link-btn"
                onClick={() => {
                  demo.reset();
                  setOpen({});
                  setMsg(v.announce.reset);
                }}
              >
                {A.restart}
              </button>
            </span>
          </div>

          <div className="v2-scroll" tabIndex={0}>
            <table className="v2-table v2-table-investor">
              <caption className="sr-only">{v.caption}</caption>
              <thead>
                <tr>
                  <th scope="col" className="v2-c-rank">
                    {v.cols.rank}
                  </th>
                  <SortTh label={v.cols.settore} col="settore" sort={sort} onSort={onSort} />
                  <SortTh label={v.cols.fase} col="fase" sort={sort} onSort={onSort} />
                  <SortTh label={v.cols.regione} col="regione" sort={sort} onSort={onSort} />
                  <SortTh label={v.cols.round} col="round" sort={sort} onSort={onSort} className="v2-c-num" />
                  <SortTh label={v.cols.score} col="score" sort={sort} onSort={onSort} className="v2-c-score" />
                  <th scope="col" className="v2-c-pitch">
                    {v.cols.oneLiner}
                  </th>
                  <th scope="col" className="v2-c-status">
                    {v.cols.status}
                  </th>
                  <th scope="col" className="v2-c-act">
                    {v.cols.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="v2-empty">
                      {matches.length === 0 ? t.match.ui.investor.empty : c.noRows}
                    </td>
                  </tr>
                )}
                {rows.map((row, i) => {
                  const s = row.item;
                  const tz = teaserOf(s, locale);
                  const label = rowLabel(s);
                  const st = stateOf(board, s.id);
                  const bucket = bucketOf(board, s.id);
                  const view = investorStatus(board, s.id, locale);
                  const isOpen = !!open[s.id];
                  const detailId = `v2-d-${s.id}`;
                  return (
                    <Fragment key={s.id}>
                      <tr
                        ref={roving.refFor(i)}
                        className={`v2-row v2-row-${bucket}${isOpen ? ' is-open' : ''}`}
                        tabIndex={i === roving.idx ? 0 : -1}
                        aria-label={label}
                        onFocus={() => roving.setActive(i)}
                        onKeyDown={(e) => onRowKey(e, i, row)}
                      >
                        <td className="v2-c-rank v2-num">
                          <button
                            type="button"
                            className="v2-expander"
                            tabIndex={-1}
                            aria-expanded={isOpen}
                            aria-controls={detailId}
                            aria-label={isOpen ? c.collapse(label) : c.expand(label)}
                            onClick={() => toggle(s.id)}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                              <path d="M3 1.5 7 5l-4 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                            </svg>
                          </button>
                          {rankOf.get(s.id)}
                        </td>
                        <td className="v2-name">{tz.settore}</td>
                        <td className="v2-nowrap">{tz.fase}</td>
                        <td>{tz.regione}</td>
                        <td className="v2-c-num v2-num">{tz.importo}</td>
                        <td className="v2-c-score">
                          <ScoreCell evaluation={row.evaluation} />
                        </td>
                        <td className="v2-c-pitch">
                          {st === 'intro' && <strong className="v2-reveal">{t.variants.introReveal(s.nome, s.founder)}</strong>}
                          <span className="v2-pitch">{tz.oneLiner}</span>
                        </td>
                        <td className="v2-c-status">
                          <span className={`v2-state v2-state-${bucket}`}>{view.titolo}</span>
                        </td>
                        <td className="v2-c-act">
                          {st === 'proposta' && (
                            <span className="v2-actions">
                              <button
                                type="button"
                                className="v2-btn v2-btn-primary v2-btn-sm"
                                aria-label={c.actionFor(A.interested, label)}
                                aria-keyshortcuts="i"
                                onClick={() => interested(s)}
                              >
                                {A.interested}
                              </button>
                              <button
                                type="button"
                                className="v2-btn v2-btn-sm"
                                aria-label={c.actionFor(A.pass, label)}
                                aria-keyshortcuts="p"
                                onClick={() => pass(s)}
                              >
                                {A.pass}
                              </button>
                            </span>
                          )}
                          {bucket === 'inviato' && (
                            <button
                              type="button"
                              className="v2-btn v2-btn-sm v2-btn-ghost"
                              aria-label={c.actionFor(A.simulateReply, label)}
                              onClick={() => simulate(s)}
                            >
                              {A.simulateReply}
                            </button>
                          )}
                          {bucket === 'passato' && <span className="v2-muted v2-small">{t.variants.passNote}</span>}
                        </td>
                      </tr>
                      <tr id={detailId} className="v2-detail" hidden={!isOpen}>
                        <td colSpan={9}>
                          <div className="v2-detail-grid">
                            <div>
                              <p className="v2-detail-h">{t.match.ui.reasonsLabel}</p>
                              <ul className="v2-reasons">
                                {row.evaluation.reasons.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                              <p className="v2-detail-h">{view.titolo}</p>
                              <p className="v2-thesis">{view.testo}</p>
                            </div>
                            <PartsBreakdown evaluation={row.evaluation} />
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
