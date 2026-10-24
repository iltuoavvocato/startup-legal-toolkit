// Local export of the matching profiles: the founder's one-pager (anonymous teaser or full version) and the investor's
// thesis sheet. Pure functions: a whitelisted "sheet" (what may be exported) → a structured document → Markdown or
// plain text. Nothing here reads storage, the DOM or the clock (`now` is injected).
//
// What may leave the profile, and nothing else: enumerated fields, amounts, the one-liner the founder typed or
// accepted, team size and traction lines the founder accepted from the deck, and a name only if the user typed one.
// Never the deck's text, snippets, file name, founder name or e-mail addresses.
import type { Locale } from '../i18n/locales';
import { FORMATTERS } from '../i18n/format';
import { MESSAGES } from '../i18n/messages';
import { matchInvestors } from './matching';
import { isArea, isFase, isRegione, isSettore, AREA_DI, labelsFor, ONE_LINER_MAX, TIPI_INVESTITORE, type Investor } from './matchTaxonomy';
import { ownStartup, type StartupCore, type Thesis } from './matchQuery';

export const EXPORT_STORAGE_KEY = 'matchinvstar-export';

/** Limits for the free-text parts (placeholders). */
export const NAME_MAX = 80;
export const NOTES_MAX = 600;
export const TRACTION_MAX_ITEMS = 6;
export const TRACTION_ITEM_MAX = 80;
export const TEAM_MAX = 10_000;

export type SheetSource = 'form' | 'agent';
export type DocKind = 'startup' | 'investor';
export type DocVariant = 'teaser' | 'full';

/** The founder's exportable profile. */
export interface StartupSheet {
  source: SheetSource;
  core: StartupCore;
  /** The founder's own one-liner (typed, or the deck's cover sentence once accepted). */
  oneLiner: string | null;
  /** Team size accepted from the deck. */
  team: number | null;
  /** Traction lines accepted from the deck ("MRR 18.000 €"). */
  traction: string[];
}

/** The investor's exportable thesis. */
export interface InvestorSheet {
  source: SheetSource;
  thesis: Thesis;
}

export interface ExportStore {
  v: 1;
  startup: StartupSheet | null;
  investor: InvestorSheet | null;
}

export const emptyExportStore = (): ExportStore => ({ v: 1, startup: null, investor: null });

// ---------------------------------------------------------------- sanitising (whitelist)

/** Single line, no control characters, trimmed and clipped. */
export function cleanLine(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const flat = raw.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** Multi-line text (investor notes): keeps line breaks, drops other control characters, clipped. */
export function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const text = raw.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ');
  const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim());
  const joined = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return joined.length > max ? `${joined.slice(0, max - 1).trimEnd()}…` : joined;
}

function coreOf(x: unknown): StartupCore | null {
  if (!x || typeof x !== 'object') return null;
  const c = x as Record<string, unknown>;
  if (!isSettore(c.settore) || !isFase(c.fase) || !isRegione(c.regione)) return null;
  if (typeof c.round !== 'number' || !Number.isFinite(c.round) || c.round <= 0) return null;
  return { settore: c.settore, fase: c.fase, regione: c.regione, round: Math.round(c.round) };
}

function thesisOf(x: unknown): Thesis | null {
  if (!x || typeof x !== 'object') return null;
  const t = x as Record<string, unknown>;
  const settori = Array.isArray(t.settori) ? [...new Set(t.settori.filter(isSettore))] : [];
  const fasi = Array.isArray(t.fasi) ? [...new Set(t.fasi.filter(isFase))] : [];
  const aree = t.aree === 'italia' ? 'italia' : Array.isArray(t.aree) ? [...new Set(t.aree.filter(isArea))] : [];
  const min = t.ticketMin;
  const max = t.ticketMax;
  if (!settori.length || !fasi.length || (aree !== 'italia' && !aree.length)) return null;
  if (typeof min !== 'number' || typeof max !== 'number' || !(min >= 0) || !(max > 0) || min > max) return null;
  return { settori, fasi, ticketMin: Math.round(min), ticketMax: Math.round(max), aree, sede: isRegione(t.sede) ? t.sede : null };
}

