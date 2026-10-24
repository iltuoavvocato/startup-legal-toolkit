// Design variants gallery (internal, noindex): five design directions × five screens of MatchInvStar.
export const VARIANT_IDS = ['v1', 'v2', 'v3', 'v4', 'v5'] as const;
export type VariantId = (typeof VARIANT_IDS)[number];

export const SCREENS = ['landing', 'results', 'investor', 'agent', 'directory'] as const;
export type Screen = (typeof SCREENS)[number];

export type VariantRouteId = `match${Uppercase<VariantId>}${Capitalize<Screen>}`;

export function variantRouteId(variant: VariantId, screen: Screen): VariantRouteId {
  return `match${variant.toUpperCase()}${screen[0]!.toUpperCase()}${screen.slice(1)}` as VariantRouteId;
}

/** Inverse of variantRouteId; null for any other route id. */
export function parseVariantRouteId(id: string): { variant: VariantId; screen: Screen } | null {
  const m = id.match(/^match(V\d)(Landing|Results|Investor|Agent|Directory)$/);
  if (!m) return null;
  const variant = m[1]!.toLowerCase() as VariantId;
  const screen = m[2]!.toLowerCase() as Screen;
  return VARIANT_IDS.includes(variant) && SCREENS.includes(screen) ? { variant, screen } : null;
}

export const VARIANT_ROUTE_IDS: VariantRouteId[] = VARIANT_IDS.flatMap((v) => SCREENS.map((s) => variantRouteId(v, s)));

/** Query flag used by the compare view: the page renders without the site header and footer. */
export const EMBED_PARAM = 'embed';
export const isEmbedded = (search: string) => new URLSearchParams(search).get(EMBED_PARAM) === '1';
