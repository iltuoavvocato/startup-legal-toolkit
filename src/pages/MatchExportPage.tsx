import { useId, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { EmptyArt } from '../components/match/EmptyArt';
import { PageHero } from '../components/PageHero';
import { LiveRegion } from '../components/match/LiveRegion';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { SegmentedField } from '../components/match/SegmentedField';
import { useExportStore } from '../components/match/useExportStore';
import { demoInvestors } from '../data/matchDemo';
import { useI18n } from '../i18n/context';
import { findInvestor } from '../lib/directory';
import {
  buildInvestorDoc,
  buildStartupDoc,
  exportQuery,
  kindFromQuery,
  NOTES_MAX,
  toMarkdown,
  toPlainText,
  type DocKind,
  type DocVariant,
  type ExportDoc,
} from '../lib/exportDoc';
import { SETTORI, type Settore } from '../lib/matchTaxonomy';

/**
 * Local export: the founder's one-pager (anonymous teaser or full version) or the investor's thesis sheet, as an A4
 * page to print or save as PDF, a Markdown download or plain text to copy. Reads only this tab's local state; the
 * names typed in the forms arrive as router state and are never stored.
 */
export function MatchExportPage() {
  const { locale, t, path } = useI18n();
  const P = t.exportDoc.page;
  const location = useLocation();
  const id = useId();
  const query = new URLSearchParams(location.search);
  const kind: DocKind = kindFromQuery(query);
  const demoId = kind === 'investor' ? query.get('id') : null;
  const store = useExportStore();
  const typedName = (location.state as { name?: unknown } | null)?.name;
  const name = typeof typedName === 'string' ? typedName : null;
  const [variant, setVariant] = useState<DocVariant>('teaser');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [now] = useState(() => Date.now());

  const demo = demoId ? findInvestor(demoInvestors(locale), demoId) : null;
  const doc: ExportDoc | null = useMemo(() => {
    if (kind === 'startup') {
      return store.startup
        ? buildStartupDoc(store.startup, { variant, locale, now, name, investors: demoInvestors(locale) })
        : null;
    }
    if (demo) {
      const generalist = demo.settori === 'tutti';
      const thesis = {
        settori: generalist ? [...SETTORI] : [...(demo.settori as Settore[])],
        fasi: [...demo.fasi],
        ticketMin: demo.ticketMin,
        ticketMax: demo.ticketMax,
        aree: demo.aree === 'italia' ? ('italia' as const) : [...demo.aree],
        sede: demo.sede,
      };
      const extra = notes.trim() ? `\n\n${notes}` : '';
      return buildInvestorDoc(
        { source: 'form', thesis },
        { locale, now, name: demo.nome, notes: `${demo.tesi}${extra}`, fictional: true, generalist },
      );
    }
    if (demoId) return null;
    return store.investor ? buildInvestorDoc(store.investor, { locale, now, name, notes }) : null;
  }, [kind, store, variant, locale, now, name, demo, demoId, notes]);

  const other: DocKind = kind === 'startup' ? 'investor' : 'startup';
  const resultsPath = kind === 'startup' ? path('matchStartup') : path('matchInvestor');

  const download = () => {
    if (!doc) return;
    const url = URL.createObjectURL(new Blob([toMarkdown(doc)], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage(P.downloaded(doc.fileName));
  };

  const copy = async () => {
    if (!doc) return;
    try {
      await navigator.clipboard.writeText(toPlainText(doc));
      setMessage(P.copied);
    } catch {
      setMessage(P.copyFailed);
    }
  };

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={P.eyebrow} title={P.title}>
        <p>{P.lead}</p>
      </PageHero>
      <section className="section-cream tool-section mi-export">
        <div className="container">
          <LiveRegion message={message} />
          {doc ? (
            <div className="mi-export-layout">
              <div className="card mi-export-tools no-print" aria-labelledby={`${id}-tools`}>
                <h2 id={`${id}-tools`} className="card-title">
                  {P.kinds[kind]}
                </h2>
                {kind === 'startup' && (
                  <>
                    <SegmentedField
                      id={`${id}-variant`}
                      legend={P.variantLabel}
                      options={(['teaser', 'full'] as const).map((v) => ({ value: v, label: P.variants[v] }))}
                      value={variant}
                      onChange={(v) => setVariant(v === 'full' ? 'full' : 'teaser')}
                    />
                    <p className="field-hint">{P.variantHint[variant]}</p>
                    {variant === 'full' && !doc.name && <p className="notice mi-export-note">{P.fullNoName}</p>}
                  </>
                )}
                {kind === 'investor' && (
                  <div className="field">
                    <label htmlFor={`${id}-notes`}>{P.notesLabel}</label>
                    <textarea
                      id={`${id}-notes`}
                      rows={4}
                      maxLength={NOTES_MAX}
                      value={notes}
                      aria-describedby={`${id}-notes-hint`}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <p className="field-hint" id={`${id}-notes-hint`}>
                      {P.notesHint}
                    </p>
                  </div>
                )}
                <div className="mi-export-actions" role="group" aria-label={P.actionsLabel}>
                  <button type="button" className="btn btn-navy" onClick={() => window.print()}>
                    {P.print}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={download}>
                    {P.download}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => void copy()}>
                    {P.copy}
                  </button>
                </div>
                <p className="field-hint">{P.printHint}</p>
                <p className="field-hint">{P.localNote}</p>
                {demo && <p className="field-hint">{P.demoInvestor(demo.nome)}</p>}
                <p className="mi-export-links">
                  {!demo && <Link to={resultsPath}>{P.back[kind]}</Link>}
                  <Link to={{ pathname: path('matchExport'), search: exportQuery(other, locale) }}>
                    {P.otherKind[kind]}
                  </Link>
                </p>
              </div>
              <div className="mi-export-paper" role="region" aria-label={P.preview}>
                <ExportSheet doc={doc} />
              </div>
            </div>
          ) : (
            <div className="card mi-empty mi-empty-state mi-export-empty">
              <EmptyArt kind="doc" />
              <div>
                <h2 className="card-title">{demoId ? P.notFound : P.emptyTitle[kind]}</h2>
                {!demoId && <p>{P.emptyText[kind]}</p>}
                <div className="actions">
                  <Link className="btn btn-navy" to={path(kind === 'startup' ? 'matchAgentStartup' : 'matchAgentInvestor')}>
                    {P.emptyAgent}
                  </Link>
                  <Link className="btn btn-outline" to={path(kind === 'startup' ? 'matchStartup' : 'matchInvestor')}>
                    {P.emptyForm}
                  </Link>
                </div>
                <p className="mi-export-links">
                  <Link to={{ pathname: path('matchExport'), search: exportQuery(other, locale) }}>
                    {P.otherKind[kind]}
                  </Link>
                </p>
              </div>
            </div>
          )}
          <Disclaimer className="no-print" />
          <div className="no-print">
            <CtaPanel campaign="match" title={t.match.ui.landing.ctaTitle} text={t.match.ui.landing.ctaText} />
          </div>
        </div>
      </section>
    </>
  );
}

/** The A4 document: what is printed, downloaded (as Markdown) and copied (as text) is the same structure. */
function ExportSheet({ doc }: { doc: ExportDoc }) {
  const hid = useId();
  return (
    <article className={`mi-sheet is-${doc.kind}`} aria-labelledby={`${hid}-title`} lang={doc.locale}>
      <header className="mi-sheet-head">
        <div className="mi-sheet-brandline">
          <span className="mi-sheet-brand">{doc.brand}</span>
          <span className="mi-sheet-date">{doc.date}</span>
        </div>
        <ul className="mi-sheet-tags">
          {doc.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <h2 id={`${hid}-title`} className="mi-sheet-title">
          {doc.name ?? doc.title}
        </h2>
        {doc.name && <p className="mi-sheet-kicker">{doc.title}</p>}
        <p className="mi-sheet-sub">{doc.subtitle}</p>
      </header>
      <div className="mi-sheet-body">
        {doc.sections.map((sec) => (
          <section key={sec.id} className={`mi-sheet-sec is-${sec.id}`}>
            <h3>{sec.title}</h3>
            {sec.rows && (
              <dl className="mi-sheet-facts">
                {sec.rows.map((r) => (
                  <div key={r.label}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {sec.paragraphs?.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {sec.items &&
              (sec.id === 'optin' ? (
                <ol className="mi-sheet-steps">
                  {sec.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ol>
              ) : (
                <ul>
                  {sec.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              ))}
            {sec.note && <p className="mi-sheet-note">{sec.note}</p>}
          </section>
        ))}
      </div>
      <footer className="mi-sheet-foot">
        <p>{doc.limits}</p>
        <p className="mi-sheet-disclaimer">{doc.disclaimer}</p>
        <p className="mi-sheet-footer">{doc.footer}</p>
      </footer>
    </article>
  );
}
