// URL scheme: Italian at the original URLs, English under /en/ with English slugs.
// The mapping lives in src/routes-meta.json (also read by scripts/prerender.mjs).
import meta from '../routes-meta.json';
import type { VariantRouteId } from '../variants/registry';
import { DEFAULT_LOCALE, type Locale } from './locales';

export type RouteId =
  | 'home'
  | 'equity'
  | 'vesting'
  | 'quiz'
  | 'privacy'
  | 'match'
  | 'matchStartup'
  | 'matchInvestor'
  | 'matchOptIn'
  | 'matchLegal'
  | 'matchVariants'
  | VariantRouteId;

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  heading: string;
}

interface RouteEntry {
  id: RouteId;
  /** Robots directive for pages kept out of search engines (also left out of the sitemap). */
  robots?: string;
  it: PageMeta;
  en: PageMeta;
}

export const ROUTES = meta.routes as RouteEntry[];
export const NOT_FOUND_META = meta.notFound as Record<Locale, Omit<PageMeta, 'path'>>;

const withSlash = (p: string) => (p.endsWith('/') ? p : `${p}/`);

/** Locale of a router pathname (relative to the base): /en and /en/… are English, everything else Italian. */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : DEFAULT_LOCALE;
}

export function pathFor(id: RouteId, locale: Locale): string {
  return ROUTES.find((r) => r.id === id)![locale].path;
}

export function routeFromPath(pathname: string): { id: RouteId; locale: Locale } | null {
  const p = withSlash(pathname);
  for (const r of ROUTES) {
    if (r.it.path === p) return { id: r.id, locale: 'it' };
    if (r.en.path === p) return { id: r.id, locale: 'en' };
  }
  return null;
}

/** Equivalent page in another locale; unknown pages map to that locale's home. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const route = routeFromPath(pathname);
  return pathFor(route ? route.id : 'home', target);
}

/** Robots directive of a page (e.g. "noindex, nofollow" for the design variants), or null. */
export function robotsFor(id: RouteId): string | null {
  return ROUTES.find((r) => r.id === id)?.robots ?? null;
}

export function metaFor(pathname: string): { meta: Omit<PageMeta, 'path'>; path: string | null; id: RouteId | null; locale: Locale } {
  const route = routeFromPath(pathname);
  if (route) {
    const entry = ROUTES.find((r) => r.id === route.id)!;
    return { meta: entry[route.locale], path: entry[route.locale].path, id: route.id, locale: route.locale };
  }
  const locale = localeFromPath(pathname);
  return { meta: NOT_FOUND_META[locale], path: null, id: null, locale };
}

/** Router path patterns (no trailing slash) for every page in every locale. */
export function routePatterns(): { id: RouteId; locale: Locale; pattern: string }[] {
  return ROUTES.flatMap((r) =>
    (['it', 'en'] as const).map((locale) => ({
      id: r.id,
      locale,
      pattern: r[locale].path === '/' ? '/' : r[locale].path.replace(/\/$/, ''),
    })),
  );
}
