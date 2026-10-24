export const ROBOTS_POLICY: { match: (id: string) => boolean; robots: string; why: string }[];
export function intendedRobots(id: string): string | null;
export const ALLOWED_BUNDLE_ORIGINS: string[];
export const TRACKERS: [string, RegExp][];
export function checkHtml(
  file: string,
  html: string,
  page: { id: string; locale: 'it' | 'en'; path: string } | null,
  config: { siteOrigin: string; siteNoindex: boolean },
): string[];
export function checkAsset(file: string, text: string): string[];
export function checkSitemap(xml: string, pageList: { id: string; path: string }[], abs: (path: string) => string): string[];
