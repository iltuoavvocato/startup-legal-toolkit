// Milestone 9: the guided demo "Demo guidata" (founder | investor side by side, step timeline). Both branches in IT and
// EN, deep links, keyboard arrows, autoplay (and none with reduced motion), and an isolated in-memory inbox.
import type { Page } from '@playwright/test';
import { REVEAL, expect, expectDisclaimer, LOCALES, openFresh, path, t, test } from './fixtures';

const STARTUP = { it: 'Vignalume', en: 'Kelpwise' } as const;

const founder = (page: Page) => page.locator('.mi-gd-screen[data-side="founder"]');
const investor = (page: Page) => page.locator('.mi-gd-screen[data-side="investor"]');
const heading = (page: Page) => page.locator('.mi-gd-caption h2');

async function noInboxWritten(page: Page) {
  expect(await page.evaluate(() => Object.keys(window.sessionStorage))).not.toContain('matchinvstar-inbox');
}

for (const lang of LOCALES) {
  const g = t(lang).guidedDemo;
  const x = t(lang).directory.inbox;
  const url = path('matchGuidedDemo', lang);

  test(`guided demo: branch A, teaser → interest → both yes → intro with names (${lang})`, async ({ page }) => {
    await openFresh(page, url);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expectDisclaimer(page, lang);
    await expect(page.locator('main')).toContainText(t(lang).directory.fictional);
    await expect(heading(page)).toHaveText(g.steps.profile.title);
    await expect(founder(page)).toContainText(g.founder.fromDeck(STARTUP[lang]));

    for (const id of ['matches', 'propose', 'teaser'] as const) {
      await page.getByRole('button', { name: g.next }).click();
      await expect(heading(page)).toHaveText(g.steps[id].title);
    }
    await expect(page).toHaveURL(/\?step=4$/);
    // The investor sees only the anonymous teaser (on phones its screen is the one shown).
    await expect(investor(page)).toBeVisible();
    await expect(investor(page)).toContainText(t(lang).match.ui.teaser.lock);
    await expect(investor(page)).not.toContainText(STARTUP[lang]);

    await investor(page).getByRole('button', { name: x.investor.yes }).click();
    await expect(heading(page)).toHaveText(g.steps.interested.title);
    await expect(page).toHaveURL(/\?step=5$/);
    await expect(heading(page)).toBeFocused();
    await expect(founder(page)).toContainText(x.founder.yourTurnTitle);
    await expect(investor(page)).not.toContainText(STARTUP[lang]);

    await founder(page).getByRole('button', { name: new RegExp(`^${x.founder.accept}`) }).click();
    await expect(heading(page)).toHaveText(g.steps.intro.title);
    await expect(founder(page)).toContainText(x.founder.introTitle);
    await expect(investor(page)).toContainText(x.investor.introTitle(STARTUP[lang]));
    await expect(page.getByRole('button', { name: g.next })).toBeDisabled();
    await noInboxWritten(page);
  });

  test(`guided demo: branch B, a no looks like no answer, then expired; arrows and deep links (${lang})`, async ({ page }) => {
    await openFresh(page, `${url}?step=4`);
    await expect(heading(page)).toHaveText(g.steps.teaser.title);
    await investor(page).getByRole('button', { name: x.investor.no }).click();
    await expect(page).toHaveURL(/\?step=5&branch=no$/);
    await expect(heading(page)).toHaveText(g.steps.declined.title);

    const callout = page.locator('.mi-gd-noreveal');
    await expect(callout.getByRole('heading', { name: g.noRevealTitle })).toBeVisible();
    const [mine, silent] = await callout.locator('.mi-request').allInnerTexts();
    expect(mine).toBe(silent);
    await expect(founder(page)).toContainText(x.founder.waitingTitle);
    expect(await founder(page).innerText()).not.toMatch(REVEAL[lang]);

    await page.locator('body').press('ArrowRight');
    await expect(heading(page)).toHaveText(g.steps.expired.title);
    await expect(page).toHaveURL(/\?step=6&branch=no$/);
    await expect(founder(page)).toContainText(x.founder.expiredTitle);
    const [mine2, silent2] = await callout.locator('.mi-request').allInnerTexts();
    expect(mine2).toBe(silent2);
    expect(await founder(page).innerText()).not.toMatch(REVEAL[lang]);
    await expect(investor(page)).not.toContainText(STARTUP[lang]);

    await page.locator('body').press('ArrowLeft');
    await expect(heading(page)).toHaveText(g.steps.declined.title);
    // Switching branch keeps the step.
    await expect(page.getByRole('radio', { name: g.branch.no })).toBeChecked();
    await page.locator('.mi-gd-branch label').filter({ has: page.getByRole('radio', { name: g.branch.yes }) }).click();
    await expect(page.getByRole('radio', { name: g.branch.yes })).toBeChecked();
    await expect(heading(page)).toHaveText(g.steps.interested.title);
    await expect(page).toHaveURL(/\?step=5$/);

    // A deep link opens the step directly; the timeline marks it as the current step.
    await page.goto(`${url}?step=3`);
    await expect(heading(page)).toHaveText(g.steps.propose.title);
    await expect(page.locator('.mi-gd-timeline [aria-current="step"]')).toContainText(g.steps.propose.title);
    await page.getByRole('button', { name: g.prev }).click();
    await expect(heading(page)).toHaveText(g.steps.matches.title);
    await noInboxWritten(page);
  });

  test(`guided demo: autoplay with pause; none with reduced motion (${lang})`, async ({ page }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFresh(page, url);
    await page.getByRole('button', { name: g.play }).click();
    await page.clock.fastForward(6500);
    await expect(heading(page)).toHaveText(g.steps.matches.title);
    await page.getByRole('button', { name: g.pause }).click();
    await page.clock.fastForward(13000);
    await expect(heading(page)).toHaveText(g.steps.matches.title);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByRole('button', { name: g.play })).toHaveCount(0);
    await expect(page.locator('main')).toContainText(g.reducedMotion);
  });

  test(`guided demo: linked from the matching landing and the variants gallery (${lang})`, async ({ page }) => {
    for (const from of ['match', 'matchVariants']) {
      await openFresh(page, path(from, lang));
      const link = page.getByRole('link', { name: from === 'match' ? g.landingLink : g.galleryLink });
      await expect(link).toHaveAttribute('href', new RegExp(`${url}$`));
    }
  });
}
