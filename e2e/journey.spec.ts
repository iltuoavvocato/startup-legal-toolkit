// End-to-end journey (desktop, one per language): the whole story in one run, as a reviewer would click it.
// Landing → sample deck → findings → results → "Why this match?" → propose → inbox (investor tab: a teaser answered)
// → the investor is interested → the founder accepts → intro with names → export the one-pager.
// On every page visited: the disclaimer is there. Every request is intercepted: none may leave the origin and all
// same-origin ones must be GETs (nothing is posted anywhere).
import { demoInvestors } from '../src/data/matchDemo';
import { simulatedAnswer } from '../src/lib/inbox';
import { DISCLAIMER, LOCALES, REVEAL, expect, expectDisclaimer, path, t, test } from './fixtures';

for (const lang of LOCALES) {
  test(`journey: landing → deck → matches → why → propose → inbox → intro → export (${lang})`, async ({ page, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the journey runs on desktop only');
    const m = t(lang).match.ui;
    const inbox = t(lang).directory.inbox;
    const x = t(lang).explain;
    const ex = t(lang).exportDoc;
    const origin = new URL(baseURL!).origin;

    // Route interception: anything off-origin is recorded and aborted; same-origin non-GETs are recorded too.
    const offOrigin: string[] = [];
    const nonGet: string[] = [];
    await page.route('**/*', (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.protocol !== 'data:' && url.protocol !== 'blob:' && url.origin !== origin) {
        offOrigin.push(req.url());
        return route.abort();
      }
      if (req.method() !== 'GET') nonGet.push(`${req.method()} ${req.url()}`);
      return route.continue();
    });

    const visited: string[] = [];
    const checkPage = async () => {
      await page.locator('#page-title').waitFor();
      visited.push(new URL(page.url()).pathname);
      await expectDisclaimer(page, lang);
    };

    // 1. Landing (fresh tab: nothing in sessionStorage yet).
    await page.goto(path('match', lang));
    await checkPage();
    await page.getByRole('link', { name: m.landing.ctaStartup }).first().click();
    await page.waitForURL((u) => u.pathname.endsWith(`/${path('matchStartup', lang)}`));
    await checkPage();

    // 2. Sample deck, read locally by pdf.js, then the agent's checklist (skipped).
    await page.getByRole('button', { name: m.dropzone.sample }).click();
    await expect(page.getByText(lang === 'it' ? /pagine lette sul tuo dispositivo/ : /pages read on your device/)).toBeVisible();
    await page.getByRole('button', { name: m.startup.submitDeck }).click();
    await page.getByRole('button', { name: m.agent.skip }).click();

    // 3. Findings: accept all, continue, confirm the profile.
    await expect(page.getByRole('heading', { name: m.findings.title })).toBeVisible();
    await expectDisclaimer(page, lang);
    await page.getByRole('button', { name: m.findings.acceptAll }).click();
    await page.getByRole('button', { name: m.findings.continue }).click();
    await expect(page.getByRole('heading', { name: m.startup.reviewTitleDeck })).toBeVisible();
    await page.getByRole('button', { name: m.startup.confirm }).click();

    // 4. Results: pick the best match whose (deterministic, simulated) investor answer is yes.
    await expect(page.getByRole('heading', { level: 2, name: lang === 'it' ? /^I tuoi match/ : /^Your matches/ })).toBeVisible();
    await expectDisclaimer(page, lang);
    const cards = page.locator('.mi-matches > li');
    await expect(cards.first()).toBeVisible();
    const names = (await cards.locator('h3').allInnerTexts()).map((s) => s.replace(/^\d+\.\s*/, '').trim());
    const investors = demoInvestors(lang);
    const index = names.findIndex((n) => {
      const inv = investors.find((i) => i.nome === n);
      return inv !== undefined && simulatedAnswer(`founder:${inv.id}`)?.answer === 'yes';
    });
    expect(index, 'a match whose simulated investor answer is yes').toBeGreaterThanOrEqual(0);
    const investor = names[index]!;
    const card = cards.nth(index);

    // 5. "Why this match?": the breakdown has four criteria and its total equals the card's score.
    const score = (await card.locator('.mi-score-value').first().textContent())?.trim();
    await card.getByText(x.why, { exact: true }).click();
    const breakdown = card.locator('.mi-breakdown');
    await expect(breakdown).toBeVisible();
    await expect(breakdown.locator('tbody tr')).toHaveCount(4);
    await expect(breakdown.locator('tfoot')).toContainText(`${score} `);

    // 6. Propose, then go to the requests inbox.
    await card.getByRole('button', { name: new RegExp(`^${m.startup.propose}`) }).click();
    await expect(card).toContainText(m.startup.sent);
    await card.getByRole('link', { name: t(lang).directory.dir.requestsLink }).click();
    await page.waitForURL((u) => u.pathname.endsWith(`/${path('matchRequests', lang)}`));
    await checkPage();
    const request = page.locator('article.mi-request').filter({ has: page.getByRole('heading', { name: investor, exact: true }) });
    await expect(request).toHaveClass(/status-waiting/);
    await expect(page.locator('main')).toContainText(inbox.counter(1, 5));

    // 7. Investor tab: anonymous sample teasers; answer one "yes" as an investor would.
    await page.getByRole('tab', { name: new RegExp(`^${inbox.tabInvestor}`) }).click();
    await expect(page.getByRole('tab', { name: new RegExp(`^${inbox.tabInvestor}`) })).toHaveAttribute('aria-selected', 'true');
    const teaser = page.locator('article.mi-request.status-your-turn').first();
    await expect(teaser).toBeVisible();
    await expect(teaser.locator('.mi-request-line')).toHaveCount(0); // no startup name before the intro
    await teaser.getByRole('button', { name: new RegExp(`^${inbox.investor.yes}`) }).click();
    await expect(page.locator('main')).toContainText(inbox.investor.waitingTitle);
    await expectDisclaimer(page, lang);

    // 8. Founder tab: the demo clock moves a week; the investor's simulated answer (yes, 2–6 days) arrives.
    await page.getByRole('tab', { name: new RegExp(`^${inbox.tabFounder}`) }).click();
    await page.getByRole('button', { name: inbox.travel(7) }).click();
    await expect(request).toHaveClass(/status-your-turn/);
    await expect(request).toContainText(inbox.founder.yourTurnTitle);
    await expect(page.locator('main')).not.toContainText(REVEAL[lang]);

    // 9. The founder accepts: intro ready, the email names both parties.
    await request.getByRole('button', { name: new RegExp(`^${inbox.founder.accept}`) }).click();
    await expect(request).toHaveClass(/status-intro/);
    await expect(request).toContainText(inbox.founder.introTitle);
    await request.getByText(inbox.founder.showEmail).click();
    await expect(request.locator('.mi-email')).toContainText(investor);
    await expectDisclaimer(page, lang);

    // 10. Export the one-pager (anonymous teaser by default) from the inbox.
    await page.getByRole('link', { name: ex.entry.startup }).click();
    await page.waitForURL((u) => u.pathname.endsWith(`/${path('matchExport', lang)}`));
    await checkPage();
    await expect(page.getByRole('radio', { name: ex.page.variants.teaser })).toBeChecked();
    await expect(page.locator('.mi-sheet-title')).toContainText(ex.doc.startupTitle.teaser);
    await expect(page.locator('.mi-sheet')).toContainText(DISCLAIMER[lang]);

    // Every page visited had the disclaimer; nothing left the origin, nothing was posted.
    expect(visited).toEqual([
      `/${path('match', lang)}`,
      `/${path('matchStartup', lang)}`,
      `/${path('matchRequests', lang)}`,
      `/${path('matchExport', lang)}`,
    ]);
    expect(offOrigin, 'requests leaving the origin').toEqual([]);
    expect(nonGet, 'non-GET requests').toEqual([]);
  });
}
