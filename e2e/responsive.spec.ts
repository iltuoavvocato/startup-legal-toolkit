// Milestone 15: small phone (320×640, also the 400% zoom reflow width), tablet portrait (768×1024) and small laptop
// (1366×768) on every match route, IT + EN. For each page: no horizontal overflow, no clipped buttons, the sticky
// header never covers the focused element while tabbing backwards up the page (scroll-padding), and every target is
// at least 24×24 CSS px or has the spacing WCAG 2.2 2.5.8 allows. Runs in the desktop project only (it sets its own
// viewports; the mobile project ignores it in playwright.config.ts). Screenshots of each viewport go to screenshots/responsive/.
import type { Page } from '@playwright/test';
import { LOCALES, ROUTE_IDS, expect, open, openFresh, path, settle, t, test } from './fixtures';

const VIEWPORTS = [
  { name: 'phone-320', width: 320, height: 640 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1366', width: 1366, height: 768 },
] as const;

const MAIN_ROUTES = [
  'match',
  'matchStartup',
  'matchInvestor',
  'matchOptIn',
  'matchLegal',
  'matchAgentStartup',
  'matchAgentInvestor',
  'matchDirectory',
  'matchInvestorProfile',
  'matchRequests',
  'matchExport',
  'matchGuidedDemo',
  'matchHowItWorks',
];
const VARIANT_ROUTES = ROUTE_IDS.filter((id) => id.startsWith('matchV') || id === 'matchVariants');

const query = (id: string) => (id === 'matchInvestorProfile' || id === 'matchExport' ? '?id=i01' : '');

/** Elements sticking out of the viewport on the right, outside any horizontally scrolling/clipping container. */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders: string[] = [];
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox !== 'visible') return true;
      }
      return false;
    };
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.position === 'fixed' || clipped(el)) continue;
        if (el.closest('.sr-only, [aria-hidden="true"]')) continue;
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').join('.')} [${Math.round(r.left)}–${Math.round(r.right)}]`);
      }
    }
    return { scrollWidth: document.documentElement.scrollWidth, vw, offenders: offenders.slice(0, 10) };
  });
}

/** Buttons and button-like links whose box leaves the viewport or whose text is cut. */
async function clippedButtons(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    const sel = 'button, .btn, [class*="-cta"], [class*="btn-primary"], input[type="submit"]';
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === 'hidden') continue;
      if (el.closest('.sr-only, [hidden], dialog:not([open])')) continue;
      // A button inside a horizontal scroller (tables, chip rows) is reachable by scrolling it.
      let inScroller = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') inScroller = true;
      }
      const textCut = el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible';
      if ((!inScroller && (r.left < -1 || r.right > vw + 1)) || textCut) {
        out.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 40)}" [${Math.round(r.left)}–${Math.round(r.right)}]`);
      }
    }
    return out;
  });
}

/** WCAG 2.2 2.5.8: targets ≥ 24×24, or a 24 px circle on their centre touches no other target or circle. */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"]';
    type T = { el: HTMLElement; r: DOMRect };
    const targets: T[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      if (el.closest('.sr-only, [hidden], dialog:not([open]), [inert]')) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
      let r = el.getBoundingClientRect();
      // A visually hidden native input is operated through its label: measure the label.
      if (r.width <= 2 || r.height <= 2) {
        const label = el.closest('label') ?? (el.id ? document.querySelector<HTMLElement>(`label[for="${el.id}"]`) : null);
        if (!label) continue;
        r = label.getBoundingClientRect();
      }
      if (r.width === 0 || r.height === 0) continue;
      // Inline exception: a link inside a sentence.
      if (s.display === 'inline' && el.tagName === 'A') {
        const parentText = (el.parentElement?.textContent ?? '').trim();
        if (parentText.length > (el.textContent ?? '').trim().length + 1) continue;
      }
      targets.push({ el, r });
    }
    const small = targets.filter((x) => x.r.width < 23.5 || x.r.height < 23.5);
    const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    const circleHitsRect = (c: { x: number; y: number }, r: DOMRect) => {
      const dx = Math.max(r.left - c.x, 0, c.x - r.right);
      const dy = Math.max(r.top - c.y, 0, c.y - r.bottom);
      return dx * dx + dy * dy < 12 * 12 - 0.5;
    };
    const out: string[] = [];
    for (const a of small) {
      const c = centre(a.r);
      const clash = targets.some((b) => {
        if (b === a || b.el.contains(a.el) || a.el.contains(b.el)) return false;
        if (circleHitsRect(c, b.r)) return true;
        if (small.includes(b)) {
          const d = centre(b.r);
          return Math.hypot(c.x - d.x, c.y - d.y) < 24 - 0.5;
        }
        return false;
      });
      if (clash) {
        out.push(`${a.el.tagName.toLowerCase()}.${String(a.el.className).split(' ').join('.')} "${(a.el.textContent ?? a.el.getAttribute('aria-label') ?? '').trim().slice(0, 30)}" ${Math.round(a.r.width)}×${Math.round(a.r.height)}`);
      }
    }
    return out;
  });
}

