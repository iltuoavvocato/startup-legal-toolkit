// Deck upload rules, agent step labels and the profile draft. The deck's text is read locally (pdfText.ts) and
// turned into findings (deckExtract.ts); the founder's choices on those findings arrive here as an AcceptedDeck.
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

/** Returns an error message in the given language, or null if the file is acceptable. */
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

/** Labels of the startup flow stepper; without a deck no step talks about reading one. */
export function startupFlowSteps(locale: Locale = 'it', hasDeck = true): readonly string[] {
  const u = MESSAGES[locale].match.ui.startup;
  return hasDeck ? u.steps : u.stepsNoDeck;
}

export type Fonte = 'deck' | 'modulo' | 'esempio';
export function fonteLabels(locale: Locale = 'it'): Record<Fonte, string> {
  return MESSAGES[locale].match.deck.fonti;
}

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
  /** Deck page, when fonte is 'deck'. */
  page?: number;
}

export interface Extraction {
  settore: Extracted<Settore>;
  fase: Extracted<Fase>;
  regione: Extracted<Regione>;
  round: Extracted<number>;
  oneLiner: Extracted<string>;
}

/** Fixed demo extraction, used for anything neither the deck review nor the form provides. */
export const DEMO_EXTRACTION = {
  settore: 'saas-b2b',
  fase: 'seed',
  regione: 'lombardia',
  round: 300_000,
  oneLiner: MESSAGES.it.match.deck.demoOneLiner,
} as const satisfies { settore: Settore; fase: Fase; regione: Regione; round: number; oneLiner: string };

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

export interface AcceptedValue<T> {
  value: T;
  /** Deck page the value comes from. */
  page: number;
}

/** What the founder chose to use from the deck review ("Cosa abbiamo trovato nel deck"). */
export interface AcceptedDeck {
  settore?: AcceptedValue<Settore>;
  fase?: AcceptedValue<Fase>;
  regione?: AcceptedValue<Regione>;
  round?: AcceptedValue<number>;
  team?: AcceptedValue<number>;
  /** Anonymous one-liner taken (or rewritten) from the deck's cover. */
  oneLiner?: AcceptedValue<string>;
  /** Traction lines as the founder accepted or rewrote them ("MRR 18.000 €"). */
  traction: AcceptedValue<string>[];
}

/**
 * Profile draft: what the founder accepted from the deck wins, then the form, then the fixed demo values (labelled
 * "esempio" in the review, so nothing is passed off as read from the deck).
 */
export function draftExtraction(form: StartupForm, deck: AcceptedDeck | null, locale: Locale = 'it'): Extraction {
  const pick = <T>(accepted: AcceptedValue<T> | undefined, formValue: unknown, guard: (v: unknown) => v is T, demo: T): Extracted<T> => {
    if (accepted) return { value: accepted.value, fonte: 'deck', page: accepted.page };
    if (guard(formValue)) return { value: formValue, fonte: 'modulo' };
    return { value: demo, fonte: 'esempio' };
  };
  const isRound = (v: unknown): v is number => typeof v === 'number' && v > 0;
  const descr = form.descrizione.trim();
  return {
    settore: pick(deck?.settore, form.settore, isSettore, DEMO_EXTRACTION.settore),
    fase: pick(deck?.fase, form.fase, isFase, DEMO_EXTRACTION.fase),
    regione: pick(deck?.regione, form.regione, isRegione, DEMO_EXTRACTION.regione),
    round: pick(deck?.round, form.round, isRound, DEMO_EXTRACTION.round),
    oneLiner: deck?.oneLiner
      ? { value: toOneLiner(deck.oneLiner.value), fonte: 'deck', page: deck.oneLiner.page }
      : descr
        ? { value: toOneLiner(descr), fonte: 'modulo' }
        : { value: MESSAGES[locale].match.deck.demoOneLiner, fonte: 'esempio' },
  };
}

const sizeFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${sizeFormat.format(Math.max(1, Math.round(bytes / 1024)))} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}