/** Builds the founder's sheet from any profile-like object, keeping only the whitelisted fields. */
export function startupSheetOf(input: {
  source: SheetSource;
  core: StartupCore;
  oneLiner?: string | null;
  team?: number | null;
  traction?: readonly string[];
}): StartupSheet | null {
  const core = coreOf(input.core);
  if (!core) return null;
  const oneLiner = cleanLine(input.oneLiner, ONE_LINER_MAX) || null;
  const team = typeof input.team === 'number' && Number.isInteger(input.team) && input.team > 0 && input.team <= TEAM_MAX ? input.team : null;
  const traction = (input.traction ?? [])
    .map((t) => cleanLine(t, TRACTION_ITEM_MAX))
    .filter(Boolean)
    .slice(0, TRACTION_MAX_ITEMS);
  return { source: input.source === 'agent' ? 'agent' : 'form', core, oneLiner, team, traction };
}

export function investorSheetOf(input: { source: SheetSource; thesis: Thesis }): InvestorSheet | null {
  const thesis = thesisOf(input.thesis);
  return thesis ? { source: input.source === 'agent' ? 'agent' : 'form', thesis } : null;
}

// ---------------------------------------------------------------- storage format

export function parseExportStore(raw: string | null): ExportStore {
  if (!raw) return emptyExportStore();
  try {
    const x = JSON.parse(raw) as Record<string, unknown>;
    if (!x || x.v !== 1) return emptyExportStore();
    const s = x.startup as Record<string, unknown> | null | undefined;
    const i = x.investor as Record<string, unknown> | null | undefined;
    return {
      v: 1,
      startup: s
        ? startupSheetOf({
            source: s.source as SheetSource,
            core: s.core as StartupCore,
            oneLiner: s.oneLiner as string | null,
            team: s.team as number | null,
            traction: Array.isArray(s.traction) ? (s.traction as string[]) : [],
          })
        : null,
      investor: i ? investorSheetOf({ source: i.source as SheetSource, thesis: i.thesis as Thesis }) : null,
    };
  } catch {
    return emptyExportStore();
  }
}

export function serializeExportStore(store: ExportStore): string {
  return JSON.stringify(store);
}

// ---------------------------------------------------------------- the document

export interface DocRow {
  label: string;
  value: string;
}

export interface DocSection {
  id: 'profile' | 'pitch' | 'signals' | 'types' | 'thesis' | 'notes' | 'optin';
  title: string;
  rows?: DocRow[];
  items?: string[];
  paragraphs?: string[];
  /** Small print under the section. */
  note?: string;
}

export interface ExportDoc {
  kind: DocKind;
  variant: DocVariant;
  locale: Locale;
  brand: string;
  title: string;
  /** The startup's or investor's name, when one may be shown. */
  name: string | null;
  subtitle: string;
  tags: string[];
  sections: DocSection[];
  limits: string;
  disclaimer: string;
  footer: string;
  date: string;
  fileName: string;
}

