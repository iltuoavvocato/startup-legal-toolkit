// Design variants gallery (internal, noindex): every variant screen renders with its prototype banner, the
// fictional-data label and the disclaimer; the compare view loads two live screens and follows its controls.
import { DISCLAIMER, LOCALES, ROUTE_IDS, expect, open, path, t, test } from './fixtures';

const VARIANT_IDS = ROUTE_IDS.filter((id) => /^matchV\d/.test(id));
const COPY = {
  it: { tag: 'Variante di design – prototipo', fictional: 'Dati di esempio fittizi' },
  en: { tag: 'Design variant – prototype', fictional: 'Fictional sample data' },
};

for (const lang of LOCALES) {
  for (const id of VARIANT_IDS) {
    test(`variant ${id} loads with banner and disclaimer (${lang})`, async ({ page }) => {
      await open(page, path(id, lang));
      const main = page.locator('main');
      // Case-insensitive: some variants set labels in uppercase with CSS, which innerText reflects.
      const text = (await main.innerText()).toLowerCase();
      for (const needle of [COPY[lang].tag, COPY[lang].fictional, DISCLAIMER[lang]]) {
        expect(text, `"${needle}" on ${id}`).toContain(needle.toLowerCase());
      }
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    });
  }

  test(`variants gallery: compare mode (${lang})`, async ({ page }) => {
    const g = t(lang).variants.gallery;
    await open(page, path('matchVariants', lang));
    const frames = page.locator('.vg-frame iframe');
    await expect(frames).toHaveCount(2);
    const waitFrames = async () => {
      for (let i = 0; i < 2; i++) {
        await frames.nth(i).scrollIntoViewIfNeeded();
        const f = frames.nth(i).contentFrame();
        await expect(f.locator('#page-title')).toBeVisible();
        // Embed mode: no site header inside the frame, but the banner and the disclaimer stay.
        await expect(f.locator('.site-header')).toHaveCount(0);
        await expect(f.locator('main')).toContainText(new RegExp(COPY[lang].tag, 'i'));
      }
    };
    await waitFrames();

    await page.getByLabel(g.left, { exact: true }).selectOption('v2');
    await page.getByLabel(g.screen, { exact: true }).selectOption('investor');
    await page.waitForURL((u) => u.searchParams.get('a') === 'v2' && u.searchParams.get('s') === 'investor');
    await expect(frames.first()).toHaveAttribute('src', /\/v2\/(investitore|investor)\/\?/);
    await waitFrames();

    // The selection survives a reload (it lives in the query string).
    await page.reload();
    await expect(frames.first()).toHaveAttribute('src', /\/v2\/(investitore|investor)\/\?/);
    await expect(page.locator('body')).toContainText(DISCLAIMER[lang]);
  });
}
