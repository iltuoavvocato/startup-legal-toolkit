// Screenshot flows for the local export page (one-pager / thesis sheet), IT and EN, used by scripts/screenshots.mjs.
// Each flow leaves the page in the state to capture and pushes any problem it finds into `problems`.
import { readFileSync } from 'node:fs';

const COPY = {
  it: {
    startup: 'match-investitori/startup/',
    investor: 'match-investitori/investitore/',
    profile: 'match-investitori/investitori/scheda/?id=i01',
    exportPath: 'match-investitori/esporta/',
    example: 'Usa un esempio',
    draft: 'Prepara il profilo',
    skip: 'Salta l’attesa',
    name: /^Nome della startup/,
    confirm: 'Conferma il profilo',
    results: /I tuoi match/,
    findInvestor: 'Trova startup in linea',
    exportStartup: 'Esporta il one-pager',
    exportInvestor: 'Esporta la tesi',
    exportDemo: 'Scheda stampabile della tesi',
    full: 'Versione completa',
    teaserTitle: 'Teaser anonimo della startup',
    thesisTitle: 'Tesi di investimento',
    print: 'Stampa / Salva PDF',
    download: 'Scarica .md',
    copy: 'Copia testo',
    copied: /Testo copiato|Non riesco a copiare/,
    footer: 'Generato localmente – dati di esempio/prototipo',
    optin: 'Come funziona il doppio consenso',
    disclaimer: 'Strumento indicativo: non sostituisce una consulenza legale.',
    emptyTitle: 'Nessun profilo startup da esportare',
    fictional: 'Dati di esempio fittizi',
    sample: 'Prova con un deck di esempio',
    deckRead: /pagine lette sul tuo dispositivo/,
    readDeck: /Fai leggere il deck/,
    useAll: 'Usa tutti i suggerimenti',
    apply: 'Applica le scelte e continua',
  },
  en: {
    startup: 'en/investor-match/startup/',
    investor: 'en/investor-match/investor/',
    profile: 'en/investor-match/investors/profile/?id=i01',
    exportPath: 'en/investor-match/export/',
    example: 'Use an example',
    draft: 'Draft the profile',
    skip: 'Skip the wait',
    name: /^Startup name/,
    confirm: 'Confirm the profile',
    results: /Your matches/,
    findInvestor: 'Find startups that fit',
    exportStartup: 'Export the one-pager',
    exportInvestor: 'Export the thesis',
    exportDemo: 'Printable thesis sheet',
    full: 'Full version',
    teaserTitle: 'Anonymous startup teaser',
    thesisTitle: 'Investment thesis',
    print: 'Print / Save PDF',
    download: 'Download .md',
    copy: 'Copy text',
    copied: /Text copied|Copying didn’t work/,
    footer: 'Generated locally – sample/prototype data',
    optin: 'How the double opt-in works',
    disclaimer: 'Indicative tool: not a substitute for legal advice.',
    emptyTitle: 'No startup profile to export',
    fictional: 'Fictional sample data',
    sample: 'Try a sample deck',
    deckRead: /pages read on your device/,
    readDeck: /Let the agent read the deck/,
    useAll: 'Use all suggestions',
    apply: 'Apply my choices and continue',
  },
};

export const NAME = 'Pagalampo Demo';

async function freshSession(page, base) {
  await page.goto(base);
  await page.evaluate(() => window.sessionStorage.clear());
}

/** Checks shared by every export page: noindex, one h1, sheet content, disclaimer, footer, no deck text. */
async function checkSheet(page, lang, problems, name, { title, forbidden = [] } = {}) {
  const c = COPY[lang];
  // What crawlers get: the prerendered HTML of the export route (client-side navigation keeps the previous page's tag).
  const html = await (await page.request.get(page.url().split('?')[0])).text();
  if (!html.includes('<meta name="robots" content="noindex, nofollow" />')) problems.push(`${name}: export page HTML is not noindex, nofollow`);
  const sheet = page.locator('.mi-sheet');
  await sheet.waitFor();
  if ((await page.locator('h1').count()) !== 1) problems.push(`${name}: expected exactly one <h1>`);
  const text = await sheet.innerText();
  for (const needle of [c.footer, c.disclaimer, ...(title ? [title] : [])]) if (!text.includes(needle)) problems.push(`${name}: sheet lacks "${needle}"`);
  if (!text.toLowerCase().includes(c.optin.toLowerCase())) problems.push(`${name}: sheet lacks the double opt-in explanation`);
  for (const f of forbidden) if (text.includes(f)) problems.push(`${name}: sheet shows "${f}"`);
}

