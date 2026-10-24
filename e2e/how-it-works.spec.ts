// Milestone 11: "Come funziona il matching" / "How matching works" and the "Perché questo match?" breakdown on the
// founder's results. Numbers are checked against the constants the scoring uses, so copy and code can't drift apart.
import AxeBuilder from '@axe-core/playwright';
import { bandList } from '../src/lib/explain';
import { MONTHLY_PROPOSAL_LIMIT, REQUEST_EXPIRY_DAYS } from '../src/lib/matchConfig';
import { WEIGHTS } from '../src/lib/matching';
import { LOCALES, expect, expectDisclaimer, open, openFresh, path, t, test } from './fixtures';

for (const lang of LOCALES) {
  const x = t(lang).explain;

  test(`how it works: rules from the code, links in (${lang})`, async ({ page }) => {
    await open(page, path('match', lang));
    await page.getByRole('link', { name: x.link, exact: true }).click();
    await expect(page.locator('#page-title')).toHaveText(x.title);
    await expect(page).toHaveURL(new RegExp(`${path('matchHowItWorks', lang)}$`));

    const body = page.locator('main');
    await expect(body).toContainText(x.rules.cap(MONTHLY_PROPOSAL_LIMIT));
    await expect(body).toContainText(x.rules.expiry(REQUEST_EXPIRY_DAYS));
    await expect(body).toContainText(x.shown(bandList(lang)));
    for (const item of x.not) await expect(body).toContainText(item);
    // The rules table shows the real maxima.
    const table = page.locator('.mi-table').first();
    for (const max of Object.values(WEIGHTS)) await expect(table).toContainText(String(max));
    await expectDisclaimer(page, lang);
  });

  test(`how it works: the example responds to changes (${lang})`, async ({ page }) => {
    await open(page, path('matchHowItWorks', lang));
    const result = page.locator('.mi-why-result');
    await expect(result.locator('.mi-score-value')).toHaveText('66');
    await expect(result.locator('tfoot')).toBeVisible();

    // A round under the investor's minimum ticket: excluded by the ticket filter.
    await page.getByLabel(x.example.round).selectOption('150000');
    await expect(result.locator('.mi-score-value')).toHaveText('0');
    await expect(result.locator('tr[data-part="ticket"]')).toContainText(x.breakdown.filterOut);
    await expect(result).toContainText(x.breakdown.excluded);

    // Main sector and stage: more points.
    await page.getByRole('button', { name: x.example.reset }).click();
    await page.getByLabel(x.example.settore).selectOption('fintech');
    await page.getByLabel(x.example.fase).selectOption('seed');
    await expect(result.locator('.mi-score-value')).toHaveText('84');
  });

  test(`results: "why this match" on every founder card (${lang})`, async ({ page }) => {
    await openFresh(page, `${path('matchStartup', lang)}?settore=fintech&fase=seed&regione=lombardia&round=500000`);
    const cards = page.locator('.mi-matches > li');
    await expect(cards.first()).toBeVisible();
    const n = await cards.count();
    await expect(page.locator('.mi-matches .mi-why')).toHaveCount(n);

    const first = cards.first();
    const score = await first.locator('.mi-score-value').first().textContent();
    await first.getByText(x.why).click();
    const breakdown = first.locator('.mi-breakdown');
    await expect(breakdown).toBeVisible();
    await expect(breakdown.locator('tbody tr')).toHaveCount(4);
    await expect(breakdown.locator('tfoot')).toContainText(`${score} `);

    // Axe on the opened breakdown (collapsed content isn't scanned by the per-route test).
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('.mi-matches')
      .analyze();
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

    await page.getByRole('link', { name: x.link }).click();
    await expect(page.locator('#page-title')).toHaveText(x.title);
  });

  test(`guided demo links to how it works (${lang})`, async ({ page }) => {
    await open(page, path('matchGuidedDemo', lang));
    await expect(page.getByRole('link', { name: x.link })).toHaveAttribute('href', new RegExp(`${path('matchHowItWorks', lang)}$`));
  });
}
