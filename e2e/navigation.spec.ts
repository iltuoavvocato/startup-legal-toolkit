// Pages load as separate chunks: client-side navigation must still render the page and move focus to its heading,
// even when the chunk arrives late (slow network), and a direct visit must not flash the loading text.
import { LOCALES, expect, isMobile, open, path, t, test } from './fixtures';

for (const lang of LOCALES) {
  test(`client-side navigation to a slow page chunk focuses the new heading (${lang})`, async ({ page }) => {
    // Delay the equity page's chunk so the loading state shows and the heading appears later.
    await page.route(/\/assets\/EquityPage-[\w-]+\.js$/, async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await open(page, path('home', lang));
    if (isMobile(page)) await page.locator('.menu-toggle').click();
    await page.locator('#site-nav').getByRole('link', { name: t(lang).common.nav.equity, exact: true }).click();
    await page.waitForURL((u) => u.pathname.endsWith(`/${path('equity', lang)}`));
    await expect(page.locator('#page-title')).toBeFocused({ timeout: 5000 });
    await expect(page.locator('main')).not.toContainText(t(lang).variants.loading);
  });

  test(`a direct visit renders the page without the loading text (${lang})`, async ({ page }) => {
    const seen: string[] = [];
    await page.exposeFunction('reportText', (s: string) => seen.push(s));
    await page.addInitScript((needle) => {
      new MutationObserver(() => {
        if (document.body?.innerText.includes(needle)) (window as unknown as { reportText: (s: string) => void }).reportText(needle);
      }).observe(document, { childList: true, subtree: true });
    }, t(lang).variants.loading);
    await open(page, path('matchDirectory', lang));
    expect(seen).toEqual([]);
  });

  test(`the robots meta follows the route on client-side navigation (${lang})`, async ({ page }) => {
    const robots = page.locator('meta[name="robots"]');
    await open(page, path('match', lang));
    await expect(robots).toHaveCount(0);
    await page.getByRole('link', { name: t(lang).directory.dir.requestsLink }).first().click();
    await page.waitForURL((u) => u.pathname.endsWith(`/${path('matchRequests', lang)}`));
    await expect(robots).toHaveAttribute('content', 'noindex, follow');
    await page.goBack();
    await page.waitForURL((u) => u.pathname.endsWith(`/${path('match', lang)}`));
    await expect(robots).toHaveCount(0);
  });
}
