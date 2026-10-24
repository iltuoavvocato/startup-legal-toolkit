// V2 Dashboard: founder results — profile + filters sidebar, KPI strip, sortable investor table, excluded table.
import { Fragment, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n/context';
import type { Ranked } from '../../lib/matching';
import { MONTHLY_PROPOSAL_LIMIT } from '../../lib/optin';
import {
  FASI,
  labelsFor,
  REGIONI,
  SETTORI,
  TIPI_INVESTITORE,
  type Investor,
  type TipoInvestitore,
} from '../../lib/matchTaxonomy';
import { isSent, left } from '../logic/proposals';
import {
  filterInvestorMatches,
  investorSortValue,
  nextRow,
  NO_INVESTOR_FILTERS,
  sortRows,
  toggleSort,
  toggleValue,
  type InvestorFilters,
  type InvestorSortKey,
  type SortState,
} from '../logic/table';
import { useFounderDemo } from '../shared/useDemo';
import { avgScore, parseAmount, rowShortcut } from './dash';
import { BandChip, Eyebrow, KeyLegend, Kpi, PartsBreakdown, PartsLegend, ScoreCell, SortTh, StatusLine } from './parts';
import { useRovingRows, useSlashFocus } from './hooks';

export function Results() {
  const { t, f, locale } = useI18n();
  const c = t.variants.v2.common;
  const r = t.variants.v2.results;
  const S = t.match.ui.startup;
  const L = labelsFor(locale);
  const demo = useFounderDemo();
  const { core, setCore, matches, excluded, proposals } = demo;

  const [filters, setFilters] = useState<InvestorFilters>(NO_INVESTOR_FILTERS);
  const [sort, setSort] = useState<SortState<InvestorSortKey>>({
    key: 'score',
    dir: 'desc',
  });
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // 'recompute' is resolved at render time, once the engine has re-ranked the investors.
  const [msgState, setMsg] = useState<string | { recompute: true }>('');
  const msg = typeof msgState === 'string' ? msgState : r.recomputed(matches.length);
  const [roundText, setRoundText] = useState(String(core.round));
  const roundOk = parseAmount(roundText) !== null;
  const searchRef = useRef<HTMLInputElement>(null);
  useSlashFocus(searchRef);

  const rankOf = useMemo(() => new Map(matches.map((m, i) => [m.item.id, i + 1])), [matches]);
  const rows = useMemo(
    () => sortRows(filterInvestorMatches(matches, filters), (x) => investorSortValue(x, sort.key), sort.dir),
    [matches, filters, sort],
  );
  const roving = useRovingRows(rows.length);
  const remainingProposals = left(proposals);

  const colLabels: Record<InvestorSortKey, string> = {
    score: r.cols.score,
    nome: r.cols.nome,
    tipo: r.cols.tipo,
    ticket: r.cols.ticket,
    settore: t.match.ui.explainer.rows.settore,
    fase: t.match.ui.explainer.rows.fase,
    area: t.match.ui.explainer.rows.area,
  };

  const onSort = (key: InvestorSortKey) => {
    const next = toggleSort(sort, key, key === 'nome' || key === 'tipo' ? 'asc' : 'desc');
    setSort(next);
    setMsg(c.sorted(colLabels[key], next.dir === 'asc' ? c.asc : c.desc));
  };

  const updateFilters = (next: InvestorFilters) => {
    setFilters(next);
    setMsg(c.filtersChanged(filterInvestorMatches(matches, next).length));
  };

  const changeCore = (patch: Partial<typeof core>) => {
    setCore({ ...core, ...patch });
    setOpen({});
    setMsg({ recompute: true });
  };

  const toggle = (row: Ranked<Investor>) => setOpen((o) => ({ ...o, [row.item.id]: !o[row.item.id] }));

  const doPropose = (row: Ranked<Investor>) => {
    if (isSent(proposals, row.item.id)) return;
    if (remainingProposals <= 0) {
      setMsg(t.match.optin.limitReached(MONTHLY_PROPOSAL_LIMIT));
    } else {
      setMsg(S.proposalSent(row.item.nome, remainingProposals - 1));
    }
    demo.propose(row.item.id);
  };

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, i: number, row: Ranked<Investor>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const n = nextRow(i, rows.length, e.key);
    if (n !== null) {
      e.preventDefault();
      roving.focusRow(n);
      return;
    }
    if (e.target === e.currentTarget && rowShortcut(e.key) === 'toggle') {
      e.preventDefault();
      toggle(row);
    }
  };

  const anySent = proposals.sent.length > 0;
  const tipoCounts = useMemo(() => {
    const m = new Map<TipoInvestitore, number>();
    for (const x of matches) m.set(x.item.tipo, (m.get(x.item.tipo) ?? 0) + 1);
    return m;
  }, [matches]);

  return (
    <div className="v2-page">
      <header className="v2-head">
        <div>
          <Eyebrow>{r.eyebrow}</Eyebrow>
          <h1 id="page-title" tabIndex={-1} className="v2-h1">
            {r.title}
          </h1>
          <p className="v2-sub">{demo.profileLine}</p>
        </div>
        <StatusLine message={msg} />
      </header>

      <div className="v2-layout">
        <aside className="v2-side">
          <section className="v2-panel" aria-labelledby="v2-prof-h">
            <h2 id="v2-prof-h" className="v2-panel-h">
              {r.profileTitle}
            </h2>
            <p className="v2-hint">{r.profileHint}</p>
            <div className="v2-fields">
              <label className="v2-field">
                <span>{S.settore}</span>
                <select
                  value={core.settore}
                  onChange={(e) =>
                    changeCore({
                      settore: e.target.value as typeof core.settore,
                    })
                  }
                >
                  {SETTORI.map((s) => (
                    <option key={s} value={s}>
                      {L.settore[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="v2-field">
                <span>{S.fase}</span>
                <select value={core.fase} onChange={(e) => changeCore({ fase: e.target.value as typeof core.fase })}>
                  {FASI.map((s) => (
                    <option key={s} value={s}>
                      {L.fase[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="v2-field">
                <span>{S.regione}</span>
                <select
                  value={core.regione}
                  onChange={(e) =>
                    changeCore({
                      regione: e.target.value as typeof core.regione,
                    })
                  }
                >
                  {REGIONI.map((s) => (
                    <option key={s} value={s}>
                      {L.regione[s]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="v2-field">
                <label htmlFor="v2-round">{S.round}</label>
                <div className="v2-euro">
                  <span aria-hidden="true">€</span>
                  <input
                    id="v2-round"
                    inputMode="numeric"
                    autoComplete="off"
                    value={roundText}
                    aria-invalid={!roundOk}
                    aria-describedby={roundOk ? undefined : 'v2-round-err'}
                    onChange={(e) => {
                      setRoundText(e.target.value);
                      const n = parseAmount(e.target.value);
                      if (n !== null) changeCore({ round: n });
                    }}
                  />
                </div>
                {roundOk ? (
                  <span className="v2-hint v2-num">{f.euro(core.round)}</span>
                ) : (
                  <span id="v2-round-err" className="v2-err">
                    {r.roundInvalid}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="v2-panel" aria-labelledby="v2-filt-h">
            <div className="v2-panel-row">
              <h2 id="v2-filt-h" className="v2-panel-h">
                {c.filtersTitle}
              </h2>
              <button type="button" className="v2-link-btn" onClick={() => updateFilters(NO_INVESTOR_FILTERS)}>
                {c.resetFilters}
              </button>
            </div>
            <div className="v2-field">
              <label htmlFor="v2-search">{r.search}</label>
              <div className="v2-search">
                <input
                  id="v2-search"
                  ref={searchRef}
                  type="search"
                  value={filters.query}
                  placeholder={r.searchHint}
                  aria-keyshortcuts="/"
                  onChange={(e) => updateFilters({ ...filters, query: e.target.value })}
                />
                <kbd aria-hidden="true">/</kbd>
              </div>
            </div>
            <fieldset className="v2-checks">
              <legend>{r.tipi}</legend>
              {TIPI_INVESTITORE.map((tipo) => (
                <label key={tipo}>
                  <input
                    type="checkbox"
                    checked={filters.tipi.includes(tipo)}
                    onChange={() =>
                      updateFilters({
                        ...filters,
                        tipi: toggleValue(filters.tipi, tipo),
                      })
                    }
                  />
                  <span>{L.tipo[tipo]}</span>
                  <span className="v2-count v2-num">{tipoCounts.get(tipo) ?? 0}</span>
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
              { keys: ['Home', 'End'], label: c.keys.homeEnd },
              { keys: ['Enter'], label: c.keys.expand },
              { keys: ['/'], label: c.keys.search },
            ]}
          />
        </aside>

        <div className="v2-main">
          <dl className="v2-kpis">
            <Kpi label={r.kpis.matches} value={rows.length} sub={r.kpiOf(matches.length)} />
            <Kpi label={r.kpis.excluded} value={excluded.length} />
            <Kpi label={r.kpis.avg} value={avgScore(rows)} sub="/100" />
            <Kpi label={r.kpis.left} value={remainingProposals} sub={r.kpiOf(MONTHLY_PROPOSAL_LIMIT)}>
              <span className="v2-meter" aria-hidden="true">
                <span
                  style={{
                    width: `${(proposals.counter.used / MONTHLY_PROPOSAL_LIMIT) * 100}%`,
                  }}
                />
              </span>
              <span className="v2-kpi-note">{t.match.ui.counter.provisional}</span>
            </Kpi>
          </dl>

          {anySent && (
            <div className="v2-note v2-note-neutral">
              <strong>{t.match.optin.neutralStartup.titolo}</strong> {t.match.optin.neutralStartup.testo}
            </div>
          )}
          {proposals.error && <p className="v2-note v2-note-warn">{proposals.error}</p>}

          <div className="v2-toolbar">
            <PartsLegend />
            <span className="v2-muted v2-num">{c.shown(rows.length, matches.length)}</span>
          </div>

          <div className="v2-scroll" tabIndex={0}>
            <table className="v2-table v2-table-founder">
              <caption className="sr-only">{r.caption}</caption>
              <thead>
                <tr>
                  <th scope="col" className="v2-c-rank">
                    {r.cols.rank}
                  </th>
                  <SortTh label={r.cols.nome} col="nome" sort={sort} onSort={onSort} />
                  <SortTh label={r.cols.tipo} col="tipo" sort={sort} onSort={onSort} />
                  <SortTh label={r.cols.ticket} col="ticket" sort={sort} onSort={onSort} className="v2-c-num" />
                  <SortTh label={r.cols.score} col="score" sort={sort} onSort={onSort} className="v2-c-score" />
                  <th scope="col">{r.cols.band}</th>
                  <th scope="col" className="v2-c-act">
                    {r.cols.action}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="v2-empty">
                      {matches.length === 0 ? S.empty : c.noRows}
                    </td>
                  </tr>
                )}
                {rows.map((row, i) => {
                  const id = row.item.id;
                  const isOpen = !!open[id];
                  const sent = isSent(proposals, id);
                  const detailId = `v2-d-${id}`;
                  return (
                    <Fragment key={id}>
                      <tr
                        ref={roving.refFor(i)}
                        className={`v2-row${isOpen ? ' is-open' : ''}`}
                        tabIndex={i === roving.idx ? 0 : -1}
                        onFocus={() => roving.setActive(i)}
                        onKeyDown={(e) => onRowKey(e, i, row)}
                      >
                        <td className="v2-c-rank v2-num">{rankOf.get(id)}</td>
                        <td>
                          <button
                            type="button"
                            className="v2-expander"
                            tabIndex={-1}
                            aria-expanded={isOpen}
                            aria-controls={detailId}
                            aria-label={isOpen ? c.collapse(row.item.nome) : c.expand(row.item.nome)}
                            onClick={() => toggle(row)}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                              <path d="M3 1.5 7 5l-4 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                            </svg>
                          </button>
                          <span className="v2-name">{row.item.nome}</span>
                        </td>
                        <td>{L.tipo[row.item.tipo]}</td>
                        <td className="v2-c-num v2-num">
                          {f.euro(row.item.ticketMin)}–{f.euro(row.item.ticketMax)}
                        </td>
                        <td className="v2-c-score">
                          <ScoreCell evaluation={row.evaluation} />
                        </td>
                        <td>
                          <BandChip score={row.evaluation.score} />
                        </td>
                        <td className="v2-c-act">
                          {sent ? (
                            <span className="v2-sent">
                              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                                <path d="m2 6.5 2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                              </svg>
                              {t.variants.actions.proposed}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="v2-btn v2-btn-primary v2-btn-sm"
                              aria-disabled={remainingProposals <= 0}
                              onClick={() => doPropose(row)}
                            >
                              {S.propose}
                              <span className="sr-only">{S.proposeSr(row.item.nome)}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                      <tr id={detailId} className="v2-detail" hidden={!isOpen}>
                        <td colSpan={7}>
                          <div className="v2-detail-grid">
                            <div>
                              <p className="v2-detail-h">{t.match.ui.reasonsLabel}</p>
                              <ul className="v2-reasons">
                                {row.evaluation.reasons.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                              <p className="v2-detail-h">{r.thesis}</p>
                              <p className="v2-thesis">{row.item.tesi}</p>
                              {sent && (
                                <p className="v2-thesis">
                                  <strong>{t.match.optin.neutralStartup.titolo}.</strong> {t.match.optin.neutralStartup.testo}
                                </p>
                              )}
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

          <section className="v2-excluded" aria-labelledby="v2-exc-h">
            <h2 id="v2-exc-h" className="v2-h2">
              {t.match.ui.excluded.investors(excluded.length)}
            </h2>
            <div className="v2-scroll" tabIndex={0}>
              <table className="v2-table v2-table-excluded">
                <caption className="sr-only">{r.excludedCaption}</caption>
                <thead>
                  <tr>
                    <th scope="col">{r.excludedCols.nome}</th>
                    <th scope="col">{r.excludedCols.tipo}</th>
                    <th scope="col">{r.excludedCols.failed}</th>
                    <th scope="col">{r.excludedCols.why}</th>
                  </tr>
                </thead>
                <tbody>
                  {excluded.map((x) => (
                    <tr key={x.item.id}>
                      <td className="v2-name">{x.item.nome}</td>
                      <td>{L.tipo[x.item.tipo]}</td>
                      <td>
                        <span className="v2-tags">
                          {x.evaluation.failed.map((fid) => (
                            <span key={fid} className="v2-tag">
                              {r.filterNames[fid]}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td>
                        <ul className="v2-why">
                          {x.evaluation.whyNot.map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
