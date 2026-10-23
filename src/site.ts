import meta from './routes-meta.json';

export type ToolCampaign = 'home' | 'equity' | 'vesting' | 'quiz' | 'match';

export const LAWYER_URL = 'https://iltuoavvocato.com/';

export function lawyerUrl(campaign: ToolCampaign): string {
  return `${LAWYER_URL}?utm_source=toolkit&utm_medium=referral&utm_campaign=${campaign}`;
}

export const DISCLAIMER = 'Strumento indicativo: non sostituisce una consulenza legale.';

export const BASE_URL = import.meta.env.BASE_URL;
export const SITE_URL = __SITE_URL__;

/** Public asset path that respects the configured base. */
export function asset(path: string): string {
  return `${BASE_URL}${path.replace(/^\//, '')}`;
}

export function absoluteUrl(routePath: string): string {
  return `${SITE_URL}${BASE_URL}${routePath.replace(/^\//, '')}`;
}

export interface RouteMeta {
  title: string;
  description: string;
  heading: string;
}

export function metaFor(path: string): RouteMeta & { path: string | null } {
  const route = meta.routes.find((r) => r.path === path);
  return route ? route : { ...meta.notFound, path: null };
}
