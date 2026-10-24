// Language switcher keeps the equivalent route on every main page; bilingual 404; the site stores nothing but the
// language preference. (No request leaves localhost and no cookie is set: checked on every test by fixtures.ts.)
import type { Page } from '@playwright/test';
import { DISCLAIMER, LOCALES, ROUTE_IDS, expect, isMobile, open, path, test } from './fixtures';

// Main pages: everything except the variant screens (covered by variants.spec.ts).
const MAIN = ROUTE_IDS.filter((id) => !/^matchV\d/.test(id));
const other = (lang: 'it' | 'en') => (lang === 'it' ? 'en' : 'it');

async function switchTo(page: Page, lang: 'it' | 'en') {
  if (isMobile(page)) await page.locator('.menu-toggle').click();
  await page.locator(`.lang-switch a[hreflang="${lang}"]`).click();
}

for (const lang of LOCALES) {
  for (const id of MAIN) {
    test(`language switcher keeps the route: ${id} (${lang} → ${other(lang)} → ${lang})`, async ({ page, baseURL }) => {
      await open(page, path(id, lang));
      await expect(page.locator('body')).toContainText(DISCLAIMER[lang]);
      await switchTo(page, other(lang));
      await page.waitForURL(`${baseURL}${path(id, other(lang))}`);
      await expect(page.locator('html')).toHaveAttribute('lang', other(lang));
      await expect(page.locator('body')).toContainText(DISCLAIMER[other(lang)]);
      await switchTo(page, lang);
      await page.waitForURL(`${baseURL}${path(id, lang)}`);
      await expect(page.locator('body')).toContainText(DISCLAIMER[lang]);
      // Only the language preference is stored in localStorage.
      expect(await page.evaluate(() => Object.keys(window.localStorage))).toEqual(['lang']);
    });
  }
}

test('language switcher keeps the query string (directory filters)', async ({ page, baseURL }) => {
  await open(page, `${path('matchDirectory', 'it')}?fase=seed&settore=fintech`);
  await switchTo(page, 'en');
  await page.waitForURL(`${baseURL}${path('matchDirectory', 'en')}?fase=seed&settore=fintech`);
  await expect(page.locator('.mi-dir-chips')).toContainText(/fintech/i);
});

const NOT_FOUND = {
  it: { url: 'pagina-che-non-esiste/', heading: 'Pagina non trovata' },
  en: { url: 'en/page-that-does-not-exist/', heading: 'Page not found' },
};

for (const lang of LOCALES) {
  test(`404 page in ${lang}`, async ({ page }) => {
    const res = await page.goto(NOT_FOUND[lang].url);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('h1')).toHaveText(NOT_FOUND[lang].heading);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page).toHaveTitle(new RegExp(NOT_FOUND[lang].heading));
    await expect(page.locator('body')).toContainText(DISCLAIMER[lang]);
  });
}

test('the static 404.html picks the language from the path before the app runs', async ({ page, baseURL }) => {
  for (const lang of LOCALES) {
    const html = await (await page.request.get(`${baseURL}404.html`)).text();
    expect(html).toContain(NOT_FOUND[lang].heading);
  }
});
