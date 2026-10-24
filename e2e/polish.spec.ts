// Milestone 8: skip link, "/" for the directory search, empty results with "Allarga criteri", the propose toast
// (aria-live, Escape), visible focus on chips and the agent's "conversation restored" notice.
import type { Page } from '@playwright/test';
import { LOCALES, expect, isMobile, open, openFresh, path, t, test } from './fixtures';

async function tabUntil(page: Page, predicate: string, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((p) => Boolean(document.activeElement?.matches(p)), predicate)) return;
  }
  throw new Error(`Tab never reached ${predicate}`);
}

const NARROW_THESIS = '?settori=proptech&fasi=serie-a&min=900000&max=1000000&aree=sud-isole';
const STARTUP_PROFILE = '?settore=fintech&fase=seed&regione=lombardia&round=500000';

for (const lang of LOCALES) {
  test(`keyboard: skip link reaches the main content first on match pages (${lang})`, async ({ page }) => {
    for (const id of ['match', 'matchDirectory', 'matchRequests']) {
      await open(page, path(id, lang));
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.keyboard.press('Tab');
      const skip = page.locator('a.skip-link');
      await expect(skip).toBeFocused();
      await expect(skip).toHaveText(t(lang).common.skipLink);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement?.id === 'main');
    }
  });

  test(`keyboard: "/" focuses the directory search on desktop only, and is announced (${lang})`, async ({ page }) => {
    await open(page, path('matchDirectory', lang));
    const search = page.locator('input[type="search"]').first();
    if (isMobile(page)) {
      await expect(search).not.toHaveAttribute('aria-keyshortcuts', '/');
      return;
    }
    await expect(search).toHaveAttribute('aria-keyshortcuts', '/');
    const describedBy = await search.getAttribute('aria-describedby');
    await expect(page.locator(`[id="${describedBy}"]`)).toContainText(t(lang).polish.slashHintSr);
    await page.locator('#page-title').focus();
    await page.keyboard.press('/');
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
    // While typing in a field, "/" is just a character.
    await page.keyboard.type('a/b');
    await expect(search).toHaveValue('a/b');
  });

  test(`empty results: closest misses and one-click "Allarga criteri" (${lang})`, async ({ page }) => {
    const x = t(lang).polish.noMatches;
    await open(page, `${path('matchInvestor', lang)}${NARROW_THESIS}`);
    await expect(page.getByRole('heading', { name: x.title })).toBeVisible();
    await expect(page.getByRole('heading', { name: x.closest })).toBeVisible();
    await expect(page.locator('.mi-nomatch-list > li').first()).toBeVisible();
    const relax = page.getByRole('button', { name: x.relaxButton });
    await relax.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: x.title })).toHaveCount(0);
    expect(await page.locator('.mi-matches > li').count()).toBeGreaterThan(0);
    // Focus lands on the results heading (the button is gone), and the change is announced.
    await page.waitForFunction(() => document.activeElement?.tagName === 'H2');
    await expect(page.locator('[role="status"]').filter({ hasText: x.relaxed(1).split(':')[0]! }).first()).toBeAttached();
    // The URL follows the widened thesis (shareable).
    expect(new URL(page.url()).search).not.toBe(NARROW_THESIS);
  });

  test(`propose: toast in a live region, Escape dismisses it, explainer shown (${lang})`, async ({ page }) => {
    const p = t(lang).polish;
    await openFresh(page, `${path('matchStartup', lang)}${STARTUP_PROFILE}`);
    await expect(page.getByRole('heading', { name: p.consent.title })).toBeVisible();
    const first = page.locator('.mi-match').first();
    await first.getByRole('button', { name: new RegExp(`^${t(lang).match.ui.startup.propose}`) }).click();
    const region = page.locator('.mi-toast-region');
    await expect(region).toHaveAttribute('aria-live', 'polite');
    await expect(region).toContainText(p.toast.proposed);
    await expect(first).toContainText(t(lang).match.ui.startup.sent);
    await page.keyboard.press('Escape');
    await expect(page.locator('.mi-toast')).toHaveCount(0);
  });

  test(`keyboard: chips show a visible focus ring (${lang})`, async ({ page }) => {
    await open(page, path('matchInvestor', lang));
    await tabUntil(page, '.mi-chip input');
    const outline = await page.evaluate(() => {
      const chip = document.activeElement?.closest('.mi-chip');
      return chip ? getComputedStyle(chip).outlineStyle + ' ' + getComputedStyle(chip).outlineWidth : '';
    });
    expect(outline).toBe('solid 3px');
    await page.keyboard.press('Space');
    await expect(page.locator('.mi-chip.is-checked')).toHaveCount(1);
  });

  test(`agent: a reload restores the conversation and says so (${lang})`, async ({ page }) => {
    await openFresh(page, path('matchAgentInvestor', lang));
    await expect(page.getByText(t(lang).polish.agentRestored)).toHaveCount(0);
    await page.locator('.mi-agent-answer').getByRole('button', { name: 'Fintech', exact: true }).click();
    await page.locator('.mi-agent-answer').getByRole('button', { name: t(lang).intake.ui.confirmChoice }).click();
    await expect(page.locator('.mi-agent-answer')).toHaveAttribute('data-q', 'fasi');
    await page.reload();
    await page.locator('#page-title').waitFor();
    await expect(page.getByText(t(lang).polish.agentRestored)).toBeVisible();
    await expect(page.locator('.mi-agent-answer')).toHaveAttribute('data-q', 'fasi');
  });
}
