// Milestone 15: forced colours (Windows high contrast). Brand backgrounds and box-shadows are replaced or dropped
// there, so on three key screens (investor form, founder results, requests inbox) the selected chip, the current
// step, the active tab and the score bars must still differ from their neighbours in what forced colours keep
// (system colours, borders, outlines), and focus must show as a real outline. Desktop project only.
// Screenshots go to screenshots/forced-colors/.
import type { Locator, Page } from '@playwright/test';
import { LOCALES, expect, openFresh, path, t, test } from './fixtures';

test.use({ colorScheme: 'light' });
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
});

/** What forced colours leave visible on an element and its direct children. */
async function look(locator: Locator) {
  return locator.evaluate((el) => {
    const one = (e: Element) => {
      const s = getComputedStyle(e);
      return [s.backgroundColor, s.color, s.borderTopWidth, s.borderTopStyle, s.borderTopColor, s.outlineStyle].join(' ');
    };
    return [one(el), ...Array.from(el.children).map(one)].join(' / ');
  });
}

/** Focus by keyboard (so :focus-visible applies) and return the outline that shows. */
async function focusRing(page: Page, locator: Locator) {
  await page.keyboard.press('Shift');
  await locator.focus();
  return locator.evaluate((el) => {
    // A visually hidden input shows its ring on the chip/label around it.
    const target = el.getBoundingClientRect().width <= 2 ? (el.closest('label') ?? el) : el;
    const s = getComputedStyle(target);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
}

function expectRing(ring: { style: string; width: number }, what: string) {
  expect(ring.style, `${what}: outline style`).not.toBe('none');
  expect(ring.width, `${what}: outline width`).toBeGreaterThanOrEqual(2);
}

for (const lang of LOCALES) {
  test(`forced colours: investor form chips, stepper and focus (${lang})`, async ({ page }) => {
    await openFresh(page, path('matchInvestor', lang));
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    const chips = page.locator('.mi-chip');
    await chips.first().click();
    await expect(chips.first()).toHaveClass(/is-checked/);
    expect(await look(chips.first()), 'checked chip vs unchecked').not.toBe(await look(chips.nth(1)));

    const current = page.locator('.mi-steps li.is-current .mi-steps-num');
    const pending = page.locator('.mi-steps li:not(.is-current):not(.is-done) .mi-steps-num').first();
    expect(await look(current), 'current step vs pending').not.toBe(await look(pending));

    expectRing(await focusRing(page, page.locator('.mi-chip input').nth(1)), 'chip');
    const field = page.locator('main select, main .field input:not([type="checkbox"]):not([type="radio"])').first();
    expectRing(await focusRing(page, field), 'form field');
    await page.screenshot({ path: `screenshots/forced-colors/${lang}-investor-form.png`, fullPage: true });
  });

  test(`forced colours: founder results score bars and breakdown (${lang})`, async ({ page }) => {
    const m = t(lang).match.ui;
    await openFresh(page, path('matchStartup', lang));
    await page.getByRole('button', { name: m.dropzone.sample }).click();
    await page.getByRole('button', { name: m.startup.submitDeck }).click();
    await page.getByRole('button', { name: m.agent.skip }).click();
    await page.getByRole('heading', { name: m.findings.title }).waitFor();
    await page.getByRole('button', { name: m.findings.acceptAll }).click();
    await page.getByRole('button', { name: m.findings.continue }).click();

    const steps = page.locator('.mi-steps');
    if (await steps.count()) {
      const done = page.locator('.mi-steps li.is-done .mi-steps-num').first();
      const current = page.locator('.mi-steps li.is-current .mi-steps-num');
      expect(await look(done), 'done step vs current').not.toBe(await look(current));
    }
    await page.getByRole('button', { name: m.startup.confirm }).click();
    const card = page.locator('.mi-match').first();
    await card.waitFor();

    const bar = card.locator('.mi-score-bar');
    const fill = bar.locator('span');
    const [track, ink] = await Promise.all([bar, fill].map((l) => l.evaluate((e) => getComputedStyle(e).backgroundColor)));
    expect(ink, 'score bar fill vs track').not.toBe(track);
    expect(await bar.evaluate((e) => getComputedStyle(e).borderTopStyle), 'score bar outline').not.toBe('none');

    await card.locator('summary').first().click();
    const bd = card.locator('.mi-breakdown-bar').first();
    await bd.waitFor();
    const [bdTrack, bdInk] = await Promise.all([bd, bd.locator('span')].map((l) => l.evaluate((e) => getComputedStyle(e).backgroundColor)));
    expect(bdInk, 'breakdown bar fill vs track').not.toBe(bdTrack);

    expectRing(await focusRing(page, card.locator('summary').first()), '"why this match" summary');
    expectRing(await focusRing(page, card.locator('button').first()), 'card button');
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `screenshots/forced-colors/${lang}-founder-results.png` });
  });

  test(`forced colours: inbox tabs, progress and focus (${lang})`, async ({ page }) => {
    await openFresh(page, path('matchRequests', lang));
    const tabs = page.locator('.mi-inbox-tabs button');
    await expect(tabs.first()).toHaveClass(/is-active/);
    expect(await look(tabs.first()), 'active tab vs other tab').not.toBe(await look(tabs.nth(1)));
    expect(await page.locator('.mi-counter-bar').evaluate((e) => getComputedStyle(e).borderTopStyle), 'counter bar outline').not.toBe('none');
    expectRing(await focusRing(page, tabs.nth(1)), 'tab');
    expectRing(await focusRing(page, page.locator('.mi-inbox-demo-actions button').first()), 'demo clock button');
    await page.screenshot({ path: `screenshots/forced-colors/${lang}-inbox.png`, fullPage: true });
  });
}
