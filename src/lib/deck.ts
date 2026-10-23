// Simulated "l'agente ha letto il deck". The file is never read: only its name, type and size are used.
import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';
import {
  isFase,
  isRegione,
  isSettore,
  ONE_LINER_MAX,
  type Fase,
  type Regione,
  type Settore,
} from './matchTaxonomy';

/** Placeholder upper bound for the PDF. */
export const MAX_DECK_MB = 20;

export interface DeckMeta {
  name: string;
  type: string;
  size: number;
}

/** Returns an Italian error message, or null if the file is acceptable. */
export function validateDeck(file: DeckMeta, locale: Locale = 'it'): string | null {
  const m = MESSAGES[locale].match.deck;
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) return m.notPdf;
  if (file.size <= 0) return m.empty;
  if (file.size > MAX_DECK_MB * 1024 * 1024) return m.tooBig(MAX_DECK_MB);
  return null;
}

/** Processing steps shown while the agent works; without a deck they never mention reading one. */
export function agentSteps(locale: Locale = 'it', hasDeck = true): readonly string[] {
  const d = MESSAGES[locale].match.deck;
  return hasDeck ? d.steps : d.stepsNoDeck;
}

export const AGENT_STEPS = agentSteps('it');

export type Fonte = 'deck' | 'modulo' | 'esempio';
export function fonteLabels(locale: Locale = 'it'): Record<Fonte, string> {
  return MESSAGES[locale].match.deck.fonti;
}

export const FONTE_LABEL = fonteLabels('it');

export interface StartupForm {
  settore: string;
  fase: string;
  regione: string;
  round: number | null;
  descrizione: string;
}

export interface Extracted<T> {
  value: T;
  fonte: Fonte;
}

export interface Extraction {
  settore: Extracted<Settore>;
  fase: Extracted<Fase>;
  regione: Extracted<Regione>;
  round: Extracted<number>;
  oneLiner: Extracted<string>;
}

/** Fixed demo extraction, used for anything neither the form nor the file name provides. */
export const DEMO_EXTRACTION = {
  settore: 'saas-b2b',
  fase: 'seed',
  regione: 'lombardia',
  round: 300_000,
  oneLiner: MESSAGES.it.match.deck.demoOneLiner,
} as const satisfies { settore: Settore; fase: Fase; regione: Regione; round: number; oneLiner: string };

// Keyword → value, matched against the file name (lowercase, separators normalised to spaces).
const SETTORE_KEYWORDS: [string, Settore][] = [
  ['fintech', 'fintech'],
  ['insurtech', 'fintech'],
  ['pagamenti', 'fintech'],
  ['health', 'healthtech'],
  ['salute', 'healthtech'],
  ['medtech', 'healthtech'],
  ['agri', 'agritech'],
  ['clean', 'cleantech'],
  ['energia', 'cleantech'],
  ['saas', 'saas-b2b'],
  ['b2b', 'saas-b2b'],
  ['edtech', 'edtech'],
  ['scuola', 'edtech'],
  ['deeptech', 'deeptech'],
  ['mobilit', 'mobilita'],
  ['proptech', 'proptech'],
  ['immobil', 'proptech'],
  ['food', 'foodtech'],
  ['consumer', 'consumer'],
];

const FASE_KEYWORDS: [string, Fase][] = [
  ['pre seed', 'pre-seed'],
  ['preseed', 'pre-seed'],
  ['serie a', 'serie-a'],
  ['series a', 'serie-a'],
  ['seed', 'seed'],
];

const REGIONE_KEYWORDS: [string, Regione][] = [
  ['milano', 'lombardia'],
  ['milan', 'lombardia'],
  ['lombardia', 'lombardia'],
  ['torino', 'piemonte'],
  ['turin', 'piemonte'],
  ['piemonte', 'piemonte'],
  ['genova', 'liguria'],
  ['bologna', 'emilia-romagna'],
  ['venezia', 'veneto'],
  ['venice', 'veneto'],
  ['padova', 'veneto'],
  ['veneto', 'veneto'],
  ['trento', 'trentino-alto-adige'],
  ['trieste', 'friuli-venezia-giulia'],
  ['firenze', 'toscana'],
  ['florence', 'toscana'],
  ['toscana', 'toscana'],
  ['roma', 'lazio'],
  ['rome', 'lazio'],
  ['lazio', 'lazio'],
  ['napoli', 'campania'],
  ['naples', 'campania'],
  ['bari', 'puglia'],
  ['palermo', 'sicilia'],
  ['catania', 'sicilia'],
  ['cagliari', 'sardegna'],
];

function normaliseName(name: string): string {
  return ` ${name
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9àèéìòù]+/g, ' ')
    .trim()} `;
}

function findKeyword<T>(haystack: string, table: [string, T][]): T | undefined {
  return table.find(([k]) => haystack.includes(k))?.[1];
}

/** Trims to `max` characters at a word boundary, adding an ellipsis when cut. */
export function toOneLiner(text: string, max = ONE_LINER_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  // First sentence if it fits.
  const sentence = clean.match(/^.+?[.!?](?=\s|$)/)?.[0];
  if (sentence && sentence.length <= max) return sentence;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`;
}

/** Deterministic mock: form values win, then file-name keywords, then the fixed demo extraction. */
export function mockExtract(file: Pick<DeckMeta, 'name'> | null, form: StartupForm, locale: Locale = 'it'): Extraction {
  const hay = file ? normaliseName(file.name) : '';
  const pick = <T>(formValue: unknown, guard: (v: unknown) => v is T, keyword: T | undefined, demo: T): Extracted<T> => {
    if (guard(formValue)) return { value: formValue, fonte: 'modulo' };
    if (keyword !== undefined) return { value: keyword, fonte: 'deck' };
    return { value: demo, fonte: 'esempio' };
  };

  const roundFromName = hay.match(/ (\d{2,4}) ?k /)?.[1];
  const round: Extracted<number> =
    form.round && form.round > 0
      ? { value: form.round, fonte: 'modulo' }
      : roundFromName
        ? { value: Number(roundFromName) * 1000, fonte: 'deck' }
        : { value: DEMO_EXTRACTION.round, fonte: 'esempio' };

  const descr = form.descrizione.trim();
  return {
    settore: pick(form.settore, isSettore, findKeyword(hay, SETTORE_KEYWORDS), DEMO_EXTRACTION.settore),
    fase: pick(form.fase, isFase, findKeyword(hay, FASE_KEYWORDS), DEMO_EXTRACTION.fase),
    regione: pick(form.regione, isRegione, findKeyword(hay, REGIONE_KEYWORDS), DEMO_EXTRACTION.regione),
    round,
    oneLiner: descr ? { value: toOneLiner(descr), fonte: 'modulo' } : { value: MESSAGES[locale].match.deck.demoOneLiner, fonte: 'esempio' },
  };
}

const sizeFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${sizeFormat.format(Math.max(1, Math.round(bytes / 1024)))} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}
