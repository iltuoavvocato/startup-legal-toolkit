// Reads a pitch deck's text (one string per page, as pdf.js extracts it) and proposes profile fields.
// Pure, deterministic, keyword and pattern based: no AI, no network. Works on Italian and English decks.
// Every finding carries a confidence (0–1) and the snippet + page it comes from, so the founder can check it.
import { AREA_DI, type Fase, type Regione, type Settore } from './matchTaxonomy';

export interface Evidence {
  /** 1-based page number. */
  page: number;
  /** The text the finding comes from, trimmed around the match. */
  snippet: string;
}

export interface Finding<T> extends Evidence {
  value: T;
  /** 0–1; see confidenceBand(). */
  confidence: number;
}

export type ConfidenceBand = 'alta' | 'media' | 'bassa';
export function confidenceBand(c: number): ConfidenceBand {
  return c >= 0.75 ? 'alta' : c >= 0.5 ? 'media' : 'bassa';
}

export type TractionKind = 'mrr' | 'arr' | 'revenue' | 'users' | 'customers' | 'growth' | 'pilots' | 'loi';
export const TRACTION_KINDS: readonly TractionKind[] = ['mrr', 'arr', 'revenue', 'customers', 'users', 'growth', 'pilots', 'loi'];

export interface TractionSignal {
  kind: TractionKind;
  /** € (or the deck's currency) for mrr / arr / revenue. */
  amount?: number;
  /** Count for users / customers / pilots / loi. */
  count?: number;
  /** Percentage for growth. */
  pct?: number;
  /** Currency symbol when it isn't euro ("$", "£"). */
  currency?: string;
}

export interface RegionFinding extends Finding<Regione> {
  /** The place name as written in the deck ("Bari", "Milan", "Puglia"). */
  place: string;
}

export interface DeckFindings {
  settore: Finding<Settore> | null;
  fase: Finding<Fase> | null;
  round: (Finding<number> & { currency?: string }) | null;
  regione: RegionFinding | null;
  team: Finding<number> | null;
  /** Cover-slide subtitle, a candidate for the anonymous one-liner. */
  tagline: Finding<string> | null;
  traction: Finding<TractionSignal>[];
  stats: { pages: number; chars: number };
}

// ---------------------------------------------------------------- text helpers

const SNIPPET_MAX = 160;