/** "2026-10-24" in local time, for file names. */
export function isoDay(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Investor types among the matches, most frequent first (ties in the taxonomy's order). */
export function topInvestorTypes(
  core: StartupCore,
  investors: readonly Investor[],
  locale: Locale = 'it',
): { types: { tipo: Investor['tipo']; count: number }[]; matches: number } {
  const { matches } = matchInvestors(ownStartup(core, undefined, locale), investors, locale);
  const counts = new Map<Investor['tipo'], number>();
  for (const m of matches) counts.set(m.item.tipo, (counts.get(m.item.tipo) ?? 0) + 1);
  const types = TIPI_INVESTITORE.flatMap((tipo) => (counts.get(tipo) ? [{ tipo, count: counts.get(tipo)! }] : []));
  types.sort((a, b) => b.count - a.count);
  return { types, matches: matches.length };
}

export interface StartupDocOptions {
  variant: DocVariant;
  locale: Locale;
  now: number;
  /** The startup's name, only as typed by the founder (ignored in the teaser). */
  name?: string | null;
  /** Demo investors used for "Tipi di investitore in linea" (fictional). */
  investors: readonly Investor[];
}

export function buildStartupDoc(sheet: StartupSheet, opts: StartupDocOptions): ExportDoc {
  const { locale, variant } = opts;
  const D = MESSAGES[locale].exportDoc.doc;
  const L = labelsFor(locale);
  const f = FORMATTERS[locale];
  // Re-whitelist: whatever object comes in, only these fields are read.
  const s = startupSheetOf(sheet);
  if (!s) throw new Error('Invalid startup sheet');
  const c = s.core;
  const name = variant === 'full' ? cleanLine(opts.name, NAME_MAX) || null : null;
  const date = f.longDate(new Date(opts.now));

  const profile: DocRow[] = [
    ...(name ? [{ label: D.name, value: name }] : []),
    { label: D.settore, value: L.settore[c.settore] },
    { label: D.fase, value: L.fase[c.fase] },
    { label: D.round, value: f.euro(c.round) },
    { label: D.regione, value: D.regioneValue(L.regione[c.regione], L.area[AREA_DI[c.regione]]) },
  ];
  const signals = [...(s.team ? [`${D.team}: ${D.teamValue(s.team)}`] : []), ...s.traction];
  const { types, matches } = topInvestorTypes(c, opts.investors, locale);

  const sections: DocSection[] = [
    { id: 'profile', title: D.profile, rows: profile },
    ...(s.oneLiner ? [{ id: 'pitch' as const, title: D.pitch, paragraphs: [s.oneLiner] }] : []),
    signals.length
      ? { id: 'signals', title: D.signals, items: signals, note: D.signalsNote }
      : { id: 'signals', title: D.signals, paragraphs: [D.noSignals] },
    types.length
      ? {
          id: 'types',
          title: D.types,
          items: types.map((x) => D.typeItem(L.tipo[x.tipo], x.count)),
          note: D.typesNote(matches, opts.investors.length),
        }
      : { id: 'types', title: D.types, paragraphs: [D.noTypes], note: D.typesNote(0, opts.investors.length) },
    { id: 'optin', title: D.optinTitle, items: [...D.optinStartup] },
  ];

  const stem = variant === 'full' ? D.fileStem.startupFull : D.fileStem.startupTeaser;
  return {
    kind: 'startup',
    variant,
    locale,
    brand: D.brand,
    title: D.startupTitle[variant],
    name: variant === 'full' ? name : null,
    subtitle: D.startupSubtitle(L.settore[c.settore], L.fase[c.fase], L.regione[c.regione]),
    tags: [variant === 'full' ? D.tags.full : D.tags.teaser, D.tags.prototype],
    sections,
    limits: D.limits,
    disclaimer: MESSAGES[locale].common.disclaimer,
    footer: D.footer(date),
    date,
    fileName: `matchinvstar-${stem}-${isoDay(opts.now)}.md`,
  };
}

export interface InvestorDocOptions {
  locale: Locale;
  now: number;
  /** The investor's name as typed (or a fictional demo investor's name). */
  name?: string | null;
  /** Free notes typed on the export page (or a demo investor's thesis). */
  notes?: string | null;
  /** A fictional demo investor's sheet: labelled as fictional sample data. */
  fictional?: boolean;
  /** Generalist investor (every sector): shown as such instead of the sector list. */
  generalist?: boolean;
}

export function buildInvestorDoc(sheet: InvestorSheet, opts: InvestorDocOptions): ExportDoc {
  const { locale } = opts;
  const D = MESSAGES[locale].exportDoc.doc;
  const L = labelsFor(locale);
  const f = FORMATTERS[locale];
  const s = investorSheetOf(sheet);
  if (!s) throw new Error('Invalid investor sheet');
  const t = s.thesis;
  const name = cleanLine(opts.name, NAME_MAX) || null;
  const notes = cleanText(opts.notes, NOTES_MAX);
  const date = f.longDate(new Date(opts.now));
  const rows: DocRow[] = [
    {
      label: D.settori,
      value: opts.generalist
        ? D.generalist
        : t.settori.map((x, i) => `${L.settore[x]}${i === 0 && t.settori.length > 1 ? D.mainSuffix : ''}`).join(', '),
    },
    { label: D.fasi, value: t.fasi.map((x, i) => `${L.fase[x]}${i === 0 && t.fasi.length > 1 ? D.mainSuffix : ''}`).join(', ') },
    { label: D.ticket, value: D.ticketValue(f.euro(t.ticketMin), f.euro(t.ticketMax)) },
    { label: D.aree, value: t.aree === 'italia' ? D.italy : t.aree.map((a) => L.area[a]).join(', ') },
    { label: D.sede, value: t.sede ? L.regione[t.sede] : D.noSede },
  ];
  const sections: DocSection[] = [
    { id: 'thesis', title: D.thesis, rows },
    ...(notes ? [{ id: 'notes' as const, title: D.notes, paragraphs: notes.split(/\n{2,}/) }] : []),
    { id: 'optin', title: D.optinTitle, items: [...D.optinInvestor] },
  ];
  return {
    kind: 'investor',
    variant: 'full',
    locale,
    brand: D.brand,
    title: D.investorTitle,
    name,
    subtitle: opts.generalist ? D.generalist : D.investorSubtitle(t.settori.length),
    tags: [D.tags.prototype, ...(opts.fictional ? [D.tags.fictional] : [])],
    sections,
    limits: D.limits,
    disclaimer: MESSAGES[locale].common.disclaimer,
    footer: D.footer(date),
    date,
    fileName: `matchinvstar-${D.fileStem.investor}-${isoDay(opts.now)}.md`,
  };
}

// ---------------------------------------------------------------- Markdown and plain text

/** Escapes Markdown syntax in user-provided text, so a typed name can't become a link, heading or HTML. */
export function mdEscape(text: string): string {
  return text.replace(/([\\`*_{}[\]()<>#+\-!|~])/g, '\\$1');
}

export function toMarkdown(doc: ExportDoc): string {
  const e = mdEscape;
  const out: string[] = [];
  out.push(`# ${e(doc.name ?? doc.title)}`, '');
  if (doc.name) out.push(`**${e(doc.title)}**`, '');
  out.push(`${e(doc.subtitle)}  `, `_${e(doc.tags.join(' · '))} · ${e(doc.brand)}_`, '');
  for (const sec of doc.sections) {
    out.push(`## ${e(sec.title)}`, '');
    if (sec.rows) {
      for (const r of sec.rows) out.push(`- **${e(r.label)}:** ${e(r.value)}`);
      out.push('');
    }
    if (sec.paragraphs) for (const p of sec.paragraphs) out.push(e(p), '');
    if (sec.items) {
      for (const i of sec.items) out.push(`- ${e(i)}`);
      out.push('');
    }
    if (sec.note) out.push(`_${e(sec.note)}_`, '');
  }
  out.push('---', '', e(doc.limits), '', `**${e(doc.disclaimer)}**`, '', `_${e(doc.footer)}_`, '');
  return out.join('\n');
}

export function toPlainText(doc: ExportDoc): string {
  const out: string[] = [];
  out.push((doc.name ?? doc.title).toUpperCase());
  if (doc.name) out.push(doc.title);
  out.push(doc.subtitle, `${doc.tags.join(' · ')} · ${doc.brand}`, '');
  for (const sec of doc.sections) {
    out.push(sec.title.toUpperCase());
    for (const r of sec.rows ?? []) out.push(`${r.label}: ${r.value}`);
    for (const p of sec.paragraphs ?? []) out.push(p);
    for (const i of sec.items ?? []) out.push(`• ${i}`);
    if (sec.note) out.push(sec.note);
    out.push('');
  }
  out.push(doc.limits, doc.disclaimer, doc.footer);
  return out.join('\n');
}

/** Reads the document kind from the export page's query: ?tipo=startup|investitore (IT) or ?type=startup|investor (EN). */
export function kindFromQuery(q: URLSearchParams): DocKind {
  const v = q.get('tipo') ?? q.get('type');
  return v === 'investitore' || v === 'investor' ? 'investor' : 'startup';
}

/** Query string of the export page for a kind, in the page's language. */
export function exportQuery(kind: DocKind, locale: Locale, investorId?: string): string {
  const key = locale === 'en' ? 'type' : 'tipo';
  const value = kind === 'startup' ? 'startup' : locale === 'en' ? 'investor' : 'investitore';
  return `?${new URLSearchParams({ [key]: value, ...(investorId ? { id: investorId } : {}) }).toString()}`;
}
