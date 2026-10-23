export interface LocaleMeta {
  path: string;
  title: string;
  description: string;
  heading: string;
}
export interface RoutesMeta {
  routes: { id: string; it: LocaleMeta; en: LocaleMeta }[];
  notFound: Record<'it' | 'en', Omit<LocaleMeta, 'path'>>;
}
export interface Page extends LocaleMeta {
  id: string;
  locale: 'it' | 'en';
  alternates: { it: string; en: string };
}
export interface SeoConfig {
  abs: (path: string) => string;
  base: string;
  siteNoindex: boolean;
}
export const LOCALES: ('it' | 'en')[];
export function normalizeBase(raw: string | undefined): string;
export function esc(s: string): string;
export function pages(meta: RoutesMeta): Page[];
export const DISCLAIMER: Record<'it' | 'en', string>;
export function notFoundPage(meta: RoutesMeta): Omit<LocaleMeta, 'path'> & {
  path: null;
  locale: 'it';
  noindex: true;
  alternates: null;
  notFound: RoutesMeta['notFound'];
};
export function homeRedirectScript(base: string): string;
export function notFoundLocaleScript(base: string, titles: { en: string }): string;
export function notFoundBody(notFound: RoutesMeta['notFound']): string;
export function headTags(
  page: { title: string; description: string; path: string | null; locale?: string; noindex?: boolean; alternates?: { it: string; en: string } | null },
  config: SeoConfig,
): string;
export function fallbackBody(page: { heading: string; description: string; locale?: string }): string;
export function renderPage(template: string, page: object, config: SeoConfig): string;
export function sitemapXml(meta: RoutesMeta, abs: (path: string) => string, today: string): string;