/** Collapses whitespace and normalises typographic variants that matter for matching. */
export function normaliseText(s: string): string {
  return s
    .replace(/[\u00a0\u202f\u2009]/g, ' ')
    .replace(/[‐-—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** Shortens `line` to about SNIPPET_MAX characters around [start, start+len), adding ellipses where cut. */
export function snippetAround(line: string, start: number, len: number, max = SNIPPET_MAX): string {
  const clean = line.trim();
  if (clean.length <= max) return clean;
  const offset = line.length - line.trimStart().length;
  const s = Math.max(0, start - offset);
  const room = Math.max(0, max - len);
  let from = Math.max(0, s - Math.floor(room / 2));
  const to = Math.min(clean.length, from + max);
  from = Math.max(0, to - max);
  // Snap to word boundaries.
  if (from > 0) {
    const sp = clean.indexOf(' ', from);
    if (sp !== -1 && sp < s) from = sp + 1;
  }
  let end = to;
  if (end < clean.length) {
    const sp = clean.lastIndexOf(' ', end);
    if (sp > s + len) end = sp;
  }
  return `${from > 0 ? '…' : ''}${clean.slice(from, end).trim()}${end < clean.length ? '…' : ''}`;
}

interface Line {
  page: number;
  text: string;
  /** Previous non-empty line on the same page (slide titles often sit there). */
  prev: string;
}

/** Re-joins sentences the PDF wrapped over two lines: no closing punctuation, next line starts in lowercase. */
export function unwrap(lines: readonly string[]): string[] {
  const out: string[] = [];
  for (const l of lines) {
    const last = out[out.length - 1];
    if (last !== undefined && !/[.!?:;)\]"”]$/.test(last) && /^\p{Ll}/u.test(l)) out[out.length - 1] = `${last} ${l}`;
    else out.push(l);
  }
  return out;
}

function linesOf(pages: readonly string[]): Line[] {
  const out: Line[] = [];
  pages.forEach((p, i) => {
    let prev = '';
    for (const text of unwrap(p.split(/\n+/).map(normaliseText).filter(Boolean))) {
      out.push({ page: i + 1, text, prev });
      prev = text;
    }
  });
  return out;
}

/**
 * JS's \b only knows ASCII letters, so "sanità" or "mobilità" would never end on a boundary. This rewrites every \b
 * into a Unicode-aware letter/digit boundary and adds the "u" flag.
 */
const W = String.raw`[\p{L}\p{N}_]`;
const UB = String.raw`(?:(?<!${W})(?=${W})|(?<=${W})(?!${W}))`;
export function uni(re: RegExp, extraFlags = ''): RegExp {
  const flags = [...new Set(`${re.flags}u${extraFlags}`)].join('');
  return new RegExp(re.source.replace(/\\b/g, UB), flags);
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

function weigh(text: string, table: readonly (readonly [RegExp, number])[]): number {
  let sum = 0;
  for (const [re, w] of table) if (re.test(text)) sum += w;
  return sum;
}

// ---------------------------------------------------------------- numbers and amounts

const MULTIPLIERS: Record<string, number> = {
  k: 1e3,
  mila: 1e3,
  m: 1e6,
  mln: 1e6,
  mio: 1e6,
  mn: 1e6,
  milione: 1e6,
  milioni: 1e6,
  million: 1e6,
  millions: 1e6,
  bn: 1e9,
  mld: 1e9,
  miliardo: 1e9,
  miliardi: 1e9,
  billion: 1e9,
};

/**
 * Turns a number as written in a deck into a JS number. Handles Italian and English separators:
 * "1.500.000", "1,500,000", "1.5", "1,5", "800.000", "1.234,56", "1,234.56", "800 000".
 * A single separator followed by exactly three digits is a thousands separator, unless a multiplier follows
 * ("1,500 mln" is 1.5 million, "1.500" alone is fifteen hundred).
 */
export function parseNumber(raw: string, hasMultiplier = false): number | null {
  const s = raw.replace(/[\s'\u00a0\u202f]/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return null;
  const dots = (s.match(/\./g) ?? []).length;
  const commas = (s.match(/,/g) ?? []).length;
  let n: string;
  if (dots && commas) {
    const dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    const thou = dec === '.' ? ',' : '.';
    n = s.split(thou).join('').replace(dec, '.');
  } else if (dots || commas) {
    const sep = dots ? '.' : ',';
    const count = dots || commas;
    const after = s.length - s.lastIndexOf(sep) - 1;
    if (count > 1 || (after === 3 && !hasMultiplier)) n = s.split(sep).join('');
    else n = s.replace(sep, '.');
  } else n = s;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

export interface Amount {
  value: number;
  index: number;
  length: number;
  /** "€", "$", "£" or null when the amount has no currency (e.g. "800k"). */
  currency: string | null;
  hasMultiplier: boolean;
  /** Text right after the amount (lowercase), to tell "2M users" from "€2M". */
  after: string;
}

// Number: grouped thousands (dot, comma, apostrophe or non-breaking space) or plain digits with an optional decimal part.
const NUM = String.raw`\d{1,3}(?:[.,'\u00a0\u202f]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?`;
const WORD_MULT = String.raw`mila|mln|mio|mn|milioni|milione|millions?|bn|mld|miliardi|miliardo|billion`;
const AMOUNT_RE = new RegExp(
  String.raw`(?<pre>€|\$|£|\bEUR\b|\beur\b|\bEuro\b)?\s?(?<num>${NUM})(?:(?<multA>[kKmM])(?![\p{L}\d])|\s?(?<multB>${WORD_MULT}|K|M)(?![\p{L}\d]))?(?:\s?(?<post>€|\beuro\b|\bEUR\b|\beur\b))?`,
  'gu',
);

/** Every money-like amount in a line: numbers with a currency and/or a multiplier ("€1.5M", "800k", "1,2 mln"). */
export function findAmounts(line: string): Amount[] {
  const out: Amount[] = [];
  for (const m of line.matchAll(AMOUNT_RE)) {
    const g = m.groups ?? {};
    const num = g.num;
    if (!num) continue;
    // Skip digits glued to letters or other digits before them (e.g. "Q3", "4G", "B2B").
    const startOfNum = (m.index ?? 0) + m[0].indexOf(num);
    const before = line[startOfNum - 1];
    if (!g.pre && before && /[\p{L}\d]/u.test(before)) continue;
    const multRaw = (g.multA ?? g.multB ?? '').toLowerCase();
    const mult = multRaw ? MULTIPLIERS[multRaw] : undefined;
    const pre = g.pre ?? '';
    const post = g.post ?? '';
    const cur = pre || post;
    const currency = cur ? (cur === '$' ? '$' : cur === '£' ? '£' : '€') : null;
    if (!currency && !mult) continue;
    const base = parseNumber(num, Boolean(mult));
    if (base === null) continue;
    const value = Math.round(base * (mult ?? 1));
    const index = m.index ?? 0;
    const text = m[0].trimEnd();
    out.push({
      value,
      index,
      length: text.length,
      currency,
      hasMultiplier: Boolean(mult),
      after: line.slice(index + text.length, index + text.length + 24).toLowerCase(),
    });
  }
  return out;
}

/** Parses one amount expression ("€1.5M", "1,2 mln", "800.000 €"); null if it isn't one. */
export function parseAmount(text: string): number | null {
  return findAmounts(text)[0]?.value ?? null;
}

// Nouns that make "2M" or "10k" a count rather than money.
const COUNT_NOUN = uni(/^\s*(?:di\s+)?(?:utenti|users|user|download|downloads|iscritti|sign-?ups|registrati|clienti|customers|persone|people|visite|visits|visitatori|visitors|follower|followers|transazioni|transactions|ordini|orders|pazienti|patients|studenti|students|aziende|companies|ettari|hectares|tonnellate|tons|km|kg|kwh|mwh|mq|m2|sqm|ore|hours|righe|messaggi|sessioni|abbonati|subscribers|membri|members|installazioni|installs|units|unità|pezzi)\b/);

// ---------------------------------------------------------------- round size (the ask)

const ASK_STRONG = [
  uni(/\b(?:raising|we are raising|we're raising|seeking|the ask|our ask|funding ask|looking to raise|looking for)\b/i),
  uni(/\b(?:raccogliamo|raccogliere|stiamo raccogliendo|raccolta in corso|in raccolta|cerchiamo|chiediamo|apriamo un round|obiettivo di raccolta|round d[ai]|aumento di capitale)\b/i),
  uni(/\b(?:round of|round size|size of the round|dimensione del round)\b/i),
] as const;
const ASK_WEAK = [
  uni(/\b(?:round|funding|investment|investimento|aumento di capitale|capitale|raccolta|raise|ask|fabbisogno|richiesta)\b/i),
] as const;
const ASK_NEGATIVE = [
  uni(/\b(?:raised|have raised|already|previous|prior|closed|backed by|abbiamo raccolto|raccolti|chiuso|precedente|gi[àa])\b/i),
  uni(/\b(?:revenue|revenues|ricavi|fatturato|turnover|sales|vendite|ARR|MRR|GMV|EBITDA|margin|margine|burn|costi|costs?|spesa|spending)\b/i),
  uni(/\b(?:TAM|SAM|SOM|market|mercato|valuation|valutazione|pre-money|post-money|valore)\b/i),
  uni(/\b(?:grant|bando|contributo|prize|premio)\b/i),
] as const;

const ROUND_MIN = 10_000;
const ROUND_MAX = 100_000_000;

function askScore(text: string): number {
  return weigh(text, ASK_STRONG.map((r) => [r, 3] as const)) + weigh(text, ASK_WEAK.map((r) => [r, 1.5] as const)) - weigh(text, ASK_NEGATIVE.map((r) => [r, 3] as const));
}

export function findRound(pages: readonly string[]): DeckFindings['round'] {
  const cands: { value: number; score: number; currency: string | null; line: Line; a: Amount }[] = [];
  for (const line of linesOf(pages)) {
    const amounts = findAmounts(line.text).filter((a) => !COUNT_NOUN.test(a.after) && a.value >= ROUND_MIN && a.value <= ROUND_MAX);
    if (!amounts.length) continue;
    const own = askScore(line.text);
    // A slide title such as "Il round" / "The ask" counts, less than the line itself; its negatives count fully.
    const title = askScore(line.prev);
    const score = own + (title > 0 ? title * 0.6 : 0) + (own > 0 ? 0 : Math.min(0, title));
    for (const a of amounts) cands.push({ value: a.value, score, currency: a.currency, line, a });
  }
  const ok = cands.filter((c) => c.score >= 2).sort((x, y) => y.score - x.score || x.line.page - y.line.page);
  const best = ok[0];
  if (!best) return null;
  let confidence = best.score >= 5 ? 0.9 : best.score >= 3 ? 0.75 : 0.55;
  if (!best.currency) confidence -= 0.1;
  if (best.currency && best.currency !== '€') confidence -= 0.15;
  // Another, different amount that looks just as much like the ask: say we're less sure.
  if (ok.some((c) => c.value !== best.value && c.score >= best.score - 0.5)) confidence -= 0.2;
  return {
    value: best.value,
    confidence: round2(clamp01(confidence)),
    page: best.line.page,
    snippet: snippetAround(best.line.text, best.a.index, best.a.length),
    ...(best.currency && best.currency !== '€' ? { currency: best.currency } : {}),
  };
}

// ---------------------------------------------------------------- sector

type Table<T> = readonly (readonly [T, RegExp, number])[];

// [sector, pattern, weight]. Explicit sector names weigh 3, typical vocabulary 1–2. Patterns are case-insensitive.
const SETTORE_TABLE: Table<Settore> = [
  ['fintech', uni(/\bfin-?tech\b/i), 3],
  ['fintech', uni(/\binsur-?tech\b/i), 3],
  ['fintech', uni(/\b(?:pagamenti|payments?|open banking|neobank|PSD2|banking|banche|banks?)\b/i), 1.5],
  ['fintech', uni(/\b(?:prestiti|lending|credito|credit scoring|fatture|invoic(?:e|es|ing)|tesoreria|treasury|assicura\w*|insurance|wealth|trading|crypto|wallet)\b/i), 1],
  ['healthtech', uni(/\b(?:health-?tech|med-?tech|digital health|sanit[àa] digitale|e-?health)\b/i), 3],
  ['healthtech', uni(/\b(?:pazient[ei]|patients?|clinic[ahe]?|cliniche|clinical|ospedal[ei]|hospitals?|medic[io]|doctors?|physicians?|diagnos\w*|telemedicin\w*|terapi[ae]|therap\w*)\b/i), 1.5],
  ['healthtech', uni(/\b(?:salute|health(?:care)?|sanit[àa]|pharma|farmac\w*|dispositivo medico|medical device)\b/i), 1],
  ['agritech', uni(/\b(?:agri-?tech|agri-?food tech|precision (?:farming|agriculture)|agricoltura di precisione)\b/i), 3],
  ['agritech', uni(/\b(?:agricol\w*|agricultur\w*|aziende agricole|farms?|farmers?|coltur[ae]|crops?|vigne\w*|vineyards?|irrigazion\w*|irrigation|raccolto|harvest|allevament\w*|livestock|serre|greenhouses?)\b/i), 1.5],
  ['cleantech', uni(/\b(?:clean-?tech|climate-?tech|green-?tech)\b/i), 3],
  ['cleantech', uni(/\b(?:rinnovabil\w*|renewables?|fotovoltaic\w*|solar|CO2|emission[ie]|emissions|decarboni\w*|carbon|idrogeno|hydrogen|batteri[ae]|batter(?:y|ies)|efficienza energetica|energy efficiency|economia circolare|circular economy)\b/i), 1.5],
  ['cleantech', uni(/\b(?:energia|energy|sostenibilit[àa]|sustainab\w*)\b/i), 0.5],
  ['saas-b2b', uni(/\b(?:SaaS|software as a service)\b/i), 3],
  ['saas-b2b', uni(/\bB2B\b/), 2],
  ['saas-b2b', uni(/\b(?:PMI|SMEs?|enterprise|abbonamento|subscription|CRM|ERP|workflow|API|dashboard|gestionale|piattaforma per (?:le )?aziende)\b/i), 1],
  ['edtech', uni(/\bed-?tech\b/i), 3],
  ['edtech', uni(/\b(?:scuol[ae]|schools?|student[ie]|students?|insegnant[ie]|teachers?|universit[àa]|universities|e-?learning|corsi online|online courses|didattic\w*|formazione|training|learning|istruzione|education)\b/i), 1],
  ['deeptech', uni(/\bdeep-?tech\b/i), 3],
  ['deeptech', uni(/\b(?:quantum|quantistic\w*|robotic\w*|robotica|robot|semiconduttor\w*|semiconductors?|fotonica|photonics|nuovi materiali|advanced materials|computer vision|LiDAR|spin-?off)\b/i), 1.5],
  ['deeptech', uni(/\b(?:brevett[oi]|patents?|patented|machine learning|intelligenza artificiale|artificial intelligence|R&D|ricerca e sviluppo)\b/i), 0.5],
  ['mobilita', uni(/\b(?:mobilit[àa]|mobility|micromobilit\w*|micromobility|automotive)\b/i), 3],
  ['mobilita', uni(/\b(?:trasport[oi]|transport\w*|veicol[oi]|vehicles?|EV|ricarica|charging|flott[ae]|fleets?|last[- ]mile|ultimo miglio|logistic[ae]|logistics|ride-?sharing|car-?sharing)\b/i), 1.5],
  ['proptech', uni(/\bprop-?tech\b/i), 3],
  ['proptech', uni(/\b(?:real estate|immobiliar\w*|immobili|propert(?:y|ies)|affitt[io]|rentals?|tenants?|inquilin[io]|condomin\w*|edilizi[ao]|construction|cantier[ei])\b/i), 1.5],
  ['foodtech', uni(/\bfood-?tech\b/i), 3],
  ['foodtech', uni(/\b(?:ristorant[ei]|restaurants?|food delivery|ricett[ae]|recipes?|grocer(?:y|ies)|spesa online|sprechi alimentari|food waste|alimentar[ei]|cibo|meals?|pasti)\b/i), 1.5],
  ['foodtech', uni(/\bfood\b/i), 1],
  ['consumer', uni(/\b(?:consumer|B2C|D2C|DTC|direct[- ]to[- ]consumer)\b/i), 3],
  ['consumer', uni(/\b(?:e-?commerce|marketplace|moda|fashion|beauty|cosmetic\w*|retail|lifestyle|gaming|app per (?:i )?consumatori)\b/i), 1],
];

const SETTORE_GLOBAL = SETTORE_TABLE.map(([s, re, w]) => [s, new RegExp(re.source, `${re.flags}g`), w] as const);

export function findSettore(pages: readonly string[]): Finding<Settore> | null {
  const totals = new Map<Settore, number>();
  const best = new Map<Settore, { w: number; line: Line; index: number; len: number }>();
  for (const line of linesOf(pages)) {
    // The cover and the first slides say what the company does: they weigh a bit more.
    const pageBoost = line.page <= 2 ? 1.5 : 1;
    for (const [settore, g, w] of SETTORE_GLOBAL) {
      const hits = [...line.text.matchAll(g)];
      if (!hits.length) continue;
      // Repeats in one line count once more at most.
      const add = w * pageBoost * Math.min(hits.length, 2);
      totals.set(settore, (totals.get(settore) ?? 0) + add);
      const prev = best.get(settore);
      if (!prev || w > prev.w) best.set(settore, { w, line, index: hits[0]!.index ?? 0, len: hits[0]![0].length });
    }
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  if (!top || top[1] < 2) return null;
  const ratio = second ? top[1] / second[1] : Infinity;
  const confidence = top[1] >= 6 && ratio >= 2 ? 0.85 : top[1] >= 3 && ratio >= 1.4 ? 0.65 : 0.4;
  const ev = best.get(top[0])!;
  return { value: top[0], confidence, page: ev.line.page, snippet: snippetAround(ev.line.text, ev.index, ev.len) };
}

// ---------------------------------------------------------------- stage

const STAGE_TABLE: Table<Fase> = [
  ['pre-seed', uni(/\bpre[- ]?seed\b/i), 1],
  ['seed', uni(/(?<!pre[- ]?)\bseed\b/i), 1],
  ['serie-a', uni(/\b(?:[Ss]eries|[Ss]erie|[Rr]ound|SERIES|SERIE)\s+A\b/), 1],
];
const STAGE_NOW = uni(/\b(?:raising|raise|seeking|looking for|current|now|opening|apriamo|raccogliamo|raccolta|cerchiamo|stiamo|in corso|attuale|round|ask)\b/i);
const STAGE_PAST = uni(/\b(?:raised|closed|completed|previous|prior|backed|chiuso|concluso|raccolto|precedente|nel 20\d\d|in 20\d\d)\b/i);

export function findFase(pages: readonly string[]): Finding<Fase> | null {
  const cands: { fase: Fase; score: number; line: Line; index: number; len: number }[] = [];
  for (const line of linesOf(pages)) {
    for (const [fase, re] of STAGE_TABLE) {
      const m = re.exec(line.text);
      if (!m) continue;
      let score = 1;
      if (STAGE_NOW.test(line.text) || STAGE_NOW.test(line.prev)) score += 2;
      if (STAGE_PAST.test(line.text)) score -= 3;
      cands.push({ fase, score, line, index: m.index, len: m[0].length });
    }
  }
  const ok = cands.filter((c) => c.score > 0).sort((a, b) => b.score - a.score || a.line.page - b.line.page);
  const best = ok[0];
  if (!best) return null;
  const rivals = new Set(ok.filter((c) => c.score >= best.score && c.fase !== best.fase).map((c) => c.fase));
  let confidence = best.score >= 3 ? 0.85 : 0.55;
  if (rivals.size) confidence -= 0.25;
  return { value: best.fase, confidence: round2(clamp01(confidence)), page: best.line.page, snippet: snippetAround(best.line.text, best.index, best.len) };
}

// ---------------------------------------------------------------- city / region

// Place names (case-sensitive, as written in decks) → region. Ambiguous common words are left out (Latina, Prato, Potenza).
const PLACES: readonly (readonly [string, Regione])[] = [
  ['Milano', 'lombardia'], ['Milan', 'lombardia'], ['Bergamo', 'lombardia'], ['Brescia', 'lombardia'], ['Monza', 'lombardia'],
  ['Como', 'lombardia'], ['Varese', 'lombardia'], ['Pavia', 'lombardia'], ['Cremona', 'lombardia'], ['Lecco', 'lombardia'],
  ['Lombardia', 'lombardia'], ['Lombardy', 'lombardia'],
  ['Torino', 'piemonte'], ['Turin', 'piemonte'], ['Novara', 'piemonte'], ['Cuneo', 'piemonte'], ['Alessandria', 'piemonte'],
  ['Asti', 'piemonte'], ['Piemonte', 'piemonte'], ['Piedmont', 'piemonte'],
  ['Aosta', 'valle-aosta'], ["Valle d'Aosta", 'valle-aosta'], ['Aosta Valley', 'valle-aosta'],
  ['Genova', 'liguria'], ['Genoa', 'liguria'], ['La Spezia', 'liguria'], ['Savona', 'liguria'], ['Sanremo', 'liguria'], ['Liguria', 'liguria'],
  ['Trento', 'trentino-alto-adige'], ['Bolzano', 'trentino-alto-adige'], ['Rovereto', 'trentino-alto-adige'],
  ['Trentino', 'trentino-alto-adige'], ['Alto Adige', 'trentino-alto-adige'], ['South Tyrol', 'trentino-alto-adige'],
  ['Venezia', 'veneto'], ['Venice', 'veneto'], ['Padova', 'veneto'], ['Padua', 'veneto'], ['Verona', 'veneto'],
  ['Vicenza', 'veneto'], ['Treviso', 'veneto'], ['Rovigo', 'veneto'], ['Mestre', 'veneto'], ['Veneto', 'veneto'],
  ['Trieste', 'friuli-venezia-giulia'], ['Udine', 'friuli-venezia-giulia'], ['Pordenone', 'friuli-venezia-giulia'],
  ['Gorizia', 'friuli-venezia-giulia'], ['Friuli', 'friuli-venezia-giulia'],
  ['Bologna', 'emilia-romagna'], ['Modena', 'emilia-romagna'], ['Parma', 'emilia-romagna'], ['Reggio Emilia', 'emilia-romagna'],
  ['Ferrara', 'emilia-romagna'], ['Ravenna', 'emilia-romagna'], ['Rimini', 'emilia-romagna'], ['Piacenza', 'emilia-romagna'],
  ['Forlì', 'emilia-romagna'], ['Cesena', 'emilia-romagna'], ['Emilia-Romagna', 'emilia-romagna'], ['Emilia Romagna', 'emilia-romagna'],
  ['Firenze', 'toscana'], ['Florence', 'toscana'], ['Pisa', 'toscana'], ['Siena', 'toscana'], ['Livorno', 'toscana'],
  ['Lucca', 'toscana'], ['Arezzo', 'toscana'], ['Toscana', 'toscana'], ['Tuscany', 'toscana'],
  ['Perugia', 'umbria'], ['Terni', 'umbria'], ['Umbria', 'umbria'],
  ['Ancona', 'marche'], ['Pesaro', 'marche'], ['Macerata', 'marche'], ['Urbino', 'marche'], ['Marche', 'marche'],
  ['Roma', 'lazio'], ['Rome', 'lazio'], ['Viterbo', 'lazio'], ['Frosinone', 'lazio'], ['Rieti', 'lazio'], ['Lazio', 'lazio'],
  ["L'Aquila", 'abruzzo'], ['Pescara', 'abruzzo'], ['Chieti', 'abruzzo'], ['Teramo', 'abruzzo'], ['Abruzzo', 'abruzzo'],
  ['Campobasso', 'molise'], ['Isernia', 'molise'], ['Molise', 'molise'],
  ['Napoli', 'campania'], ['Naples', 'campania'], ['Salerno', 'campania'], ['Caserta', 'campania'], ['Avellino', 'campania'],
  ['Benevento', 'campania'], ['Campania', 'campania'],
  ['Bari', 'puglia'], ['Lecce', 'puglia'], ['Taranto', 'puglia'], ['Foggia', 'puglia'], ['Brindisi', 'puglia'], ['Puglia', 'puglia'],
  ['Apulia', 'puglia'],
  ['Matera', 'basilicata'], ['Basilicata', 'basilicata'],
  ['Reggio Calabria', 'calabria'], ['Cosenza', 'calabria'], ['Catanzaro', 'calabria'], ['Calabria', 'calabria'],
  ['Palermo', 'sicilia'], ['Catania', 'sicilia'], ['Messina', 'sicilia'], ['Siracusa', 'sicilia'], ['Trapani', 'sicilia'],
  ['Sicilia', 'sicilia'], ['Sicily', 'sicilia'],
  ['Cagliari', 'sardegna'], ['Sassari', 'sardegna'], ['Olbia', 'sardegna'], ['Nuoro', 'sardegna'], ['Sardegna', 'sardegna'],
  ['Sardinia', 'sardegna'],
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest names first, so "Reggio Emilia" wins over a shorter overlapping name.
const PLACE_RE = new RegExp(
  `(?<![\\p{L}'-])(${[...PLACES]
    .map(([p]) => p)
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join('|')})(?![\\p{L}])`,
  'gu',
);
const PLACE_OF = new Map(PLACES.map(([p, r]) => [p, r]));

const HQ = uni(/\b(?:sede|sede legale|sede operativa|headquarter(?:s|ed)?|HQ|based in|basati a|con sede|uffici[oi]?|office|offices|located in|via|piazza|corso|S\.?r\.?l\.?|S\.?p\.?A\.?)\b/i);
const NOT_HQ = uni(/\b(?:Politecnico|Universit[àay]|University|Bocconi|alumni|ex|former|clienti|customers|espansione|expansion|expanding|aprire|opening|mercat[oi]|markets?|evento|event|fiera)\b/i);

export function findRegione(pages: readonly string[]): RegionFinding | null {
  const totals = new Map<Regione, number>();
  const best = new Map<Regione, { w: number; line: Line; index: number; place: string; hq: boolean }>();
  for (const line of linesOf(pages)) {
    for (const m of line.text.matchAll(PLACE_RE)) {
      const place = m[1]!;
      const regione = PLACE_OF.get(place);
      if (!regione || !(regione in AREA_DI)) continue;
      const hq = HQ.test(line.text);
      let w = 1 + (hq ? 3 : 0);
      if (NOT_HQ.test(line.text)) w -= 0.6;
      totals.set(regione, (totals.get(regione) ?? 0) + w);
      const prev = best.get(regione);
      if (!prev || w > prev.w) best.set(regione, { w, line, index: m.index ?? 0, place, hq });
    }
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  if (!top || top[1] <= 0.5) return null;
  const ev = best.get(top[0])!;
  const dominant = !second || top[1] >= second[1] * 2;
  const confidence = ev.hq && dominant ? 0.85 : ev.hq ? 0.65 : dominant && top[1] >= 2 ? 0.6 : 0.4;
  return {
    value: top[0],
    place: ev.place,
    confidence,
    page: ev.line.page,
    snippet: snippetAround(ev.line.text, ev.index, ev.place.length),
  };
}

// ---------------------------------------------------------------- team size

const NUMBER_WORDS: Record<string, number> = {
  due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12,
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};
const N = String.raw`(\d{1,3}|${Object.keys(NUMBER_WORDS).join('|')})`;
const TEAM_PATTERNS: readonly (readonly [RegExp, number])[] = [
  [uni(new RegExp(String.raw`\bteam\s+(?:di|of)\s+${N}\b`, 'i')), 0.8],
  [uni(new RegExp(String.raw`\b${N}\s+(?:dipendenti|employees|FTE|full[- ]time|collaboratori|team members|membri del team|persone nel team|people on the team)\b`, 'i')), 0.8],
  [uni(new RegExp(String.raw`\bteam\s*[:=-]\s*${N}\b`, 'i')), 0.7],
  [uni(new RegExp(String.raw`\b(?:siamo|we are)\s+(?:in\s+)?${N}\b(?!\s*%)`, 'i')), 0.6],
  [uni(new RegExp(String.raw`\b${N}\s+(?:persone|people)\b`, 'i')), 0.6],
  [uni(new RegExp(String.raw`\b${N}\s+(?:co-?founders?|cofondatori|co-?fondatori|fondatori|founders)\b`, 'i')), 0.4],
];
const TEAM_NOT = uni(/\b(?:utenti|users|clienti|customers|pazienti|patients|usano|use|using|served|serviti|raggiunt\w*|reached|attendees|partecipanti|students|studenti)\b/i);

function readCount(raw: string): number {
  return NUMBER_WORDS[raw.toLowerCase()] ?? Number(raw);
}

export function findTeam(pages: readonly string[]): Finding<number> | null {
  let best: Finding<number> | null = null;
  for (const line of linesOf(pages)) {
    for (const [re, conf] of TEAM_PATTERNS) {
      const m = re.exec(line.text);
      if (!m) continue;
      const n = readCount(m[1]!);
      if (!(n >= 1 && n <= 500)) continue;
      // "200 persone usano già l'app" is not the team.
      const tail = line.text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 30);
      if (TEAM_NOT.test(tail) || TEAM_NOT.test(m[0])) continue;
      if (!best || conf > best.confidence) best = { value: n, confidence: conf, page: line.page, snippet: snippetAround(line.text, m.index ?? 0, m[0].length) };
    }
  }
  return best;
}

// ---------------------------------------------------------------- traction

const COUNT = String.raw`(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s?(k|K|mila|M|mln)?`;
const USERS_RE = uni(new RegExp(String.raw`(?<![\p{L}\d.,])${COUNT}\+?\s+(?:utenti|users|download|downloads|iscritti|sign-?ups|registrati|active users|utenti attivi|MAU|DAU)\b`, 'iu'));
const CUSTOMERS_RE = uni(new RegExp(String.raw`(?<![\p{L}\d.,])${COUNT}\+?\s+(?:\p{L}+\s+){0,2}?(?:clienti|customers|paying customers|clienti paganti|aziende clienti|clients|B2B clients|accounts)\b`, 'iu'));
const PILOTS_RE = uni(new RegExp(String.raw`\b${N}\s+(?:progetti pilota|pilot projects|pilots?|piloti|POC|PoC|proof[s]? of concept)\b`, 'i'));
const PILOTS_WORD = uni(/\b(?:progett[oi] pilota|pilot projects?|pilot with|pilota con|pilot in corso|ongoing pilots?)\b/i);
const LOI_RE = uni(new RegExp(String.raw`\b${N}\s+(?:LOI|LoI|LOIs|lettere d'intent[io]|letters of intent)\b`, 'i'));
const LOI_WORD = uni(/\b(?:LOI|LoI|LOIs|lettera d'intenti|lettere d'intenti|letter of intent|letters of intent)\b/);
const GROWTH_RE = [
  uni(/([+]?\d{1,4}(?:[.,]\d+)?)\s?%\s*(?:MoM|YoY|m\/m|a\/a|month[- ]over[- ]month|year[- ]over[- ]year|mese su mese|anno su anno|al mese|all'anno|per month|a month|monthly|mensile|annual|annuo|annua|growth|crescita)/i),
  uni(/\b(?:crescita|growth|cresciuti|cresce|grew|growing|crescendo)\b[^%\n]{0,30}?([+]?\d{1,4}(?:[.,]\d+)?)\s?%/i),
  uni(/\b(?:x(\d{1,2})|(\d{1,2})x)\b\s+(?:YoY|anno su anno|in un anno|in 12 mesi|growth|crescita)/i),
] as const;

const NOT_REVENUE = uni(/\b(?:TAM|SAM|SOM|market|mercato|raised|raccolt\w*|round)\b/i);
const MRR_KW = uni(/\bMRR\b|monthly recurring revenue|ricavi ricorrenti mensili/i);
const ARR_KW = uni(/\bARR\b|annual recurring revenue|ricavi ricorrenti annui/i);
const REVENUE_KW = uni(/\b(?:ricavi|fatturato|revenues?|turnover|vendite|sales)\b/i);
const PROSPECTS = uni(/\b(?:target|potenziali|potential|prospects?)\b/i);

function countValue(num: string, mult?: string): number | null {
  const m = mult ? (MULTIPLIERS[mult.toLowerCase()] ?? 1) : 1;
  const v = parseNumber(num, Boolean(mult));
  return v === null ? null : Math.round(v * m);
}

function moneyIn(line: string, keyword: RegExp): { amount: Amount } | null {
  const k = keyword.exec(line);
  if (!k) return null;
  const amounts = findAmounts(line).filter((a) => !COUNT_NOUN.test(a.after));
  if (!amounts.length) return null;
  // The amount closest to the keyword.
  const at = k.index;
  const amount = [...amounts].sort((a, b) => Math.abs(a.index - at) - Math.abs(b.index - at))[0]!;
  return { amount };
}

export function findTraction(pages: readonly string[]): Finding<TractionSignal>[] {
  const found = new Map<TractionKind, Finding<TractionSignal>>();
  const keep = (f: Finding<TractionSignal>) => {
    const prev = found.get(f.value.kind);
    if (!prev || f.confidence > prev.confidence) found.set(f.value.kind, f);
  };
  for (const line of linesOf(pages)) {
    const t = line.text;
    const snip = (index: number, len: number) => snippetAround(t, index, len);
    const money = (kind: 'mrr' | 'arr' | 'revenue', kw: RegExp) => {
      // A past raise or a market size on the same line is not revenue.
      if (kind === 'revenue' && NOT_REVENUE.test(t)) return;
      const r = moneyIn(t, kw);
      if (!r) return;
      const { amount } = r;
      keep({
        value: { kind, amount: amount.value, ...(amount.currency && amount.currency !== '€' ? { currency: amount.currency } : {}) },
        confidence: amount.currency ? 0.75 : 0.6,
        page: line.page,
        snippet: snip(amount.index, amount.length),
      });
    };
    money('mrr', MRR_KW);
    money('arr', ARR_KW);
    money('revenue', REVENUE_KW);

    const u = USERS_RE.exec(t);
    if (u) {
      const v = countValue(u[1]!, u[2]);
      if (v !== null && v > 0) keep({ value: { kind: 'users', count: v }, confidence: 0.7, page: line.page, snippet: snip(u.index, u[0].length) });
    }
    const c = CUSTOMERS_RE.exec(t);
    if (c && !PROSPECTS.test(t)) {
      const v = countValue(c[1]!, c[2]);
      if (v !== null && v > 0) keep({ value: { kind: 'customers', count: v }, confidence: 0.7, page: line.page, snippet: snip(c.index, c[0].length) });
    }
    for (const re of GROWTH_RE) {
      const g = re.exec(t);
      if (!g) continue;
      const raw = g[1] ?? g[2];
      if (!raw) continue;
      const isMultiple = re === GROWTH_RE[2];
      const v = parseNumber(raw.replace('+', ''), true);
      if (v === null || v <= 0) continue;
      const pct = isMultiple ? Math.round((v - 1) * 100) : v;
      keep({ value: { kind: 'growth', pct }, confidence: isMultiple ? 0.55 : 0.7, page: line.page, snippet: snip(g.index, g[0].length) });
      break;
    }
    const p = PILOTS_RE.exec(t);
    if (p) keep({ value: { kind: 'pilots', count: readCount(p[1]!) }, confidence: 0.7, page: line.page, snippet: snip(p.index, p[0].length) });
    else {
      const pw = PILOTS_WORD.exec(t);
      if (pw) keep({ value: { kind: 'pilots' }, confidence: 0.5, page: line.page, snippet: snip(pw.index, pw[0].length) });
    }
    const l = LOI_RE.exec(t);
    if (l) keep({ value: { kind: 'loi', count: readCount(l[1]!) }, confidence: 0.7, page: line.page, snippet: snip(l.index, l[0].length) });
    else {
      const lw = LOI_WORD.exec(t);
      if (lw) keep({ value: { kind: 'loi' }, confidence: 0.5, page: line.page, snippet: snip(lw.index, lw[0].length) });
    }
  }
  return TRACTION_KINDS.flatMap((k) => (found.has(k) ? [found.get(k)!] : []));
}

// ---------------------------------------------------------------- tagline

const TAGLINE_SKIP = uni(/\b(?:deck|pitch|confidential|confidenziale|riservat\w*|fittizi\w*|fictional|sample|esempio|investor presentation|presentazione per investitori|www|http|@|20\d\d)\b/i);

/** The cover's subtitle (e.g. "Remote monitoring for chronic patients"): the longest plausible line on page 1. */
export function findTagline(pages: readonly string[]): Finding<string> | null {
  // Keep the deck's own typography (curly apostrophes) for display; only collapse whitespace.
  const first = (pages[0] ?? '').split(/\n+/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  // The first line is usually the company name.
  const cands = first.slice(1).filter((l) => l.length >= 20 && l.length <= 140 && /\p{L}{3}/u.test(l) && !TAGLINE_SKIP.test(l));
  const best = [...cands].sort((a, b) => b.length - a.length)[0];
  if (!best) return null;
  return { value: best, confidence: 0.5, page: 1, snippet: snippetAround(best, 0, best.length) };
}

// ---------------------------------------------------------------- all together

/** Runs every heuristic on the deck's pages. Findings are proposals: the founder accepts, edits or ignores each. */
export function extractFromDeck(pages: readonly string[]): DeckFindings {
  return {
    settore: findSettore(pages),
    fase: findFase(pages),
    round: findRound(pages),
    regione: findRegione(pages),
    team: findTeam(pages),
    tagline: findTagline(pages),
    traction: findTraction(pages),
    stats: { pages: pages.length, chars: pages.reduce((n, p) => n + p.replace(/\s+/g, '').length, 0) },
  };
}

/** Number of findings, for summaries ("6 elementi trovati"). */
export function countFindings(f: DeckFindings): number {
  return [f.settore, f.fase, f.round, f.regione, f.team, f.tagline].filter(Boolean).length + f.traction.length;
}
