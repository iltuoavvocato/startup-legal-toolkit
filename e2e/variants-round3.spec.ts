// Design variants, round 3: the double opt-in inbox and the teaser one-pager in every variant. Founder tab with
// proposals in four visible states (a declined one looks exactly like one nobody answered), investor tab with
// anonymous teasers, the one-pager without the startup's name; axe, no overflow at 320 px, compare switching,
// and the selected tab still visible under forced colours.
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { DISCLAIMER, LOCALES, expect, open, path, settle, t, test } from './fixtures';
import type { RouteId } from '../src/i18n/routes';
import { demoInvestors, EXAMPLE_STARTUP_FORM } from '../src/data/matchDemo';

const VARIANTS = [1, 2, 3, 4, 5] as const;

async function axe(page: Page) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => x.id)).toEqual([]);
}

async function noOverflowAt320(page: Page, what: string) {
  await page.setViewportSize({ width: 320, height: 800 });
  await settle(page);
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth }));
  expect(o.sw, `${what}: page scrolls horizontally at 320 px`).toBeLessThanOrEqual(o.vw);
}

for (const lang of LOCALES) {
  for (const v of VARIANTS) {
    test(`variant V${v}: requests inbox, founder and investor tabs (${lang})`, async ({ page }) => {
      const m = t(lang).variants;
      const c = m.requestsMock;
      await open(page, path(`matchV${v}Requests` as RouteId, lang));
      const main = page.locator('main');
      await expect(page.locator('h1')).toHaveText(m.screens.requests);
      await expect(main).toContainText(DISCLAIMER[lang]);
      const tabs = main.getByRole('group', { name: c.tabsLabel });
      const founderTab = tabs.getByRole('button', { name: new RegExp(`^${c.tabs.founder}`) });
      const investorTab = tabs.getByRole('button', { name: new RegExp(`^${c.tabs.investor}`) });
      await expect(founderTab).toHaveAttribute('aria-pressed', 'true');

      // Founder side: one proposal per visible state; the declined one and the unanswered one are the two "waiting" rows.
      const rows = main.locator('.vx-req');
      await expect(rows).toHaveCount(5);
      for (const s of ['your-turn', 'intro', 'expired'] as const) {
        await expect(main.locator(`.vx-req[data-status="${s}"]`)).toHaveCount(1);
        await expect(main.locator(`.vx-req[data-status="${s}"]`)).toContainText(c.status[s]);
      }
      const waiting = main.locator('.vx-req[data-status="waiting"]');
      await expect(waiting).toHaveCount(2);
      // Everything but the investor's own name and type must match.
      const own = [...demoInvestors(lang).map((i) => i.nome), ...Object.values(t(lang).match.taxonomy.tipi)].sort((x, y) => y.length - x.length);
      const shape = (row: Locator) =>
        row.evaluate((el, words) => {
          let text = (el as HTMLElement).innerText;
          for (const w of words) text = text.split(w).join('·');
          return {
            cls: el.className,
            tags: Array.from(el.querySelectorAll('*')).map((e) => `${e.tagName}.${e.getAttribute('class') ?? ''}`).join(' '),
            text: text.replace(/\s+/g, ' ').trim(),
          };
        }, own);
      const [a, b] = [await shape(waiting.nth(0)), await shape(waiting.nth(1))];
      expect(a, 'declined proposal looks like an unanswered one').toEqual(b);
      await expect(waiting.nth(0)).toContainText(c.status.waiting);
      await expect(main).not.toContainText(c.status['declined-by-you']);
      await expect(main.getByRole('link', { name: c.openReal })).toHaveAttribute('href', new RegExp(`${path('matchRequests', lang)}$`));
      await axe(page);

      // Investor side: anonymous teasers until the intro.
      await investorTab.click();
      await expect(investorTab).toHaveAttribute('aria-pressed', 'true');
      await expect(founderTab).toHaveAttribute('aria-pressed', 'false');
      await expect(rows).toHaveCount(4);
      await expect(main.locator('.vx-req', { hasText: c.anonymous })).toHaveCount(3);
      await expect(main.locator('.vx-req[data-status="intro"]')).not.toContainText(c.anonymous);
      await axe(page);
      await noOverflowAt320(page, `V${v} requests`);
    });

    test(`variant V${v}: teaser one-pager (${lang})`, async ({ page }) => {
      const m = t(lang).variants;
      const D = t(lang).exportDoc.doc;
      await open(page, path(`matchV${v}Export` as RouteId, lang));
      const main = page.locator('main');
      await expect(page.locator('h1')).toHaveText(m.screens.export);
      await expect(main.getByRole('heading', { name: D.startupTitle.teaser })).toBeVisible();
      await expect(main).toContainText(D.profile);
      await expect(main).toContainText(D.optinTitle);
      await expect(main).not.toContainText(EXAMPLE_STARTUP_FORM.nome);
      await expect(main).not.toContainText(EXAMPLE_STARTUP_FORM.founder);
      await expect(main.getByRole('link', { name: m.exportMock.openReal })).toHaveAttribute('href', new RegExp(`${path('matchExport', lang)}$`));
      await axe(page);
      await noOverflowAt320(page, `V${v} export`);
    });
  }

  test(`variants gallery: compare switches to the round-3 screens (${lang})`, async ({ page }) => {
    const g = t(lang).variants.gallery;
    await open(page, path('matchVariants', lang));
    const frames = page.locator('.vg-frame iframe');
    await page.getByLabel(g.screen, { exact: true }).selectOption('requests');
    await page.waitForURL((u) => u.searchParams.get('s') === 'requests');
    await expect(frames.first()).toHaveAttribute('src', /\/v1\/(richieste|requests)\/\?/);
    await expect(frames.nth(1)).toHaveAttribute('src', /\/v4\/(richieste|requests)\/\?/);
    await page.getByLabel(g.right, { exact: true }).selectOption('v5');
    await page.getByLabel(g.screen, { exact: true }).selectOption('export');
    await page.waitForURL((u) => u.searchParams.get('s') === 'export' && u.searchParams.get('b') === 'v5');
    await expect(frames.nth(1)).toHaveAttribute('src', /\/v5\/(esporta|export)\/\?/);
    for (let i = 0; i < 2; i++) {
      await frames.nth(i).scrollIntoViewIfNeeded();
      await expect(frames.nth(i).contentFrame().locator('#page-title')).toHaveText(t(lang).variants.screens.export);
    }
    // The gallery cards link to the new screens too.
    await expect(page.locator(`a[href$="${path('matchV3Requests', lang)}"]`).first()).toBeVisible();
  });
}

