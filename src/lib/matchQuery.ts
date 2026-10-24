// URL encoding for the matching section. Only enumerated values and amounts go in the URL:
// names, descriptions and file names never do.
import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';
import {
  isArea,
  isFase,
  isRegione,
  isSettore,
  type Area,
  type Fase,
  type Investor,
  type Regione,
  type Settore,
  type StartupProfile,
} from './matchTaxonomy';

export interface StartupCore {
  settore: Settore;
  fase: Fase;
  regione: Regione;
  round: number;
}

export interface Thesis {
  settori: Settore[];
  fasi: Fase[];
  ticketMin: number;
  ticketMax: number;
  aree: Area[] | 'italia';
  sede: Regione | null;
}

const MAX_AMOUNT = 1_000_000_000;

function amount(raw: string | null): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 && n <= MAX_AMOUNT ? n : null;
}

function listOf<T>(raw: string | null, guard: (v: unknown) => v is T): T[] {
  if (!raw) return [];
  return [...new Set(raw.split('.'))].filter((v): v is string & T => guard(v));
}

export function startupToQuery(s: StartupCore): Record<string, string> {
  return { settore: s.settore, fase: s.fase, regione: s.regione, round: String(s.round) };
}

export function startupFromQuery(q: URLSearchParams): StartupCore | null {
  const settore = q.get('settore');
  const fase = q.get('fase');
  const regione = q.get('regione');
  const round = amount(q.get('round'));
  if (!isSettore(settore) || !isFase(fase) || !isRegione(regione) || round === null) return null;
  return { settore, fase, regione, round };
}

export function thesisToQuery(t: Thesis): Record<string, string> {
  return {
    settori: t.settori.join('.'),
    fasi: t.fasi.join('.'),
    min: String(t.ticketMin),
    max: String(t.ticketMax),
    aree: t.aree === 'italia' ? 'italia' : t.aree.join('.'),
    ...(t.sede ? { sede: t.sede } : {}),
  };
}

export function thesisFromQuery(q: URLSearchParams): Thesis | null {
  const settori = listOf(q.get('settori'), isSettore);
  const fasi = listOf(q.get('fasi'), isFase);
  const ticketMin = amount(q.get('min'));
  const ticketMax = amount(q.get('max'));
  const rawAree = q.get('aree');
  const aree: Area[] | 'italia' = rawAree === 'italia' ? 'italia' : listOf(rawAree, isArea);
  if (!settori.length || !fasi.length || ticketMin === null || ticketMax === null || ticketMin > ticketMax) return null;
  if (aree !== 'italia' && !aree.length) return null;
  const sede = q.get('sede');
  return { settori, fasi, ticketMin, ticketMax, aree, sede: isRegione(sede) ? sede : null };
}

/** Thesis validation for the investor form; returns error messages keyed by field. */
export function thesisErrors(
  t: {
    settori: string[];
    fasi: string[];
    ticketMin: number | null;
    ticketMax: number | null;
    aree: string[];
  },
  locale: Locale = 'it',
): Partial<Record<'settori' | 'fasi' | 'ticket' | 'aree', string>> {
  const m = MESSAGES[locale].match.thesisErrors;
  const errors: Partial<Record<'settori' | 'fasi' | 'ticket' | 'aree', string>> = {};
  if (!t.settori.length) errors.settori = m.settori;
  if (!t.fasi.length) errors.fasi = m.fasi;
  if (!t.ticketMin || !t.ticketMax || t.ticketMin <= 0 || t.ticketMax <= 0) errors.ticket = m.ticketMissing;
  else if (t.ticketMin > t.ticketMax) errors.ticket = m.ticketOrder;
  if (!t.aree.length) errors.aree = m.aree;
  return errors;
}

export const YOUR_ID = 'tu';

/** The user's own startup, with in-memory names (or neutral placeholders). */
export function ownStartup(
  core: StartupCore,
  extra?: Partial<Pick<StartupProfile, 'nome' | 'founder' | 'oneLiner'>>,
  locale: Locale = 'it',
): StartupProfile {
  const m = MESSAGES[locale].match.own;
  return {
    id: YOUR_ID,
    ...core,
    nome: extra?.nome?.trim() || m.startupName,
    founder: extra?.founder?.trim() || m.founder,
    oneLiner: extra?.oneLiner?.trim() || m.noDescription,
    email: 'founder@startup.example',
  };
}

/** The user's own investor profile built from the thesis. */
export function ownInvestor(t: Thesis, extra?: { nome?: string; referente?: string }, locale: Locale = 'it'): Investor {
  const m = MESSAGES[locale].match.own;
  return {
    id: YOUR_ID,
    nome: extra?.nome?.trim() || m.investorName,
    tipo: 'business-angel',
    settori: t.settori,
    fasi: t.fasi,
    ticketMin: t.ticketMin,
    ticketMax: t.ticketMax,
    aree: t.aree,
    sede: t.sede,
    tesi: m.investorThesis,
    referente: extra?.referente?.trim() || m.investorContact,
    email: 'investitore@esempio.example',
  };
}
