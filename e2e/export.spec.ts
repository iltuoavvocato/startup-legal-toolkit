// Local export: anonymous teaser ↔ full version, Markdown download (always carries the disclaimer), noindex.
import { readFileSync } from 'node:fs';
import { NAME, exportStartupTeaser } from '../scripts/export-flows.mjs';
import { DISCLAIMER, LOCALES, expect, expectDisclaimer, t, test } from './fixtures';

for (const lang of LOCALES) {
  test(`export: teaser/full toggle and .md download with the disclaimer (${lang})`, async ({ page, baseURL }) => {
    const x = t(lang).exportDoc;
    const problems: string[] = [];
    // Form with the example and a typed startup name → results → "Export the one-pager" (anonymous teaser).
    await exportStartupTeaser(page, baseURL, lang, problems);
    expect(problems).toEqual([]);
    const sheet = page.locator('.mi-sheet');
    const title = page.locator('.mi-sheet-title');
    await expect(page.getByRole('radio', { name: x.page.variants.teaser })).toBeChecked();
    await expect(title).toContainText(x.doc.startupTitle.teaser);
    await expect(sheet).not.toContainText(NAME);
    await expect(sheet).toContainText(DISCLAIMER[lang]);
    await expectDisclaimer(page, lang);

    const download = async () => {
      const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: lang === 'it' ? 'Scarica .md' : 'Download .md' }).click()]);
      return { name: file.suggestedFilename(), md: readFileSync(await file.path(), 'utf8') };
    };
    const teaser = await download();
    expect(teaser.name).toMatch(new RegExp(`^matchinvstar-${x.doc.fileStem.startupTeaser}-\\d{4}-\\d{2}-\\d{2}\\.md$`));
    expect(teaser.md).toContain(DISCLAIMER[lang]);
    expect(teaser.md).not.toContain(NAME);

    // Full version: the typed name appears on the sheet and in the file; the disclaimer stays.
    await page.getByRole('radio', { name: x.page.variants.full }).check();
    await expect(title).toContainText(NAME);
    const full = await download();
    expect(full.name).toMatch(new RegExp(`^matchinvstar-${x.doc.fileStem.startupFull}-`));
    expect(full.md).toContain(NAME);
    expect(full.md).toContain(DISCLAIMER[lang]);

    // Back to the teaser: the name disappears again.
    await page.getByRole('radio', { name: x.page.variants.teaser }).check();
    await expect(sheet).not.toContainText(NAME);

    const html = await (await page.request.get(page.url().split('?')[0])).text();
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
  });
}
