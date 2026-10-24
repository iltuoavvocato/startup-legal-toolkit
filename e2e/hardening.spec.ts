// Milestone 10: stored state that is corrupt, of the wrong shape or unreadable never blanks a page; render errors on
// matching pages show a bilingual fallback whose "Ricomincia" clears only the demo's keys; browsers without the
// pdf.js features get the form without the deck step; the privacy page explains and clears the demo data.
import type { Page } from '@playwright/test';
import { DISCLAIMER, LOCALES, expect, open, path, t, test } from './fixtures';

const KEYS = ['matchinvstar-inbox', 'matchinvstar-export', 'matchinvstar-agent-startup', 'matchinvstar-agent-investor'];
const PAGES = ['match', 'matchStartup', 'matchInvestor', 'matchAgentStartup', 'matchAgentInvestor', 'matchOptIn', 'matchDirectory', 'matchInvestorProfile', 'matchRequests', 'matchExport', 'matchGuidedDemo', 'privacy'];

const CORRUPT: Record<string, string[]> = {
  json: ['{', '{', '{"version":1', '\u0000'],
  shape: [
    '{"v":1,"offsetDays":"x","profile":[],"requests":[null,1,{"id":"r","role":"founder","state":"intro"}]}',
    '{"v":1,"startup":"x","investor":{"thesis":5}}',
    '{"version":1,"mode":"startup","phase":"results","answers":{},"deck":{"status":"read","signals":"x"},"messages":[null],"nextId":3}',
    'null',
  ],
};

function seed(page: Page, values: string[], lang = '"it"') {
  return page.addInitScript(
    ([keys, vals, l]) => {
      keys.forEach((k, i) => window.sessionStorage.setItem(k, vals[i]!));
      window.localStorage.setItem('lang', l);
    },
    [KEYS, values, lang] as const,
  );
}

async function expectRendered(page: Page, lang: 'it' | 'en') {
  await expect(page.locator('#page-title')).toBeVisible();
  await expect(page.locator('body')).toContainText(DISCLAIMER[lang]);
  await expect(page.getByRole('heading', { name: t(lang).hardening.boundary.title })).toHaveCount(0);
}

for (const lang of LOCALES) {
  for (const [kind, values] of Object.entries(CORRUPT)) {
    test(`corrupt storage (${kind}): every matching page still renders (${lang})`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await seed(page, values, kind === 'json' ? '"{oops"' : '"xx"');
      for (const id of PAGES) {
        await open(page, path(id, lang) + (id === 'matchInvestorProfile' ? '?id=i01' : ''));
        await expectRendered(page, lang);
      }
      expect(errors).toEqual([]);
    });
  }

  test(`storage disabled or throwing: pages render and flows still work (${lang})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      const deny = () => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      };
      Object.defineProperty(window, 'sessionStorage', { get: deny, configurable: true });
      Object.defineProperty(window, 'localStorage', { get: deny, configurable: true });
    });
    for (const id of PAGES) {
      await open(page, path(id, lang));
      await expectRendered(page, lang);
    }
    // The agent still answers without storage.
    await open(page, path('matchAgentInvestor', lang));
    await expect(page.locator('.mi-agent-chip').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`render error: bilingual fallback, "Ricomincia" clears only the demo keys (${lang})`, async ({ page }) => {
    const b = t(lang).hardening.boundary;
    const chunk = /\/assets\/MatchRequestsPage-[^/]+\.js$/;
    await open(page, path('privacy', lang));
    await page.evaluate(
      ([keys, l]) => {
        for (const k of keys) window.sessionStorage.setItem(k, '{}');
        window.sessionStorage.setItem('unrelated', '1');
        window.localStorage.setItem('lang', l);
      },
      [KEYS, lang] as const,
    );
    // A page chunk that can't be downloaded (offline, bad deploy) is the simplest real render error.
    await page.route(chunk, (route) => route.abort());
    await page.goto(path('matchRequests', lang));
    await expect(page.getByRole('heading', { level: 1, name: b.title })).toBeVisible();
    await expect(page.locator('body')).toContainText(DISCLAIMER[lang]);
    await expect(page.getByRole('link', { name: b.home })).toBeVisible();
    await page.unroute(chunk);
    const reloaded = page.waitForEvent('load');
    await page.getByRole('button', { name: b.restart }).click();
    await reloaded;
    await expectRendered(page, lang);
    // The seeded values are gone (the requests page may write a fresh inbox again); other keys are untouched.
    const left = await page.evaluate((keys) => ({
      seeded: keys.filter((k) => window.sessionStorage.getItem(k) === '{}'),
      unrelated: window.sessionStorage.getItem('unrelated'),
      lang: window.localStorage.getItem('lang'),
    }), KEYS);
    expect(left).toEqual({ seeded: [], unrelated: '1', lang });
  });

}
