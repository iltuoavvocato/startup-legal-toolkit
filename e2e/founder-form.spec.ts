// Founder form: sample deck uploaded through the file input → findings reviewed → profile confirmed → matches →
// proposal → pending in the requests inbox → demo time travel → expired. A "no" is never readable.
import { fileURLToPath } from 'node:url';
import { LOCALES, REVEAL, expect, expectDisclaimer, open, openFresh, path, t, test } from './fixtures';

const SAMPLE_DECK = { it: 'deck-esempio-vignalume.pdf', en: 'sample-deck-kelpwise.pdf' } as const;
const deckFile = (name: string) => fileURLToPath(new URL(`../public/demo/${name}`, import.meta.url));

for (const lang of LOCALES) {
  test(`founder form with deck → propose → pending → expired (${lang})`, async ({ page }) => {
    const m = t(lang).match.ui;
    const inbox = t(lang).directory.inbox;
    await openFresh(page, path('matchStartup', lang));
    await expectDisclaimer(page, lang);

    // Upload: the file goes through the real <input type=file> and is read locally by pdf.js.
    await page.locator('input[type=file]').setInputFiles(deckFile(SAMPLE_DECK[lang]));
    await expect(page.getByText(lang === 'it' ? /pagine lette sul tuo dispositivo/ : /pages read on your device/)).toBeVisible();
    await page.getByRole('button', { name: m.startup.submitDeck }).click();
    await page.getByRole('button', { name: m.agent.skip }).click();

    // Findings: nothing is applied before a choice; then accept all and continue.
    await expect(page.getByRole('heading', { name: m.findings.title })).toBeVisible();
    await expect(page.locator('main')).toContainText(m.findings.summary(0, 0, 1).split(' · ')[0]);
    await expect(page.locator('main')).toContainText(m.findings.privacy);
    await page.getByRole('button', { name: m.findings.acceptAll }).click();
    await page.getByRole('button', { name: m.findings.continue }).click();

    await expect(page.getByRole('heading', { name: m.startup.reviewTitleDeck })).toBeVisible();
    await page.getByRole('button', { name: m.startup.confirm }).click();
    const results = page.getByRole('heading', { level: 2, name: lang === 'it' ? /^I tuoi match/ : /^Your matches/ });
    await expect(results).toBeVisible();

    // Propose to the first match.
    const first = page.locator('.mi-match').first();
    const investor = (await first.locator('h3').innerText()).replace(/^\d+\.\s*/, '').trim();
    await first.getByRole('button', { name: new RegExp(`^${m.startup.propose}`) }).click();
    await expect(first).toContainText(m.startup.sent);
    await first.getByRole('link', { name: t(lang).directory.dir.requestsLink }).click();

    // Inbox: pending, with a deadline.
    await page.waitForURL((u) => u.pathname.endsWith(`/${path('matchRequests', lang)}`));
    await page.locator('#page-title').waitFor();
    const request = page.locator('article.mi-request').filter({ has: page.getByRole('heading', { name: investor, exact: true }) });
    await expect(request).toHaveClass(/status-waiting/);
    await expect(request).toContainText(inbox.founder.waitingTitle);
    await expect(page.locator('main')).toContainText(inbox.counter(1, 5));

    // Time travel: 4 × 7 days covers both 14-day steps, so the request ends expired whatever the simulated answer.
    const travel = page.getByRole('button', { name: inbox.travel(7) });
    for (let i = 0; i < 4; i++) {
      await travel.click();
      await expect(page.locator('main')).not.toContainText(REVEAL[lang]);
    }
    await expect(request).toHaveClass(/status-expired/);
    await expect(request).toContainText(inbox.founder.expiredTitle);
    await expectDisclaimer(page, lang);

    // Reload keeps the inbox (sessionStorage) and still reveals nothing.
    await open(page, path('matchRequests', lang));
    await expect(request).toHaveClass(/status-expired/);
    await expect(page.locator('main')).not.toContainText(REVEAL[lang]);
  });
}
