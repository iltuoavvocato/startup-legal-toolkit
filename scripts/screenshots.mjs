// Captures full-page screenshots of every page (desktop 1440×900, mobile 390×844 @2x) into screenshots/.
// Requires a build in dist/ (run `npm run build` first).
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { launchBrowser } from './browser.mjs';
import { startPreview } from './serve-dist.mjs';

const OUT = 'screenshots';
if (!existsSync('dist/index.html')) {
  console.error('dist/ not found: run `npm run build` first.');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// Design variants gallery (internal, noindex): the gallery plus every variant screen, in both languages.
const routesMeta = JSON.parse(readFileSync('src/routes-meta.json', 'utf8'));
const VARIANT_PAGES = routesMeta.routes
  .filter((r) => r.id === 'matchVariants' || /^matchV\d/.test(r.id))
  .flatMap((r) => {
    const m = r.id.match(/^matchV(\d)(\w+)$/);
    const name = m ? `variant-v${m[1]}-${m[2].toLowerCase()}` : 'variants-gallery';
    return [
      [name, r.it.path.slice(1)],
      [`en-${name}`, r.en.path.slice(1)],
    ];
  });

const PAGES = [
  ['home', ''],
  ['equity', 'equity/'],
  ['vesting', 'vesting/'],
  ['quiz', 'quiz/'],
  ['privacy', 'privacy/'],
  ['404', 'pagina-che-non-esiste/'],
  ['match', 'match-investitori/'],
  ['match-startup', 'match-investitori/startup/'],
  ['match-investor', 'match-investitori/investitore/'],
  ['match-optin', 'match-investitori/doppio-consenso/'],
  ['match-legal', 'match-investitori/note-legali/'],
  ['en-home', 'en/'],
  ['en-equity', 'en/equity/'],
  ['en-404', 'en/page-that-does-not-exist/'],
  ['en-match', 'en/investor-match/'],
  ...VARIANT_PAGES,
];

const VARIANT_COPY = {
  it: { tag: 'Variante di design – prototipo', disclaimer: 'Strumento indicativo: non sostituisce una consulenza legale.', fictional: 'Dati di esempio fittizi' },
  en: { tag: 'Design variant – prototype', disclaimer: 'Indicative tool: not a substitute for legal advice.', fictional: 'Fictional sample data' },
};

/** Variant pages: banner, fictional-data label, disclaimer and the noindex meta must all be there. */
async function checkVariantPage(page, name) {
  const lang = name.startsWith('en-') ? 'en' : 'it';
  const c = VARIANT_COPY[lang];
  const text = await page.locator('main').innerText();
  // Case-insensitive: some variants set labels in uppercase with CSS, which innerText reflects.
  for (const [what, needle] of Object.entries(c)) if (!text.toLowerCase().includes(needle.toLowerCase())) problems.push(`${name}: missing ${what} "${needle}"`);
  const robots = await page.locator('meta[name="robots"]').first().getAttribute('content').catch(() => null);
  if (robots !== 'noindex, nofollow') problems.push(`${name}: robots meta is "${robots}"`);
  if ((await page.locator('h1').count()) !== 1) problems.push(`${name}: expected exactly one <h1>`);
  const dupes = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  });
  if (dupes.length) problems.push(`${name}: duplicate ids ${dupes.join(', ')}`);
}

async function pressTimes(locator, key, n) {
  await locator.focus();
  for (let i = 0; i < n; i++) await locator.press(key);
}

