// Shared vocabulary for the investor-matching prototype (MatchInvStar, nome provvisorio).

export const SETTORI = [
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthtech', label: 'Healthtech' },
  { value: 'agritech', label: 'Agritech' },
  { value: 'cleantech', label: 'Cleantech' },
  { value: 'saas-b2b', label: 'SaaS B2B' },
  { value: 'edtech', label: 'Edtech' },
  { value: 'deeptech', label: 'Deeptech' },
  { value: 'mobilita', label: 'Mobilità' },
  { value: 'proptech', label: 'Proptech' },
  { value: 'foodtech', label: 'Foodtech' },
  { value: 'consumer', label: 'Consumer' },
] as const;
export type Settore = (typeof SETTORI)[number]['value'];

export const FASI = [
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'serie-a', label: 'Serie A' },
] as const;
export type Fase = (typeof FASI)[number]['value'];

export const AREE = [
  { value: 'nord-ovest', label: 'Nord-Ovest' },
  { value: 'nord-est', label: 'Nord-Est' },
  { value: 'centro', label: 'Centro' },
  { value: 'sud-isole', label: 'Sud e Isole' },
] as const;
export type Area = (typeof AREE)[number]['value'];

// Regions with their ISTAT macro-area (Sud and Isole merged).
export const REGIONI = [
  { value: 'piemonte', label: 'Piemonte', area: 'nord-ovest' },
  { value: 'valle-aosta', label: 'Valle d’Aosta', area: 'nord-ovest' },
  { value: 'liguria', label: 'Liguria', area: 'nord-ovest' },
  { value: 'lombardia', label: 'Lombardia', area: 'nord-ovest' },
  { value: 'trentino-alto-adige', label: 'Trentino-Alto Adige', area: 'nord-est' },
  { value: 'veneto', label: 'Veneto', area: 'nord-est' },
  { value: 'friuli-venezia-giulia', label: 'Friuli-Venezia Giulia', area: 'nord-est' },
  { value: 'emilia-romagna', label: 'Emilia-Romagna', area: 'nord-est' },
  { value: 'toscana', label: 'Toscana', area: 'centro' },
  { value: 'umbria', label: 'Umbria', area: 'centro' },
  { value: 'marche', label: 'Marche', area: 'centro' },
  { value: 'lazio', label: 'Lazio', area: 'centro' },
  { value: 'abruzzo', label: 'Abruzzo', area: 'sud-isole' },
  { value: 'molise', label: 'Molise', area: 'sud-isole' },
  { value: 'campania', label: 'Campania', area: 'sud-isole' },
  { value: 'puglia', label: 'Puglia', area: 'sud-isole' },
  { value: 'basilicata', label: 'Basilicata', area: 'sud-isole' },
  { value: 'calabria', label: 'Calabria', area: 'sud-isole' },
  { value: 'sicilia', label: 'Sicilia', area: 'sud-isole' },
  { value: 'sardegna', label: 'Sardegna', area: 'sud-isole' },
] as const satisfies readonly { value: string; label: string; area: Area }[];
export type Regione = (typeof REGIONI)[number]['value'];

export const TIPI_INVESTITORE = [
  { value: 'business-angel', label: 'Business angel' },
  { value: 'club-deal', label: 'Club deal' },
  { value: 'micro-vc', label: 'Micro-VC' },
  { value: 'cvc', label: 'Corporate VC' },
  { value: 'family-office', label: 'Family office' },
  { value: 'acceleratore', label: 'Acceleratore' },
] as const;
export type TipoInvestitore = (typeof TIPI_INVESTITORE)[number]['value'];

function labelMap<T extends string>(list: readonly { value: T; label: string }[]): Record<T, string> {
  return Object.fromEntries(list.map((x) => [x.value, x.label])) as Record<T, string>;
}

export const SETTORE_LABEL = labelMap<Settore>(SETTORI);
export const FASE_LABEL = labelMap<Fase>(FASI);
export const AREA_LABEL = labelMap<Area>(AREE);
export const REGIONE_LABEL = labelMap<Regione>(REGIONI);
export const TIPO_LABEL = labelMap<TipoInvestitore>(TIPI_INVESTITORE);
export const AREA_DI = Object.fromEntries(REGIONI.map((r) => [r.value, r.area])) as Record<Regione, Area>;

export const isSettore = (v: unknown): v is Settore => SETTORI.some((x) => x.value === v);
export const isFase = (v: unknown): v is Fase => FASI.some((x) => x.value === v);
export const isArea = (v: unknown): v is Area => AREE.some((x) => x.value === v);
export const isRegione = (v: unknown): v is Regione => REGIONI.some((x) => x.value === v);

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
