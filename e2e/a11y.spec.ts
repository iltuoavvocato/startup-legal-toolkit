// Accessibility: axe-core scan (WCAG 2.0/2.1 A + AA) of every route in both languages and of the key interactive
// states. Serious and critical violations fail the test; moderate/minor ones are attached to the report.
import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { founderWithDeck } from '../scripts/agent-flows.mjs';
import { exportStartupTeaser } from '../scripts/export-flows.mjs';
import { LOCALES, ROUTE_IDS, expect, isMobile, open, openFresh, path, settle, t, test } from './fixtures';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page, testInfo: TestInfo, include?: string) {
  // Colours are measured at rest: no agent message still arriving, entrance transitions finished.
  await settle(page);
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  const summary = violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 40).map((n) => `${n.target.join(' ')} — ${n.failureSummary?.split('\n').slice(1, 2).join('').trim()}`),
  }));
  if (summary.length) await testInfo.attach('axe-violations', { body: JSON.stringify(summary, null, 2), contentType: 'application/json' });
  const blocking = summary.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking, `serious/critical axe violations on ${page.url()}`).toEqual([]);
}

for (const lang of LOCALES) {
  for (const id of ROUTE_IDS) {
    test(`axe: ${id} (${lang})`, async ({ page }, testInfo) => {
      const extra = id === 'matchInvestorProfile' || id === 'matchExport' ? '?id=i01' : '';
      await openFresh(page, `${path(id, lang)}${extra}`);
      await scan(page, testInfo);
    });
  }

  test(`axe: 404 (${lang})`, async ({ page }, testInfo) => {
    await page.goto(lang === 'it' ? 'pagina-che-non-esiste/' : 'en/page-that-does-not-exist/');
    await page.locator('h1').waitFor();
    await scan(page, testInfo);
  });

  test(`axe: startup form, deck findings review (${lang})`, async ({ page }, testInfo) => {
    const m = t(lang).match.ui;
    await openFresh(page, path('matchStartup', lang));
    await page.getByRole('button', { name: m.dropzone.sample }).click();
    await page.getByRole('button', { name: m.startup.submitDeck }).click();
    await page.getByRole('button', { name: m.agent.skip }).click();
    await page.getByRole('heading', { name: m.findings.title }).waitFor();
    await scan(page, testInfo);
    await page.getByRole('button', { name: m.findings.acceptAll }).click();
    await page.getByRole('button', { name: m.findings.continue }).click();
    await page.getByRole('button', { name: m.startup.confirm }).click();
    await page.locator('.mi-match').first().waitFor();
    await scan(page, testInfo);
  });

  test(`axe: agent chat mid-flow and results (${lang})`, async ({ page, baseURL }, testInfo) => {
    const problems: string[] = [];
    await founderWithDeck(page, baseURL, lang, problems, 'deck');
    await scan(page, testInfo);
    await founderWithDeck(page, baseURL, lang, problems);
    await scan(page, testInfo);
  });

  test(`axe: requests inbox with proposals, both tabs (${lang})`, async ({ page }, testInfo) => {
    const d = t(lang).directory.inbox;
    await openFresh(page, path('matchRequests', lang));
    await page.getByRole('button', { name: d.founder.example }).click();
    await scan(page, testInfo);
    await page.getByRole('tab', { name: lang === 'it' ? /^Come investitore/ : /^As an investor/ }).click();
    await scan(page, testInfo);
    await page.getByRole('button', { name: d.travel(7) }).click();
    await page.getByRole('button', { name: d.travel(7) }).click();
    await scan(page, testInfo);
  });

  test(`axe: empty results with near misses, and the propose toast (${lang})`, async ({ page }, testInfo) => {
    await open(page, `${path('matchInvestor', lang)}?settori=proptech&fasi=serie-a&min=900000&max=1000000&aree=sud-isole`);
    await expect(page.getByRole('heading', { name: t(lang).polish.noMatches.title })).toBeVisible();
    await scan(page, testInfo);
    await openFresh(page, `${path('matchStartup', lang)}?settore=fintech&fase=seed&regione=lombardia&round=500000`);
    await page.locator('.mi-match').first().getByRole('button', { name: new RegExp(`^${t(lang).match.ui.startup.propose}`) }).click();
    await expect(page.locator('.mi-toast')).toBeVisible();
    await scan(page, testInfo);
  });

  test(`axe: export one-pager (${lang})`, async ({ page, baseURL }, testInfo) => {
    await exportStartupTeaser(page, baseURL, lang, []);
    await scan(page, testInfo);
  });

  test(`axe: directory with filters, drawer open on phones (${lang})`, async ({ page }, testInfo) => {
    await open(page, `${path('matchDirectory', lang)}?fase=seed`);
    if (isMobile(page)) {
      await page.getByRole('button', { name: lang === 'it' ? /^Filtri/ : /^Filters/ }).click();
      await page.locator('dialog.mi-dir-drawer').waitFor();
    }
    await scan(page, testInfo);
  });
}