async function setRange(locator, value) {
  await locator.focus();
  await locator.press('Home');
  await locator.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

const problems = [];

async function expectNoDeckCopy(page, name, analysisLabel, forbidden) {
  const stepper = await page.locator('.mi-steps').innerText();
  if (!stepper.includes(analysisLabel)) problems.push(`${name}: stepper lacks "${analysisLabel}"`);
  const text = await page.locator('main').innerText();
  if (forbidden.test(text)) problems.push(`${name}: deck-reading copy shown without a deck`);
}

/** The compare view loads two variant screens in iframes: wait until both have rendered their heading. */
async function waitForCompareFrames(page) {
  const frames = page.locator('.vg-frame iframe');
  const n = await frames.count();
  if (n !== 2) problems.push(`gallery: expected 2 compare iframes, found ${n}`);
  for (let i = 0; i < n; i++) {
    await frames.nth(i).scrollIntoViewIfNeeded();
    await frames.nth(i).contentFrame().locator('#page-title').waitFor();
    const header = await frames.nth(i).contentFrame().locator('.site-header').count();
    if (header) problems.push('gallery: compare iframe shows the site header (embed mode not applied)');
  }
}

async function expectText(page, name, needles) {
  const text = await page.locator('main').innerText();
  for (const n of needles) if (!text.includes(n)) problems.push(`${name}: missing "${n}"`);
}

/** Sample deck → read on the device → agent checklist → "Cosa abbiamo trovato nel deck" / "What we found in your deck". */
async function openDeckReview(page, base, lang) {
  const it = lang === 'it';
  await page.goto(`${base}${it ? 'match-investitori/startup/' : 'en/investor-match/startup/'}`);
  await page.getByRole('button', { name: it ? 'Prova con un deck di esempio' : 'Try a sample deck' }).click();
  await page.getByText(it ? /pagine lette sul tuo dispositivo/ : /pages read on your device/).waitFor();
  await page.getByRole('button', { name: it ? /Fai leggere il deck/ : /Let the agent read the deck/ }).click();
  await page.getByRole('button', { name: it ? 'Salta l’attesa' : 'Skip the wait' }).click();
  await page.getByRole('heading', { name: it ? 'Cosa abbiamo trovato nel deck' : 'What we found in your deck' }).waitFor();
}

const STATES = {
  // Design variants: the interactions work on the real engine, and a startup's "no" is never revealed.
  'variant-v4-investor-swiped': async (page, base) => {
    await page.goto(`${base}match-investitori/varianti/v4/investitore/`);
    await page.locator('#page-title').waitFor();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.getByText('3 di 5').first().waitFor();
  },
  'en-variant-v2-results-sorted': async (page, base) => {
    await page.goto(`${base}en/investor-match/variants/v2/results/`);
    await page.locator('#page-title').waitFor();
    const header = page.locator('th:has(button.v2-sort)').filter({ hasText: /^Investor/ }).first();
    await header.locator('button').click();
    const sort = await header.getAttribute('aria-sort');
    if (sort !== 'ascending' && sort !== 'descending') problems.push(`v2 sort: aria-sort is "${sort}" after clicking`);
  },
  'variant-v3-investor-chat': async (page, base) => {
    await page.goto(`${base}match-investitori/varianti/v3/investitore/`);
    await page.locator('#page-title').waitFor();
    await page.getByRole('button', { name: 'Interessato', exact: true }).click();
    await page.getByRole('button', { name: 'Simula la risposta della startup' }).click();
  },
  // The first sample teaser (Contoverde) declines in the demo: the investor must keep seeing "Interesse inviato".
  'variant-v5-investor-declined': async (page, base) => {
    await page.goto(`${base}match-investitori/varianti/v5/investitore/`);
    await page.locator('#page-title').waitFor();
    await page.getByRole('button', { name: 'Interessato', exact: true }).first().click();
    await page.getByRole('button', { name: 'Simula la risposta della startup' }).first().click();
    const text = await page.locator('main').innerText();
    if (text.includes('Contoverde') || text.includes('Giada')) problems.push('v5 investor: a declining startup was revealed');
    if (!text.includes('Interesse inviato')) problems.push('v5 investor: declined interest does not read "Interesse inviato"');
  },
  'equity-3-founders': async (page, base) => {
    await page.goto(`${base}equity/`);
    await page.getByRole('button', { name: 'Aggiungi cofondatore' }).click();
    const names = ['Giulia', 'Marco', 'Sara'];
    for (let i = 0; i < 3; i++) await page.locator(`#founder-name-${i}`).fill(names[i]);
    const values = [
      { idea: 9, tempo: 100, cap: 20000, competenze: 7, ruolo: 8 },
      { idea: 4, tempo: 100, cap: 5000, competenze: 9, ruolo: 6 },
      { idea: 2, tempo: 40, cap: 0, competenze: 6, ruolo: 3 },
    ];
    const cards = page.locator('.founder-card');
    for (let i = 0; i < 3; i++) {
      const sliders = cards.nth(i).locator('input[type=range]');
      const v = values[i];
      await setRange(sliders.nth(0), v.idea);
      await setRange(sliders.nth(1), v.tempo);
      await setRange(sliders.nth(2), v.competenze);
      await setRange(sliders.nth(3), v.ruolo);
      await cards.nth(i).locator('input[type=number]').fill(v.cap ? String(v.cap) : '');
    }
    await setRange(page.getByLabel('Riserva pool / ESOP'), 10);
  },
  'vesting-leaver': async (page, base) => {
    await page.goto(`${base}vesting/`);
    const slider = page.getByLabel('Il founder esce al mese');
    await slider.focus();
    await slider.press('Home');
    await pressTimes(slider, 'ArrowRight', 18);
    await page.getByRole('radio', { name: 'Bad leaver' }).check();
  },
  'quiz-result': async (page, base) => {
    await page.goto(`${base}quiz/`);
    const picks = ['Siamo in 3 o più', 'No, non ancora', 'Solo a voce', 'Sì', 'Sì', 'Sì', 'No'];
    for (const label of picks) {
      await page.getByRole('radio', { name: label, exact: true }).check();
      await page.locator('.quiz-nav button[type=submit]').click();
    }
    await page.getByRole('heading', { name: /La tua checklist/ }).waitFor();
  },
  // Deck flow with the fictional sample deck: read locally by pdf.js, findings reviewed, then results.
  'match-startup-deck-read': async (page, base) => {
    await page.goto(`${base}match-investitori/startup/`);
    await page.getByRole('button', { name: 'Prova con un deck di esempio' }).click();
    await page.getByText(/8 pagine lette sul tuo dispositivo/).waitFor();
    await expectText(page, 'match-startup-deck-read', ['Il file non lascia il tuo browser: viene letto qui, sul tuo dispositivo.']);
  },
  'match-startup-deck-review': async (page, base) => {
    await openDeckReview(page, base, 'it');
    await expectText(page, 'match-startup-deck-review', [
      'Il file non lascia il tuo browser: viene letto qui, sul tuo dispositivo.',
      'Agritech',
      'Dal deck, pagina 7',
      'Bari (Puglia)',
    ]);
    const stepper = await page.locator('.mi-steps').innerText();
    if (!stepper.includes('Lettura del deck')) problems.push('match-startup-deck-review: stepper lacks "Lettura del deck"');
  },
  'match-startup-results': async (page, base) => {
    await openDeckReview(page, base, 'it');
    // Nothing is applied silently: before any choice the tally says every finding is pending.
    await expectText(page, 'match-startup-results (review)', ['0 da usare']);
    await page.getByRole('button', { name: 'Usa tutti i suggerimenti' }).click();
    await page.getByRole('button', { name: 'Applica le scelte e continua' }).click();
    await page.getByRole('heading', { name: /Controlla il profilo/ }).waitFor();
    await page.getByRole('button', { name: 'Conferma il profilo' }).click();
    await page.getByRole('heading', { name: /I tuoi match/ }).waitFor();
    await expectText(page, 'match-startup-results', ['L’agente ha usato il tuo deck per:', '(dal tuo deck, p. 7)', 'MRR 18.000']);
    await page.getByRole('button', { name: /Proponi il profilo/ }).first().click();
  },
  // A file that isn't a readable PDF: clear message and fallback to the form, no deck-reading copy afterwards.
  'match-startup-deck-error': async (page, base) => {
    await page.goto(`${base}match-investitori/startup/`);
    await page.getByRole('button', { name: 'Usa un esempio' }).click();
    await page.locator('input[type=file]').setInputFiles({
      name: 'deck-rotto.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%placeholder, not a real PDF\n'),
    });
    await page.getByText('Non riusciamo a leggere questo PDF').waitFor();
    await expectText(page, 'match-startup-deck-error', ['Puoi continuare senza deck']);
    if (!(await page.getByRole('button', { name: 'Prepara il profilo' }).isVisible())) problems.push('match-startup-deck-error: no fallback to the form-only flow');
  },
  // No deck uploaded: neither the stepper nor the agent checklist may say the deck is being read.
  'match-startup-agent-nodeck': async (page, base) => {
    await page.goto(`${base}match-investitori/startup/`);
    await page.getByRole('button', { name: 'Usa un esempio' }).click();
    await page.getByRole('button', { name: 'Prepara il profilo' }).click();
    await page.getByRole('heading', { name: 'L’agente sta preparando il profilo' }).waitFor();
    await expectNoDeckCopy(page, 'match-startup-agent-nodeck', 'Analisi dei dati', /lettura del deck|leggendo il deck/i);
  },
  'match-investor-results': async (page, base) => {
    await page.goto(`${base}match-investitori/investitore/`);
    await page.getByRole('button', { name: 'Usa un esempio' }).click();
    await page.getByRole('button', { name: 'Trova startup in linea' }).click();
    await page.getByRole('heading', { name: /I tuoi match/ }).waitFor();
  },
  'en-quiz-result': async (page, base) => {
    await page.goto(`${base}en/quiz/`);
    const picks = ['Three or more', 'No, not yet', 'Only verbally', 'Yes', 'Yes', 'Yes', 'No'];
    for (const label of picks) {
      await page.getByRole('radio', { name: label, exact: true }).check();
      await page.locator('.quiz-nav button[type=submit]').click();
    }
    await page.getByRole('heading', { name: /Your checklist/ }).waitFor();
  },
  'en-match-startup-results': async (page, base) => {
    await page.goto(`${base}en/investor-match/startup/`);
    await page.getByRole('button', { name: 'Use an example' }).click();
    // No-deck path: the button and the agent copy must not mention reading a deck.
    await page.getByRole('button', { name: 'Draft the profile' }).click();
    await page.getByRole('heading', { name: 'The agent is drafting the profile' }).waitFor();
    await page.getByRole('button', { name: 'Skip the wait' }).click();
    await page.getByRole('heading', { name: 'The agent drafted your profile: check it' }).waitFor();
    await page.getByRole('button', { name: 'Confirm the profile' }).click();
    await page.getByRole('heading', { name: /Your matches/ }).waitFor();
    await page.getByRole('button', { name: /Propose your profile/ }).first().click();
  },
  'en-match-startup-agent-nodeck': async (page, base) => {
    await page.goto(`${base}en/investor-match/startup/`);
    await page.getByRole('button', { name: 'Use an example' }).click();
    await page.getByRole('button', { name: 'Draft the profile' }).click();
    await page.getByRole('heading', { name: 'The agent is drafting the profile' }).waitFor();
    await expectNoDeckCopy(page, 'en-match-startup-agent-nodeck', 'Analysing your details', /reading the deck/i);
  },
  'en-match-startup-deck-review': async (page, base) => {
    await openDeckReview(page, base, 'en');
    await expectText(page, 'en-match-startup-deck-review', [
      'The file doesn’t leave your browser: it’s read here, on your device.',
      'Healthtech',
      'From the deck, page 7',
      'Naples (Campania)',
    ]);
  },
  'en-match-startup-deck-results': async (page, base) => {
    await openDeckReview(page, base, 'en');
    await page.getByRole('button', { name: 'Use all suggestions' }).click();
    await page.getByRole('button', { name: 'Apply my choices and continue' }).click();
    await page.getByRole('button', { name: 'Confirm the profile' }).click();
    await page.getByRole('heading', { name: /Your matches/ }).waitFor();
    await expectText(page, 'en-match-startup-deck-results', ['The agent used your deck for:', '(from your deck, p. 7)', 'ARR']);
  },
  'en-match-optin-intro': async (page, base) => {
    await page.goto(`${base}en/investor-match/double-opt-in/`);
    await page.getByRole('button', { name: /Send the proposal/ }).click();
    await page.getByRole('button', { name: 'Yes, I’m interested' }).click();
    await page.getByRole('button', { name: 'Accept the intro' }).click();
    await page.getByRole('article', { name: /Preview of the introduction email/ }).waitFor();
  },
  'match-optin-intro': async (page, base) => {
    await page.goto(`${base}match-investitori/doppio-consenso/`);
    await page.getByRole('button', { name: /Invia la proposta/ }).click();
    await page.getByRole('button', { name: 'Sì, mi interessa' }).click();
    await page.getByRole('button', { name: 'Accetta l’intro' }).click();
    await page.getByRole('article', { name: /Anteprima dell’email/ }).waitFor();
  },
};

