// Design variants gallery (internal, noindex): every variant screen renders with its prototype banner, the
// fictional-data label and the disclaimer; the compare view loads two live screens and follows its controls.
import AxeBuilder from '@axe-core/playwright';
import { DISCLAIMER, LOCALES, ROUTE_IDS, expect, open, path, t, test } from './fixtures';
import type { RouteId } from '../src/i18n/routes';

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

  // The two mock screens of every variant (M12): a quick reply gets the agent's answer, the type filter narrows the
  // directory and the count follows; links lead to the real agent and directory; no serious axe issue after that.
  for (const v of [1, 2, 3, 4, 5]) {
    test(`variant V${v}: agent chat quick reply and directory filter (${lang})`, async ({ page }) => {
      const m = t(lang).variants;
      const d = t(lang).directory.dir;
      const axe = async () => {
        await page.waitForTimeout(400); // entrance transitions finish, colours are measured at rest
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => x.id)).toEqual([]);
      };

      await open(page, path(`matchV${v}Agent` as RouteId, lang));
      const main = page.locator('main');
      await expect(page.locator('h1')).toHaveText(m.screens.agent);
      await expect(main).toContainText(m.agentMock.questions.settore);
      await expect(main.locator('[role="log"] ol > li').first()).toBeVisible();
      await main.getByRole('button', { name: m.agentMock.chips.optin }).click();
      await expect(main).toContainText(m.agentMock.replyOptin);
      await expect(main.getByRole('button', { name: m.agentMock.chips.optin })).toHaveCount(0);
      await expect(main.getByRole('link', { name: m.agentMock.openReal })).toHaveAttribute('href', new RegExp(`${path('matchAgentStartup', lang)}$`));
      await axe();

      await open(page, path(`matchV${v}Directory` as RouteId, lang));
      await expect(page.locator('h1')).toHaveText(d.title);
      await expect(main).toContainText(d.count(36, 36));
      await expect(main.getByRole('link', { name: m.directoryMock.openReal })).toHaveAttribute('href', new RegExp(`${path('matchDirectory', lang)}$`));
      const tipo = t(lang).match.taxonomy.tipi['business-angel'];
      const filter = main.getByRole('radio', { name: new RegExp(`^${tipo}`) }).or(main.getByRole('button', { name: new RegExp(`^${tipo}`) }));
      await filter.first().click();
      await expect(main).toContainText(/\d+ (di|of) 36 /);
      const profiles = main.locator(`a[href*="${path('matchInvestorProfile', lang)}?id="]`);
      expect(await profiles.count()).toBeGreaterThan(0);
      await axe();
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

    // The new screens (M12) are in the compare view too.
    await page.getByLabel(g.screen, { exact: true }).selectOption('directory');
    await page.waitForURL((u) => u.searchParams.get('s') === 'directory');
    await expect(frames.first()).toHaveAttribute('src', /\/v2\/(investitori|directory)\/\?/);
    await waitFrames();
    await page.getByLabel(g.screen, { exact: true }).selectOption('agent');
    await expect(frames.nth(1)).toHaveAttribute('src', /\/v4\/(agente|agent)\/\?/);
    await waitFrames();
    await page.getByLabel(g.screen, { exact: true }).selectOption('investor');
    await page.waitForURL((u) => u.searchParams.get('s') === 'investor');

    // The selection survives a reload (it lives in the query string).
    await page.reload();
    await expect(frames.first()).toHaveAttribute('src', /\/v2\/(investitore|investor)\/\?/);
    await expect(page.locator('body')).toContainText(DISCLAIMER[lang]);
  });
}
