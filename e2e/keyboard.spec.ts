// Keyboard-only checks: the agent's chips, the V4 swipe deck's arrow keys and buttons, and the directory's filter
// sheet on phones (focus stays inside while open, Escape closes it and gives focus back to the opener).
import type { Page } from '@playwright/test';
import { LOCALES, expect, isMobile, open, openFresh, path, t, test } from './fixtures';

/** Presses Tab until `predicate` holds for the focused element (fails after `max` presses). */
async function tabUntil(page: Page, predicate: string, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((p) => Boolean(document.activeElement?.matches(p)), predicate)) return;
  }
  throw new Error(`Tab never reached ${predicate}`);
}

const focusedText = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.innerText?.trim() ?? '');
const focusInside = (page: Page, selector: string) =>
  page.evaluate((s) => Boolean(document.activeElement?.closest(s)), selector);

for (const lang of LOCALES) {
  test(`keyboard: agent chips (Tab, Space, Enter; focus follows the conversation) (${lang})`, async ({ page }) => {
    const u = t(lang).intake.ui;
    await openFresh(page, path('matchAgentInvestor', lang));
    // Multi-select chips: reach the first one with Tab, toggle with Space (aria-pressed), move on with Tab.
    await tabUntil(page, '.mi-agent-answer button');
    expect(await focusedText(page)).toBe('Fintech');
    await page.keyboard.press('Space');
    await expect(page.locator('.mi-agent-answer').getByRole('button', { name: 'Fintech', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(page.locator('.mi-agent-answer button[aria-pressed="true"]')).toHaveCount(2);
    // Confirm with Enter: the next question opens and focus moves into it.
    await tabUntil(page, `.mi-agent-answer button:not([aria-pressed])`);
    expect(await focusedText(page)).toBe(u.confirmChoice);
    const before = await page.locator('.mi-msg').count();
    await page.keyboard.press('Enter');
    await page.waitForFunction((n) => document.querySelectorAll('.mi-msg').length > n, before);
    await expect(page.locator('.mi-agent-answer')).toHaveAttribute('data-q', 'fasi');
    await page.waitForFunction(() => Boolean(document.activeElement?.closest('.mi-agent-answer')));
  });

  test(`keyboard: V4 swipe deck, arrow keys and buttons (${lang})`, async ({ page }) => {
    await open(page, path('matchV4Investor', lang));
    const of = lang === 'it' ? 'di' : 'of';
    await expect(page.getByText(new RegExp(`^1 ${of} 5$`)).first()).toBeVisible();
    // Arrow keys decide on the top card (Right = interested, Left = pass) without any focus requirement.
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText(new RegExp(`^2 ${of} 5$`)).first()).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText(new RegExp(`^3 ${of} 5$`)).first()).toBeVisible();
    // The buttons are the accessible path: reachable with Tab and activated with Enter.
    await tabUntil(page, 'button.v4-btn-pass');
    await page.keyboard.press('Enter');
    await expect(page.getByText(new RegExp(`^4 ${of} 5$`)).first()).toBeVisible();
  });

  test(`keyboard: directory filter sheet traps focus and closes with Escape (${lang})`, async ({ page }) => {
    test.skip(!isMobile(page), 'the filter sheet only exists on phones');
    await open(page, path('matchDirectory', lang));
    const openButton = page.getByRole('button', { name: lang === 'it' ? /^Filtri/ : /^Filters/ });
    await tabUntil(page, 'button.mi-dir-open');
    await expect(openButton).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.locator('dialog.mi-dir-drawer');
    await expect(dialog).toBeVisible();
    expect(await focusInside(page, 'dialog.mi-dir-drawer')).toBe(true);
    // Focus trap: Tab and Shift+Tab never leave the open sheet.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      expect(await focusInside(page, 'dialog.mi-dir-drawer'), `Tab #${i + 1} stays in the sheet`).toBe(true);
    }
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await focusInside(page, 'dialog.mi-dir-drawer'), `Shift+Tab #${i + 1} stays in the sheet`).toBe(true);
    }
    // A filter changed from the keyboard updates the URL.
    const stage = dialog.getByLabel(lang === 'it' ? 'Fase' : 'Stage', { exact: true });
    await stage.focus();
    await stage.selectOption('seed');
    await page.waitForURL(/fase=seed/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(openButton).toBeFocused();
    expect(page.url()).toContain('fase=seed');
  });
}
