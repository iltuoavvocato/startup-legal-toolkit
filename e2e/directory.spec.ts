// Investor directory: filters drive the URL (Back restores them), then an investor profile → "propose".
import { LOCALES, expect, expectDisclaimer, isMobile, open, openFresh, path, t, test } from './fixtures';

for (const lang of LOCALES) {
  test(`directory filters in the URL, Back restores, profile → propose (${lang})`, async ({ page }) => {
    const d = t(lang).directory;
    const filters = d.dir;
    // A confirmed founder profile is needed to propose: the inbox's example loads one (and three proposals).
    await openFresh(page, path('matchRequests', lang));
    await page.getByRole('button', { name: d.inbox.founder.example }).click();
    await expect(page.locator('main')).toContainText(d.inbox.counter(3, 5));

    await open(page, path('matchDirectory', lang));
    await expect(page.locator('main')).toContainText(lang === 'it' ? 'Dati di esempio fittizi' : 'Fictional sample data');
    const count = page.locator('.mi-dir-card');
    const total = await count.count();
    const mobile = isMobile(page);
    const scope = mobile ? page.locator('dialog.mi-dir-drawer') : page.locator('aside.mi-dir-filters');
    if (mobile) {
      await expect(page.locator('aside.mi-dir-filters')).toHaveCount(0);
      await page.getByRole('button', { name: lang === 'it' ? /^Filtri/ : /^Filters/ }).click();
      await expect(scope).toBeVisible();
    }
    await scope.getByLabel(lang === 'it' ? 'Fase' : 'Stage', { exact: true }).selectOption('seed');
    await page.waitForURL(/fase=seed/);
    await scope.getByLabel(lang === 'it' ? 'Settore' : 'Sector', { exact: true }).selectOption('fintech');
    await page.waitForURL(/fase=seed.*settore=fintech|settore=fintech.*fase=seed/);
    if (mobile) {
      await page.getByRole('button', { name: lang === 'it' ? /^Mostra \d+ risultat/ : /^Show \d+ result/ }).click();
      await expect(scope).toBeHidden();
    }
    const filtered = await count.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);
    await expect(page.locator('.mi-dir-chips')).toContainText(/fintech/i);

    // Back undoes the last filter, Forward redoes it; a reload keeps it (state lives in the URL).
    await page.goBack();
    await page.waitForURL((u) => u.searchParams.get('fase') === 'seed' && !u.searchParams.has('settore'));
    await expect(page.locator('.mi-dir-chips')).not.toContainText(/fintech/i);
    await page.goForward();
    await page.waitForURL(/settore=fintech/);
    await page.reload();
    await page.locator('#page-title').waitFor();
    await expect(page.locator('.mi-dir-chips')).toContainText(/fintech/i);
    expect(await count.count()).toBe(filtered);

    // Open a profile that has no proposal yet and propose.
    const cards = await count.all();
    let opened = false;
    for (const card of cards) {
      if (await card.getByText(filters.card.sent, { exact: true }).count()) continue;
      const name = (await card.locator('h3').innerText()).trim();
      await card.locator('h3 a').click();
      await page.waitForURL(/\?id=i\d+/);
      await page.locator('#page-title').waitFor();
      const propose = page.getByRole('button', { name: lang === 'it' ? /^Proponi il tuo profilo/ : /^Propose your profile/ });
      if (!(await propose.count())) {
        await page.goBack();
        continue;
      }
      await expect(page.locator('main')).toContainText(lang === 'it' ? 'Affinità con il tuo profilo' : 'Fit with your profile');
      await propose.click();
      await expect(page.locator('main')).toContainText(lang === 'it' ? 'Proposta inviata' : 'Proposal sent');
      await expect(page.locator('main')).not.toContainText(/@|\.example/);
      await expectDisclaimer(page, lang);
      await open(page, path('matchRequests', lang));
      await expect(page.locator('main')).toContainText(d.inbox.counter(4, 5));
      await expect(page.locator('article.mi-request').filter({ has: page.getByRole('heading', { name, exact: true }) })).toBeVisible();
      opened = true;
      break;
    }
    expect(opened, 'found an investor to propose to').toBe(true);
  });
}
