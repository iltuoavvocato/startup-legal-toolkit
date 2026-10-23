// Simulated "l'agente ha letto il deck". The file is never read: only its name, type and size are used.
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
export function validateDeck(file: DeckMeta): string | null {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) return 'Carica il deck in formato PDF.';
  if (file.size <= 0) return 'Il file è vuoto: scegli un altro PDF.';
  if (file.size > MAX_DECK_MB * 1024 * 1024) return `Il file supera ${MAX_DECK_MB} MB: carica una versione più leggera.`;
  return null;
}

export const AGENT_STEPS = [
  'Lettura del deck',
  'Individuazione di settore e fase',
  'Stima del round',
  'Bozza del profilo',
] as const;

export type Fonte = 'deck' | 'modulo' | 'esempio';
export const FONTE_LABEL: Record<Fonte, string> = {
  deck: 'dal deck (simulato)',
  modulo: 'dal modulo',
  esempio: 'esempio',
};

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
  oneLiner: 'Software che semplifica un processo aziendale ripetitivo per le PMI italiane.',
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
  ['lombardia', 'lombardia'],
  ['torino', 'piemonte'],
  ['piemonte', 'piemonte'],
  ['genova', 'liguria'],
  ['bologna', 'emilia-romagna'],
  ['venezia', 'veneto'],
  ['padova', 'veneto'],
  ['veneto', 'veneto'],
  ['trento', 'trentino-alto-adige'],
  ['trieste', 'friuli-venezia-giulia'],
  ['firenze', 'toscana'],
  ['toscana', 'toscana'],
  ['roma', 'lazio'],
  ['lazio', 'lazio'],
  ['napoli', 'campania'],
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
export function mockExtract(file: Pick<DeckMeta, 'name'> | null, form: StartupForm): Extraction {
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
    oneLiner: descr ? { value: toOneLiner(descr), fonte: 'modulo' } : { value: DEMO_EXTRACTION.oneLiner, fonte: 'esempio' },
  };
}

const sizeFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${sizeFormat.format(Math.max(1, Math.round(bytes / 1024)))} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}