/** Startup form with the example and a typed name → results → export (anonymous teaser). */
export async function exportStartupTeaser(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang} export startup teaser`;
  await freshSession(page, base);
  await page.goto(`${base}${c.startup}`);
  await page.getByRole('button', { name: c.example }).click();
  await page.getByRole('button', { name: c.draft }).click();
  await page.getByRole('button', { name: c.skip }).click();
  await page.getByLabel(c.name).fill(NAME);
  await page.getByRole('button', { name: c.confirm }).click();
  await page.getByRole('heading', { name: c.results }).waitFor();
  await page.getByRole('link', { name: c.exportStartup }).click();
  await page.waitForURL((u) => u.pathname.endsWith(`/${c.exportPath}`));
  await checkSheet(page, lang, problems, name, { title: c.teaserTitle, forbidden: [NAME] });
  // The name never reaches the URL or the storage.
  if (page.url().includes('Pagalampo')) problems.push(`${name}: name in the URL`);
  const stored = await page.evaluate(() => JSON.stringify(Object.entries(window.sessionStorage)));
  if (stored.includes('Pagalampo')) problems.push(`${name}: name in sessionStorage`);
}

/** Same, then the full version: the typed name appears; Markdown download and copy work. */
export async function exportStartupFull(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang} export startup full`;
  await exportStartupTeaser(page, base, lang, problems);
  await page.getByRole('radio', { name: c.full }).check();
  await checkSheet(page, lang, problems, name);
  if (!(await page.locator('.mi-sheet-title').innerText()).includes(NAME)) problems.push(`${name}: full version lacks the typed name`);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: c.download }).click()]);
  const file = download.suggestedFilename();
  if (!/^matchinvstar-[a-z-]+-\d{4}-\d{2}-\d{2}\.md$/.test(file)) problems.push(`${name}: unexpected file name ${file}`);
  const md = readFileSync(await download.path(), 'utf8');
  if (!md.includes(NAME)) problems.push(`${name}: Markdown lacks the name`);
  if (!md.includes(c.disclaimer.replace(/\./g, '.'))) problems.push(`${name}: Markdown lacks the disclaimer`);
  await page.getByRole('button', { name: c.copy }).click();
  await page.getByText(c.copied).first().waitFor({ state: 'attached' });
}

/** Startup form with the sample deck (accepted team and traction) → export teaser. */
export async function exportStartupDeck(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang} export startup deck`;
  await freshSession(page, base);
  await page.goto(`${base}${c.startup}`);
  await page.getByRole('button', { name: c.sample }).click();
  await page.getByText(c.deckRead).waitFor();
  await page.getByRole('button', { name: c.readDeck }).click();
  await page.getByRole('button', { name: c.skip }).click();
  await page.getByRole('button', { name: c.useAll }).click();
  await page.getByRole('button', { name: c.apply }).click();
  await page.getByRole('button', { name: c.confirm }).click();
  await page.getByRole('heading', { name: c.results }).waitFor();
  await page.getByRole('link', { name: c.exportStartup }).click();
  await checkSheet(page, lang, problems, name, { title: c.teaserTitle });
  const text = await page.locator('.mi-sheet').innerText();
  if (!/MRR|ARR/.test(text)) problems.push(`${name}: accepted traction missing`);
  const stored = await page.evaluate(() => window.sessionStorage.getItem('matchinvstar-export') ?? '');
  if (stored.includes('snippet') || stored.includes('findings')) problems.push(`${name}: deck text in the export storage`);
}

/** Investor form with the example → results → thesis sheet. */
export async function exportInvestor(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang} export investor`;
  await freshSession(page, base);
  await page.goto(`${base}${c.investor}`);
  await page.getByRole('button', { name: c.example }).click();
  await page.getByRole('button', { name: c.findInvestor }).click();
  await page.getByRole('heading', { name: c.results }).waitFor();
  await page.getByRole('link', { name: c.exportInvestor }).click();
  await checkSheet(page, lang, problems, name, { title: c.thesisTitle });
  await page.locator('.mi-export-tools textarea').fill(lang === 'it' ? 'Preferiamo round con un lead già individuato.' : 'We prefer rounds with a lead already in place.');
}

/** A fictional demo investor's thesis sheet, from the investor profile page. */
export async function exportDemoInvestor(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang} export demo investor`;
  await page.goto(`${base}${c.profile}`);
  await page.getByRole('link', { name: c.exportDemo }).click();
  await checkSheet(page, lang, problems, name, { title: c.thesisTitle });
  if (!(await page.locator('.mi-sheet').innerText()).includes(c.fictional)) problems.push(`${name}: not labelled as fictional`);
}

/** No profile in this tab: friendly empty state with links to the agent and the form. */
export async function exportEmpty(page, base, lang, problems) {
  const c = COPY[lang];
  await freshSession(page, base);
  await page.goto(`${base}${c.exportPath}?${lang === 'it' ? 'tipo' : 'type'}=startup`);
  await page.getByRole('heading', { name: c.emptyTitle }).waitFor();
  if ((await page.locator('.mi-empty a').count()) < 2) problems.push(`${lang} export empty: missing agent/form links`);
}

/**
 * Print emulation: only the sheet is visible (no header, footer, banner, hero, tools), the disclaimer stays.
 * Returns after switching the page to print media; the caller captures it and resets the media.
 */
export async function checkPrintMedia(page, lang, problems, name) {
  const c = COPY[lang];
  await page.emulateMedia({ media: 'print' });
  const visible = await page.evaluate(() => {
    const shown = (sel) => [...document.querySelectorAll(sel)].some((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
    return {
      header: shown('.site-header'),
      footer: shown('.site-footer'),
      banner: shown('.mi-banner'),
      hero: shown('.page-hero'),
      tools: shown('.mi-export-tools'),
      sheet: shown('.mi-sheet'),
      disclaimer: shown('.mi-sheet-disclaimer'),
    };
  });
  for (const k of ['header', 'footer', 'banner', 'hero', 'tools']) if (visible[k]) problems.push(`${name}: ${k} visible in print`);
  if (!visible.sheet || !visible.disclaimer) problems.push(`${name}: sheet or disclaimer hidden in print`);
  const text = await page.locator('.mi-sheet-disclaimer').innerText();
  if (text !== c.disclaimer) problems.push(`${name}: print disclaimer reads "${text}"`);
}