const { url: base, stop } = await startPreview();
const browser = await launchBrowser();
const files = [];
try {
  for (const [vpName, opts] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ ...opts, reducedMotion: 'reduce', locale: 'it-IT' });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('console', (msg) => msg.type() === 'error' && problems.push(`[${vpName}] console: ${msg.text()}`));
    page.on('pageerror', (err) => problems.push(`[${vpName}] pageerror: ${err.message}`));
    page.on('request', (req) => {
      if (!req.url().startsWith(new URL(base).origin) && !req.url().startsWith('data:') && !req.url().startsWith('blob:'))
        problems.push(`[${vpName}] external request: ${req.url()}`);
      // Nothing is ever sent: only GETs of same-origin assets (pages, scripts, the pdf.js worker, the sample deck).
      if (req.method() !== 'GET') problems.push(`[${vpName}] ${req.method()} request: ${req.url()}`);
    });

    const shoot = async (name) => {
      await page.evaluate(async () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        window.scrollTo(0, 0);
        await document.fonts.ready;
      });
      await page.waitForTimeout(150);
      // Compare with the configured viewport too: on mobile emulation the layout viewport can grow with the content.
      const overflow = await page.evaluate(
        (w) => Math.max(document.documentElement.scrollWidth, window.innerWidth) - w,
        opts.viewport.width,
      );
      if (overflow > 0) problems.push(`[${vpName}] ${name}: horizontal overflow of ${overflow}px`);
      // Privacy: no cookies ever; localStorage may only hold the language preference (written by the switcher).
      const storage = await page.evaluate(() => ({ cookie: document.cookie, keys: Object.keys(window.localStorage) }));
      if (storage.cookie) problems.push(`[${vpName}] ${name}: cookie set (${storage.cookie})`);
      const extra = storage.keys.filter((k) => k !== 'lang');
      if (extra.length) problems.push(`[${vpName}] ${name}: unexpected localStorage keys ${extra.join(', ')}`);
      const lang = await page.evaluate(() => document.documentElement.lang);
      const expected = name.startsWith('en-') ? 'en' : 'it';
      if (lang !== expected) problems.push(`[${vpName}] ${name}: <html lang="${lang}">, expected "${expected}"`);
      const file = join(OUT, `${name}-${vpName}.png`);
      // Fixed elements would be painted mid-page in a full-page capture: hide them here (captured separately).
      await page.screenshot({ path: file, fullPage: true, style: '.mobile-summary { display: none !important; }' });
      files.push(file);
    };

    for (const [name, path] of PAGES) {
      await page.goto(`${base}${path}`);
      await page.locator('#page-title').waitFor();
      if (name.includes('variant')) await checkVariantPage(page, name);
      // Phones/touch: no keyboard-shortcut legend (V2 dashboard, V4 cards).
      if (vpName === 'mobile' && (await page.locator('.v2-keys, .v4-keys').filter({ visible: true }).count()))
        problems.push(`[mobile] ${name}: keyboard legend visible on a touch phone`);
      if (name.endsWith('variants-gallery')) await waitForCompareFrames(page);
      await shoot(name);
    }
    for (const [name, run] of Object.entries(STATES)) {
      await run(page, base);
      await shoot(name);
    }
    if (vpName === 'mobile') {
      await page.goto(base);
      await page.getByRole('button', { name: 'Apri il menu' }).click();
      await page.waitForTimeout(100);
      const file = join(OUT, 'menu-open-mobile.png');
      await page.screenshot({ path: file });
      files.push(file);
      await page.goto(`${base}equity/`);
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(400);
      const sticky = join(OUT, 'equity-sticky-summary-mobile.png');
      await page.screenshot({ path: sticky });
      files.push(sticky);
    }
    await context.close();
  }

  // Language switcher: equivalent page, stored preference, and the redirect from "/" only.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}vesting/`);
    if ((await page.evaluate(() => Object.keys(window.localStorage).length)) !== 0) problems.push('switcher: storage not empty before use');
    await page.getByRole('group', { name: 'Lingua' }).getByRole('link', { name: 'English' }).click();
    await page.waitForURL(/\/en\/vesting\/$/);
    const stored = await page.evaluate(() => window.localStorage.getItem('lang'));
    if (stored !== 'en') problems.push(`switcher: expected lang=en in localStorage, got ${stored}`);
    await page.goto(`${base}quiz/`);
    if (!page.url().endsWith('/quiz/')) problems.push('switcher: an explicit Italian URL was redirected');
    // No Italian flash: with "en" stored, the Italian home must leave before its body is parsed,
    // so the only document that reaches DOMContentLoaded is the English one.
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const seen = JSON.parse(window.sessionStorage.getItem('dcl') ?? '[]');
        seen.push(`${location.pathname}|${document.documentElement.lang}`);
        window.sessionStorage.setItem('dcl', JSON.stringify(seen));
      });
    });
    await page.goto(base);
    await page.waitForURL(/\/en\/$/);
    await page.locator('#page-title').waitFor();
    const seen = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('dcl') ?? '[]'));
    await page.evaluate(() => window.sessionStorage.clear());
    const enHome = `${new URL(base).pathname}en/|en`;
    if (seen.length !== 1 || seen[0] !== enHome) problems.push(`switcher: Italian home was parsed before the redirect (${seen.join(', ')})`);
    await page.getByRole('group', { name: 'Language' }).getByRole('link', { name: 'Italiano' }).click();
    await page.waitForURL((u) => u.pathname === new URL(base).pathname);
    await page.goto(base);
    await page.waitForTimeout(200);
    if (new URL(page.url()).pathname !== new URL(base).pathname) problems.push('switcher: "/" redirected after choosing Italian');
    await context.close();
  }

  // Static 404.html as GitHub Pages / Vercel serve it for unknown paths (vite preview would serve index.html).
  {
    const html404 = readFileSync('dist/404.html', 'utf8');
    const cases = [
      ['pagina-che-non-esiste/', 'it', 'Pagina non trovata', 'Strumento indicativo: non sostituisce una consulenza legale.'],
      ['en/page-that-does-not-exist/', 'en', 'Page not found', 'Indicative tool: not a substitute for legal advice.'],
    ];
    for (const javaScriptEnabled of [true, false]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled });
      const page = await context.newPage();
      page.on('pageerror', (err) => problems.push(`404.html: pageerror ${err.message}`));
      await page.route(/\/(pagina-che-non-esiste|en\/page-that-does-not-exist)\/$/, (route) =>
        route.fulfill({ status: 404, contentType: 'text/html; charset=utf-8', body: html404 }),
      );
      for (const [path, lang, heading, disclaimer] of cases) {
        const label = `404.html ${path} (JS ${javaScriptEnabled ? 'on' : 'off'})`;
        await page.goto(`${base}${path}`);
        const h1 = page.getByRole('heading', { level: 1, name: heading });
        await h1.first().waitFor();
        if (!(await page.getByText(disclaimer).first().isVisible())) problems.push(`${label}: disclaimer not visible`);
        if (javaScriptEnabled) {
          const htmlLang = await page.evaluate(() => document.documentElement.lang);
          if (htmlLang !== lang) problems.push(`${label}: <html lang="${htmlLang}">, expected "${lang}"`);
          const other = lang === 'en' ? 'Pagina non trovata' : 'Page not found';
          if (await page.getByText(other).isVisible().catch(() => false)) problems.push(`${label}: other language visible`);
          const file = join(OUT, `${lang === 'en' ? 'en-' : ''}404-static-desktop.png`);
          await page.screenshot({ path: file, fullPage: true });
          files.push(file);
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  stop();
}

console.log(files.map((f) => `  ${f}`).join('\n'));
if (problems.length) {
  console.log('\nIssues found:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `\n${files.length} screenshots, no console errors, no external or non-GET requests, no horizontal overflow, no cookies, correct <html lang>, language switcher OK.`,
  );
}