// Forced colours (M15 skipped the variants): the pressed tab differs from the other one in what forced colours keep.
test.describe('forced colours on the variant screens', () => {
  test.use({ colorScheme: 'light' });
  for (const v of VARIANTS) {
    test(`forced colours: V${v} requests tabs and banner (it)`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'desktop only');
      await page.emulateMedia({ forcedColors: 'active' });
      const c = t('it').variants.requestsMock;
      await open(page, path(`matchV${v}Requests` as RouteId, 'it'));
      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
      const look = (l: Locator) =>
        l.evaluate((el) => {
          const one = (e: Element) => {
            const s = getComputedStyle(e);
            return [s.backgroundColor, s.color, s.borderBottomWidth, s.borderBottomStyle, s.borderTopWidth, s.outlineStyle, s.textDecorationLine, s.fontWeight].join(' ');
          };
          return [one(el), ...Array.from(el.querySelectorAll('*')).map(one)].join(' / ');
        });
      const tabs = page.getByRole('group', { name: c.tabsLabel });
      const on = tabs.getByRole('button', { name: new RegExp(`^${c.tabs.founder}`) });
      const off = tabs.getByRole('button', { name: new RegExp(`^${c.tabs.investor}`) });
      expect(await look(on), 'pressed tab vs the other').not.toBe(await look(off));
      const seg = page.locator('.vx-seg-variants a');
      expect(await look(seg.nth(v - 1)), 'current variant vs another').not.toBe(await look(seg.nth(v % 5)));
      await page.screenshot({ path: `screenshots/forced-colors/variant-v${v}-requests.png`, fullPage: true });
    });
  }
});
