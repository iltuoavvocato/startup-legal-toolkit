// Captures full-page screenshots of every page (desktop 1440×900, mobile 390×844 @2x) into screenshots/.
// Requires a build in dist/ (run `npm run build` first).
import { existsSync, mkdirSync } from 'node:fs';
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
];

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

const STATES = {
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
  'match-startup-results': async (page, base) => {
    await page.goto(`${base}match-investitori/startup/`);
    await page.getByRole('button', { name: 'Usa un esempio' }).click();
    await page.getByRole('button', { name: /Fai leggere il deck/ }).click();
    await page.getByRole('button', { name: 'Salta l’attesa' }).click();
    await page.getByRole('button', { name: 'Conferma il profilo' }).click();
    await page.getByRole('heading', { name: /I tuoi match/ }).waitFor();
    await page.getByRole('button', { name: /Proponi il profilo/ }).first().click();
  },
  'match-investor-results': async (page, base) => {
    await page.goto(`${base}match-investitori/investitore/`);
    await page.getByRole('button', { name: 'Usa un esempio' }).click();
    await page.getByRole('button', { name: 'Trova startup in linea' }).click();
    await page.getByRole('heading', { name: /I tuoi match/ }).waitFor();
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
const problems = [];
try {
  for (const [vpName, opts] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ ...opts, reducedMotion: 'reduce', locale: 'it-IT' });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('console', (msg) => msg.type() === 'error' && problems.push(`[${vpName}] console: ${msg.text()}`));
    page.on('pageerror', (err) => problems.push(`[${vpName}] pageerror: ${err.message}`));
    page.on('request', (req) => {
      if (!req.url().startsWith(new URL(base).origin) && !req.url().startsWith('data:'))
        problems.push(`[${vpName}] external request: ${req.url()}`);
    });

    const shoot = async (name) => {
      await page.evaluate(async () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        window.scrollTo(0, 0);
        await document.fonts.ready;
      });
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) problems.push(`[${vpName}] ${name}: horizontal overflow of ${overflow}px`);
      const file = join(OUT, `${name}-${vpName}.png`);
      // Fixed elements would be painted mid-page in a full-page capture: hide them here (captured separately).
      await page.screenshot({ path: file, fullPage: true, style: '.mobile-summary { display: none !important; }' });
      files.push(file);
    };

    for (const [name, path] of PAGES) {
      await page.goto(`${base}${path}`);
      await page.locator('#page-title').waitFor();
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
} finally {
  await browser.close();
  stop();
}

console.log(files.map((f) => `  ${f}`).join('\n'));
if (problems.length) {
  console.log('\nIssues found:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`\n${files.length} screenshots, no console errors, no external requests, no horizontal overflow.`);
}
