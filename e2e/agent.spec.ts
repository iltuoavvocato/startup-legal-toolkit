// Guided intake ("Parla con l'agente"): founder with the sample deck and investor, in both languages.
// The scripted steps live in scripts/agent-flows.mjs (shared with the screenshot script); each step's own checks
// collect into `problems`, which must stay empty. Explicit assertions below cover the outcome.
import { founderWithDeck, investorFlow, restartWorks } from '../scripts/agent-flows.mjs';
import { LOCALES, REVEAL, expect, expectDisclaimer, open, path, t, test } from './fixtures';

for (const lang of LOCALES) {
  test(`agent: founder with sample deck → results → proposal in the inbox (${lang})`, async ({ page, baseURL }) => {
    const problems: string[] = [];
    await founderWithDeck(page, baseURL, lang, problems);
    expect(problems).toEqual([]);
    const chat = page.locator('.mi-agent-chat');
    await expect(chat).toContainText(lang === 'it' ? /Ho trovato \d+ investitori/ : /I found \d+ investors/);
    await expect(chat).not.toContainText(REVEAL[lang]);
    await expectDisclaimer(page, lang);

    // The proposal is listed in the shared requests inbox, still unanswered or answered "yes", never "no".
    const investor = (await page.locator('.mi-agent-match h3').first().innerText()).replace(/^\d+\.\s*/, '').trim();
    await open(page, path('matchRequests', lang));
    await expect(page.locator('article.mi-request').filter({ hasText: investor })).toBeVisible();
    await expect(page.locator('main')).toContainText(t(lang).directory.inbox.counter(1, 5));
    await expect(page.locator('main')).not.toContainText(REVEAL[lang]);
  });

  test(`agent: investor → results → interest, then start over (${lang})`, async ({ page, baseURL }) => {
    const problems: string[] = [];
    await investorFlow(page, baseURL, lang, problems);
    await expect(page.locator('.mi-agent-match').first()).toBeVisible();
    await expect(page.locator('.mi-agent-chat')).toContainText(lang === 'it' ? /Ho trovato \d+ startup/ : /I found \d+ startups/);
    await expectDisclaimer(page, lang);
    await restartWorks(page, baseURL, lang, problems);
    expect(problems).toEqual([]);
  });

  test(`agent: investor answers before the inbox was opened → sample teasers still seeded, once (${lang})`, async ({ page, baseURL }) => {
    const problems: string[] = [];
    await investorFlow(page, baseURL, lang, problems);
    expect(problems).toEqual([]);
    const investorRequests = () =>
      page.evaluate(() => {
        const s = JSON.parse(window.sessionStorage.getItem('matchinvstar-inbox') ?? '{"requests":[]}') as {
          requests: { id: string; role: string; counterpartId: string }[];
        };
        return s.requests.filter((r) => r.role === 'investor');
      });
    const before = await investorRequests();
    expect(before.map((r) => r.id.slice(0, 2))).toEqual(['a-']);

    await open(page, `${path('matchRequests', lang)}?vista=investitore`);
    const cards = page.locator('article.mi-request');
    await expect(cards.first()).toBeVisible();
    const after = await investorRequests();
    // The four sample teasers (minus the agent's startup if it is one of them) next to the agent's request.
    expect(after.filter((r) => r.id.startsWith('i-')).length).toBeGreaterThanOrEqual(3);
    expect(after.some((r) => r.id === before[0]!.id)).toBe(true);
    expect(new Set(after.map((r) => r.counterpartId)).size).toBe(after.length);
    await expect(cards).toHaveCount(after.length);

    // Idempotent: another visit adds nothing.
    await page.reload();
    await expect(cards.first()).toBeVisible();
    expect(await investorRequests()).toEqual(after);
    await expect(page.locator('main')).not.toContainText(REVEAL[lang]);
  });
}
