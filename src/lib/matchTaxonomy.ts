// Shared vocabulary for the investor-matching prototype (MatchInvStar, nome provvisorio).
// Values are stable identifiers (also used in URLs); labels come from the dictionaries (src/i18n/messages/match.ts).
import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';

export const SETTORI = [
  'fintech',
  'healthtech',
  'agritech',
  'cleantech',
  'saas-b2b',
  'edtech',
  'deeptech',
  'mobilita',
  'proptech',
  'foodtech',
  'consumer',
] as const;
export type Settore = (typeof SETTORI)[number];

export const FASI = ['pre-seed', 'seed', 'serie-a'] as const;
export type Fase = (typeof FASI)[number];

export const AREE = ['nord-ovest', 'nord-est', 'centro', 'sud-isole'] as const;
export type Area = (typeof AREE)[number];

// Regions with their ISTAT macro-area (Sud and Isole merged).
export const AREA_DI = {
  piemonte: 'nord-ovest',
  'valle-aosta': 'nord-ovest',
  liguria: 'nord-ovest',
  lombardia: 'nord-ovest',
  'trentino-alto-adige': 'nord-est',
  veneto: 'nord-est',
  'friuli-venezia-giulia': 'nord-est',
  'emilia-romagna': 'nord-est',
  toscana: 'centro',
  umbria: 'centro',
  marche: 'centro',
  lazio: 'centro',
  abruzzo: 'sud-isole',
  molise: 'sud-isole',
  campania: 'sud-isole',
  puglia: 'sud-isole',
  basilicata: 'sud-isole',
  calabria: 'sud-isole',
  sicilia: 'sud-isole',
  sardegna: 'sud-isole',
} as const satisfies Record<string, Area>;
export type Regione = keyof typeof AREA_DI;
export const REGIONI = Object.keys(AREA_DI) as Regione[];

export const TIPI_INVESTITORE = ['business-angel', 'club-deal', 'micro-vc', 'cvc', 'family-office', 'acceleratore'] as const;
export type TipoInvestitore = (typeof TIPI_INVESTITORE)[number];

export interface Labels {
  settore: Record<Settore, string>;
  fase: Record<Fase, string>;
  area: Record<Area, string>;
  regione: Record<Regione, string>;
  tipo: Record<TipoInvestitore, string>;
}

export function labelsFor(locale: Locale = 'it'): Labels {
  const t = MESSAGES[locale].match.taxonomy;
  return { settore: t.settori, fase: t.fasi, area: t.aree, regione: t.regioni, tipo: t.tipi };
}

/** {value, label} options for selects and chips, in the given order. */
export function optionsOf<T extends string>(values: readonly T[], labels: Record<T, string>): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

export const isSettore = (v: unknown): v is Settore => SETTORI.includes(v as Settore);
export const isFase = (v: unknown): v is Fase => FASI.includes(v as Fase);
export const isArea = (v: unknown): v is Area => AREE.includes(v as Area);
export const isRegione = (v: unknown): v is Regione => typeof v === 'string' && Object.prototype.hasOwnProperty.call(AREA_DI, v);

export interface Investor {
  id: string;
  nome: string;
  tipo: TipoInvestitore;
  /** settori[0] is the main focus; 'tutti' = generalist. */
  settori: Settore[] | 'tutti';
  /** fasi[0] is the main stage. */
  fasi: Fase[];
  ticketMin: number;
  ticketMax: number;
  aree: Area[] | 'italia';
  /** Region of the investor's base; null when not given (no same-region bonus). */
  sede: Regione | null;
  tesi: string;
  referente: string;
  email: string;
}

export interface StartupProfile {
  id: string;
  nome: string;
  settore: Settore;
  fase: Fase;
  regione: Regione;
  /** € sought in the round. */
  round: number;
  oneLiner: string;
  founder: string;
  email: string;
}

export const ONE_LINER_MAX = 140;
