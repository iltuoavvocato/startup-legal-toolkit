// Shared fixtures for the e2e suite. Every test runs with two guards (auto fixtures):
// - no request may leave localhost (the site must make no network calls with user data, no CDN, no trackers);
// - no cookie may be set (the site only stores the language preference in localStorage).
import { test as base, expect, type Page } from '@playwright/test';
import { MESSAGES } from '../src/i18n/messages';
import type { Locale } from '../src/i18n/locales';
import { readFileSync } from 'node:fs';

type RouteEntry = { id: string; it: { path: string }; en: { path: string } };
// Read with fs: Node's ESM loader would need an import attribute for the JSON.
const ROUTES: RouteEntry[] = JSON.parse(readFileSync(new URL('../src/routes-meta.json', import.meta.url), 'utf8')).routes;
export const ROUTE_IDS = ROUTES.map((r) => r.id);

export const LOCALES: Locale[] = ['it', 'en'];

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

export const test = base.extend<{ networkGuard: void }>({
  networkGuard: [
    async ({ context }, use) => {
      const external: string[] = [];
      context.on('request', (req) => {
        const url = new URL(req.url());
        if ((url.protocol === 'http:' || url.protocol === 'https:' || url.protocol.startsWith('ws')) && !LOCAL_HOSTS.has(url.hostname)) {
          external.push(req.url());
        }
      });
      // Abort anything external so a leak can't slow the test down; the assertion below still fails it.
      await context.route(/^(https?|wss?):\/\/(?!(127\.0\.0\.1|localhost)[:/])/, (route) => route.abort());
      await use();
      expect(external, 'requests to non-localhost hosts').toEqual([]);
      expect(await context.cookies(), 'cookies set').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** UI copy, straight from the app's dictionaries (so the tests follow copy changes in both languages). */
export const t = (lang: Locale) => MESSAGES[lang];

/** Path relative to baseURL (no leading slash), e.g. `match-investitori/` or `en/investor-match/`. */
export function path(id: string, lang: Locale): string {
  const route = ROUTES.find((r) => r.id === id);
  if (!route) throw new Error(`unknown route ${id}`);
  return route[lang].path.replace(/^\//, '');
}

export const DISCLAIMER: Record<Locale, string> = {
  it: 'Strumento indicativo: non sostituisce una consulenza legale.',
  en: 'Indicative tool: not a substitute for legal advice.',
};

/** Words that would reveal the other side's "no" on the asking side (same lists as scripts/directory-flows.mjs). */
export const REVEAL: Record<Locale, RegExp> = {
  it: /ha rifiutato|ha detto no|non è interessat|rifiutata dall/i,
  en: /declined by|(investor|startup) said no|not interested|rejected/i,
};

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 900;

/** Opens a page and waits for the app to render its heading. */
export async function open(page: Page, url: string) {
  await page.goto(url);
  await page.locator('#page-title').waitFor();
}

/** Opens a page with an empty sessionStorage (inbox, conversation, export profile). */
export async function openFresh(page: Page, url: string) {
  // Cleared from a page that stores nothing, so the target page can't save restored state again after the clear.
  await page.goto('privacy/');
  await page.evaluate(() => window.sessionStorage.clear());
  await open(page, url);
}

/** The disclaimer is in the site footer on every page (tool pages repeat it in the content). */
export async function expectDisclaimer(page: Page, lang: Locale) {
  await expect(page.locator('body')).toContainText(DISCLAIMER[lang]);
}