/** Shift+Tab from the bottom of the page: each focused element must start below the sticky header. */
async function focusUnderHeader(page: Page, maxSteps = 60) {
  // Smooth scrolling is off with reduced motion, so the final scroll position can be measured right away.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll<HTMLElement>('main a[href], main button, main input, main select, main textarea, main summary, main [tabindex="0"]'));
    const last = all.filter((el) => el.getBoundingClientRect().height > 0 && !el.closest('[hidden], dialog:not([open])')).pop();
    // Start from the footer so the first Shift+Tab lands on the last control of main.
    (document.querySelector<HTMLElement>('footer a[href]') ?? last)?.focus();
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  const covered: string[] = [];
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press('Shift+Tab');
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const res = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const header = document.querySelector<HTMLElement>('.site-header');
      if (!el || !header || header.contains(el) || !el.closest('main')) return { done: !el?.closest('main') && !el?.closest('footer'), bad: '' };
      for (let p: HTMLElement | null = el; p; p = p.parentElement) {
        const pos = getComputedStyle(p).position;
        if (pos === 'fixed' || pos === 'sticky') return { done: false, bad: '' };
      }
      const r = el.getBoundingClientRect();
      const h = header.getBoundingClientRect().bottom;
      // An element taller than the space below the header can't start below it: it must at least be partly visible.
      const fits = r.height <= window.innerHeight - h;
      const bad = (fits ? r.top < h - 1 : r.bottom <= h || r.top >= window.innerHeight) ? `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}" top ${Math.round(r.top)} < header ${Math.round(h)}` : '';
      return { done: false, bad };
    });
    if (res.bad) covered.push(res.bad);
    if (res.done) break;
  }
  await page.emulateMedia({ reducedMotion: null });
  return covered;
}

async function checkPage(page: Page, label: string, opts: { focus?: boolean } = {}) {
  // Let entrance transitions settle before measuring.
  await settle(page);
  const o = await overflow(page);
  expect(o.offenders, `${label}: elements wider than the viewport`).toEqual([]);
  expect(o.scrollWidth, `${label}: page scrolls horizontally`).toBeLessThanOrEqual(o.vw);
  expect(await clippedButtons(page), `${label}: clipped buttons`).toEqual([]);
  expect(await smallTargets(page), `${label}: targets under 24 px without spacing`).toEqual([]);
  if (opts.focus) expect(await focusUnderHeader(page), `${label}: focus under the sticky header`).toEqual([]);
}

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const lang of LOCALES) {
      for (const id of MAIN_ROUTES) {
        test(`responsive ${vp.name}: ${id} (${lang})`, async ({ page }) => {
          await openFresh(page, `${path(id, lang)}${query(id)}`);
          await checkPage(page, `${id} ${lang} ${vp.name}`, { focus: true });
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({ path: `screenshots/responsive/${lang}-${id}-${vp.name}.png`, fullPage: true });
        });
      }

      test(`responsive ${vp.name}: founder results with the sample deck (${lang})`, async ({ page }) => {
        const m = t(lang).match.ui;
        await openFresh(page, path('matchStartup', lang));
        await page.getByRole('button', { name: m.dropzone.sample }).click();
        await page.getByRole('button', { name: m.startup.submitDeck }).click();
        await page.getByRole('button', { name: m.agent.skip }).click();
        await page.getByRole('heading', { name: m.findings.title }).waitFor();
        await checkPage(page, `findings ${lang} ${vp.name}`);
        await page.getByRole('button', { name: m.findings.acceptAll }).click();
        await page.getByRole('button', { name: m.findings.continue }).click();
        await page.getByRole('button', { name: m.startup.confirm }).click();
        await page.locator('.mi-match').first().waitFor();
        await checkPage(page, `results ${lang} ${vp.name}`, { focus: true });
        await page.screenshot({ path: `screenshots/responsive/${lang}-matchStartup-results-${vp.name}.png`, fullPage: true });
      });

      if (vp.width === 320) {
        test(`responsive ${vp.name}: variants gallery and 25 variant screens (${lang})`, async ({ page }) => {
          test.setTimeout(180_000);
          for (const id of VARIANT_ROUTES) {
            await open(page, path(id, lang));
            await checkPage(page, `${id} ${lang} ${vp.name}`);
          }
        });
      }
    }
  });
}
