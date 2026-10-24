import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { EuroField } from '../components/match/EuroField';
import { FictionalNotice } from '../components/match/FictionalNotice';
import { LegalLimits } from '../components/match/LegalLimits';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { SelectField } from '../components/match/SelectField';
import { useInbox } from '../components/match/useInbox';
import { demoInvestors } from '../data/matchDemo';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useI18n } from '../i18n/context';
import {
  activeFilters,
  browseInvestors,
  clearFilters,
  DIRECTORY_SORTS,
  effectiveSort,
  emptySuggestions,
  filterLabel,
  filtersFromQuery,
  filtersToQuery,
  isReversed,
  profileSummary,
  rangeText,
  withoutFilter,
  type DirectoryEntry,
  type DirectoryFilters,
} from '../lib/directory';
import { activeProposal } from '../lib/inbox';
import { scoreBand } from '../lib/matching';
import { ownStartup } from '../lib/matchQuery';
import { FASI, labelsFor, optionsOf, REGIONI, SETTORI, TIPI_INVESTITORE } from '../lib/matchTaxonomy';

export function MatchDirectoryPage() {
  const { locale, t, path } = useI18n();
  const d = t.directory.dir;
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromQuery(params), [params]);
  const { store, now } = useInbox();
  const profile = store.profile ? ownStartup(store.profile, undefined, locale) : null;
  const investors = demoInvestors(locale);
  const entries = browseInvestors(investors, filters, profile, locale);
  const active = activeFilters(filters);
  const isPhone = useMediaQuery('(max-width: 899px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const id = useId();

  // Selects, chips and "Azzera filtri" add a history entry (the back button undoes them); typing replaces it.
  const apply = (next: DirectoryFilters, replace = false) => {
    setParams(filtersToQuery(next), { replace, preventScrollReset: true });
  };

  const sortOptions = DIRECTORY_SORTS.filter((s) => s !== 'affinita' || profile).map((s) => ({ value: s, label: d.sorts[s] }));
  const sort = effectiveSort(filters.sort, profile !== null);

  const panel = (
    <FilterPanel
      idPrefix={id}
      filters={filters}
      onChange={apply}
    />
  );

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={d.eyebrow} title={d.title}>
        <p>{d.lead}</p>
      </PageHero>

      <section className="section-cream tool-section">
        <div className="container">
          <FictionalNotice />

          <div className="mi-dir-profile">
            {profile ? (
              <p>
                {d.profileOn(profileSummary(profile, locale))}{' '}
                <Link to={path('matchRequests')}>{d.requestsLink}</Link>
              </p>
            ) : (
              <p>
                {d.profileOff}{' '}
                <Link to={path('matchAgentStartup')}>{d.profileAgent}</Link>
                {' · '}
                <Link to={path('matchStartup')}>{d.profileForm}</Link>
              </p>
            )}
          </div>

          <div className="mi-dir-layout">
            {!isPhone && (
              <aside className="card mi-dir-filters" aria-labelledby={`${id}-filters`}>
                <h2 className="card-title" id={`${id}-filters`}>
                  {d.filtersTitle}
                </h2>
                {panel}
              </aside>
            )}

            <div className="mi-dir-main">
              <div className="mi-dir-toolbar">
                <SearchBox
                  id={`${id}-q`}
                  value={filters.q}
                  onChange={(q) => apply({ ...filters, q }, true)}
                />
                <div className="mi-dir-toolbar-row">
                  {isPhone && (
                    <button type="button" className="btn btn-outline mi-dir-open" aria-haspopup="dialog" onClick={() => setDrawerOpen(true)}>
                      <FilterIcon />
                      {d.openFilters}
                      {active.filter((k) => k !== 'q').length > 0 && (
                        <span className="mi-dir-count-badge">{active.filter((k) => k !== 'q').length}</span>
                      )}
                    </button>
                  )}
                  <SelectField
                    id={`${id}-sort`}
                    label={d.sort}
                    value={sort}
                    options={sortOptions}
                    onChange={(v) => apply({ ...filters, sort: v as DirectoryFilters['sort'] })}
                  />
                </div>
              </div>

              <div className="mi-dir-status">
                <p className="mi-dir-count" role="status">
                  {d.count(entries.length, investors.length)}
                </p>
                {active.length > 0 && (
                  <button type="button" className="btn btn-text mi-dir-clear" onClick={() => apply(clearFilters(filters))}>
                    {d.clearAll}
                  </button>
                )}
              </div>

              {active.length > 0 && (
                <ul className="mi-dir-chips" aria-label={d.filtersTitle}>
                  {active.map((key) => (
                    <li key={key}>
                      <button type="button" className="mi-dir-chip" onClick={() => apply(withoutFilter(filters, key))}>
                        <span>{filterLabel(key, filters, locale)}</span>
                        <span aria-hidden="true">×</span>
                        <span className="sr-only">{d.remove(filterLabel(key, filters, locale))}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {entries.length > 0 ? (
                <ul className="mi-dir-grid" aria-label={d.listLabel}>
                  {entries.map((e) => (
                    <li key={e.investor.id}>
                      <InvestorCard entry={e} sent={Boolean(activeProposal(store, e.investor.id, now))} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="card mi-dir-empty">
                  <h2 className="card-title">{d.emptyTitle}</h2>
                  <EmptySuggestions filters={filters} onApply={apply} />
                </div>
              )}
            </div>
          </div>

          <LegalLimits headingId={`${id}-limits`} />
          <Disclaimer />
          <CtaPanel campaign="match" title={t.match.ui.landing.ctaTitle} text={t.match.ui.landing.ctaText} />
        </div>
      </section>

      {isPhone && (
        <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} count={entries.length}>
          {panel}
        </FilterDrawer>
      )}
    </>
  );
}

function EmptySuggestions({ filters, onApply }: { filters: DirectoryFilters; onApply: (f: DirectoryFilters) => void }) {
  const { locale, t } = useI18n();
  const d = t.directory.dir;
  const suggestions = emptySuggestions(demoInvestors(locale), filters, locale);
  return (
    <>
      {suggestions.length ? (
        <>
          <p>{d.emptyText}</p>
          <ul className="mi-dir-suggest">
            {suggestions.map((s) => (
              <li key={s.key}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => onApply(withoutFilter(filters, s.key))}>
                  {d.emptyRemove(filterLabel(s.key, filters, locale), s.count)}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>{d.emptyNoSuggestion}</p>
      )}
      <div className="actions">
        <button type="button" className="btn btn-navy" onClick={() => onApply(clearFilters(filters))}>
          {d.clearAll}
        </button>
      </div>
    </>
  );
}

function SearchBox({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const d = t.directory.dir;
  // Local draft so typing stays smooth; it follows the URL when that changes (back button, chips, "Azzera filtri").
  const [draft, setDraft] = useState(value);
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current.trim()) setDraft(value);
    last.current = value;
  }, [value]);
  return (
    <div className="field mi-field mi-dir-search">
      <label htmlFor={id}>{d.searchLabel}</label>
      <div className="mi-dir-search-box">
        <SearchIcon />
        <input
          id={id}
          type="search"
          value={draft}
          maxLength={80}
          placeholder={d.searchPlaceholder}
          autoComplete="off"
          onChange={(e) => {
            setDraft(e.target.value);
            last.current = e.target.value;
            onChange(e.target.value);
          }}
        />
        {draft && (
          <button
            type="button"
            className="mi-dir-search-clear"
            onClick={() => {
              setDraft('');
              last.current = '';
              onChange('');
            }}
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">{d.clearSearch}</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface PanelProps {
  idPrefix: string;
  filters: DirectoryFilters;
  onChange: (f: DirectoryFilters, replace?: boolean) => void;
}

function FilterPanel({ idPrefix, filters, onChange }: PanelProps) {
  const { locale, t } = useI18n();
  const d = t.directory.dir;
  const L = labelsFor(locale);
  const set = (patch: Partial<DirectoryFilters>, replace = false) => onChange({ ...filters, ...patch }, replace);
  return (
    <div className="mi-dir-panel">
      <SelectField
        id={`${idPrefix}-fase`}
        label={d.fase}
        value={filters.fase ?? ''}
        placeholder={locale === 'it' ? d.anyFem : d.any}
        options={optionsOf(FASI, L.fase)}
        onChange={(v) => set({ fase: (v || null) as DirectoryFilters['fase'] })}
      />
      <SelectField
        id={`${idPrefix}-settore`}
        label={d.settore}
        value={filters.settore ?? ''}
        placeholder={d.any}
        options={optionsOf(SETTORI, L.settore)}
        onChange={(v) => set({ settore: (v || null) as DirectoryFilters['settore'] })}
      />
      <SelectField
        id={`${idPrefix}-regione`}
        label={d.regione}
        value={filters.regione ?? ''}
        placeholder={locale === 'it' ? d.anyFem : d.any}
        options={optionsOf(REGIONI, L.regione)}
        hint={d.regioneHint}
        onChange={(v) => set({ regione: (v || null) as DirectoryFilters['regione'] })}
      />
      <SelectField
        id={`${idPrefix}-tipo`}
        label={d.tipo}
        value={filters.tipo ?? ''}
        placeholder={d.any}
        options={optionsOf(TIPI_INVESTITORE, L.tipo)}
        onChange={(v) => set({ tipo: (v || null) as DirectoryFilters['tipo'] })}
      />
      <fieldset className="mi-dir-ticket">
        <legend>{d.ticket}</legend>
        <p className="field-hint">{d.ticketHint}</p>
        <div className="mi-dir-ticket-row">
          <EuroField id={`${idPrefix}-min`} label={d.min} value={filters.min} onChange={(min) => set({ min }, true)} />
          <EuroField id={`${idPrefix}-max`} label={d.max} value={filters.max} onChange={(max) => set({ max }, true)} />
        </div>
        {isReversed(filters) && <p className="field-hint mi-dir-range">{d.ticketSwap}</p>}
      </fieldset>
    </div>
  );
}

function FilterDrawer({
  open,
  onClose,
  count,
  children,
}: {
  open: boolean;
  onClose: () => void;
  count: number;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const d = t.directory.dir;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} className="mi-dir-drawer" aria-labelledby={titleId} onClose={onClose} onCancel={onClose}>
      <div className="mi-dir-drawer-head">
        <h2 id={titleId}>{d.filtersTitle}</h2>
        <button type="button" className="mi-dir-drawer-x" onClick={onClose}>
          <span aria-hidden="true">×</span>
          <span className="sr-only">{d.closeFilters}</span>
        </button>
      </div>
      <div className="mi-dir-drawer-body">{children}</div>
      <div className="mi-dir-drawer-foot">
        <button type="button" className="btn btn-navy" onClick={onClose}>
          {d.showResults(count)}
        </button>
      </div>
    </dialog>
  );
}

function InvestorCard({ entry, sent }: { entry: DirectoryEntry; sent: boolean }) {
  const { locale, t, path, f } = useI18n();
  const { search } = useLocation();
  const c = t.directory.dir.card;
  const L = labelsFor(locale);
  const i = entry.investor;
  const ev = entry.evaluation;
  const to = `${path('matchInvestorProfile')}?id=${encodeURIComponent(i.id)}`;
  const band = ev && ev.eligible ? scoreBand(ev.score, locale) : null;
  return (
    <article className="mi-dir-card">
      <header className="mi-dir-card-head">
        <h3>
          <Link to={to} state={{ from: search }}>
            {i.nome}
          </Link>
        </h3>
        <span className="pill">{L.tipo[i.tipo]}</span>
      </header>
      <p className="mi-dir-thesis">{i.tesi}</p>
      <dl className="mi-dir-facts">
        <div>
          <dt>{c.ticket}</dt>
          <dd>{rangeText(i.ticketMin, i.ticketMax, locale)}</dd>
        </div>
        <div>
          <dt>{c.fasi}</dt>
          <dd>{i.fasi.map((x) => L.fase[x]).join(', ')}</dd>
        </div>
        <div>
          <dt>{c.settori}</dt>
          <dd>{i.settori === 'tutti' ? c.generalist : i.settori.map((s) => L.settore[s]).join(', ')}</dd>
        </div>
        <div>
          <dt>{c.aree}</dt>
          <dd>{i.aree === 'italia' ? c.italy : i.aree.map((a) => L.area[a]).join(', ')}</dd>
        </div>
      </dl>
      <footer className="mi-dir-card-foot">
        {ev &&
          (band ? (
            <span className={`mi-dir-fit band-${band.band}`}>
              <strong>{f.number(ev.score)}/100</strong> {band.label}
            </span>
          ) : (
            <span className="mi-dir-fit is-out">{c.outside}</span>
          ))}
        {sent && <span className="pill mi-dir-sent">{c.sent}</span>}
        <Link to={to} state={{ from: search }} className="mi-dir-open-link">
          {c.open}
          <span className="sr-only">{c.openSr(i.nome)}</span> <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </article>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" className="mi-dir-search-icon">
      <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
      <path d="M3 5h14M6 10h8M8.5 15h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
