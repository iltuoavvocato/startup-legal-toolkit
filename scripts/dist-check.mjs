// Pure checks for the built site (run by scripts/check-dist.mjs, unit tested in src/i18n/distCheck.test.ts):
// no external origins or trackers in dist/, the intended robots directive and the disclaimer on every prerendered
// page, and the noindex pages kept out of the sitemap. No file-system access here.
import { DISCLAIMER } from './seo.mjs';

/**
 * Indexing policy, written out on purpose (not read from routes-meta.json, which is what is being checked).
 * Every other route is indexed and listed in the sitemap.
 */
export const ROBOTS_POLICY = [
  { match: (id) => id === 'matchVariants' || /^matchV\d/.test(id), robots: 'noindex, nofollow', why: 'design variants (D15)' },
  { match: (id) => id === 'matchExport', robots: 'noindex, nofollow', why: 'export sheet' },
  { match: (id) => id === 'matchGuidedDemo', robots: 'noindex, follow', why: 'guided demo (D43)' },
  { match: (id) => id === 'matchInvestorProfile', robots: 'noindex, follow', why: 'investor profile' },
  { match: (id) => id === 'matchRequests', robots: 'noindex, follow', why: 'requests inbox' },
];

export const intendedRobots = (id) => ROBOTS_POLICY.find((p) => p.match(id))?.robots ?? null;

/**
 * Absolute URLs allowed inside JS/CSS bundles: XML namespaces and licence/doc references that are never fetched
 * (pdf.js, React), plus the site's own domains. Anything else is treated as a possible external request.
 */
export const ALLOWED_BUNDLE_ORIGINS = [
  'http://www.w3.org',
  'http://www.xfa.org',
  'http://ns.adobe.com',
  'http://www.apache.org',
  'https://reactjs.org',
  'https://iltuoavvocato.com',
  'https://toolkit.iltuoavvocato.com',
];

/** Analytics and tracker signatures (case-sensitive where the plain word is common, e.g. "segment"). */
export const TRACKERS = [
  ['Google tag (gtag)', /\bgtag\s*\(/],
  ['Google Tag Manager', /googletagmanager/i],
  ['Google Analytics', /google-analytics\.com|\bga\s*\(\s*['"](create|send)['"]/i],
  ['dataLayer', /\bdataLayer\.push\b/],
  ['Facebook pixel', /connect\.facebook\.net|\bfbq\s*\(/i],
  ['Hotjar', /hotjar/i],
  ['Segment', /cdn\.segment\.(com|io)|api\.segment\.io|analytics\.load\s*\(/i],
  ['Plausible', /plausible\.io|\bplausible\s*\(/i],
  ['Matomo', /matomo|piwik/i],
  ['Mixpanel', /mixpanel/i],
  ['Amplitude', /amplitude\.com|cdn\.amplitude/i],
  ['Microsoft Clarity', /clarity\.ms/i],
  ['PostHog', /posthog/i],
  ['Umami', /umami\.is|data-website-id/i],
  ['Cloudflare analytics', /cloudflareinsights|beacon\.min\.js/i],
  ['LinkedIn insight', /snap\.licdn\.com|_linkedin_partner_id/i],
  ['TikTok pixel', /analytics\.tiktok\.com|\bttq\.load\b/i],
  ['sendBeacon', /navigator\.sendBeacon/],
];

/** Problems in one prerendered HTML file. `page` = { id, locale, path } or null for 404.html. */
export function checkHtml(file, html, page, { siteOrigin, siteNoindex }) {
  const errors = [];
  const tags = [...html.matchAll(/<(script|link|img|iframe|source|embed|object)\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of tags) {
    const name = tag.slice(1).split(/[\s>]/)[0].toLowerCase();
    const attr = /\b(src|href|data|srcset)\s*=\s*"([^"]*)"/i.exec(tag);
    if (!attr) continue;
    const url = attr[2].trim();
    const own = /\brel="(canonical|alternate)"/i.test(tag) && url.startsWith(`${siteOrigin}/`);
    if (/^(https?:)?\/\//i.test(url) && !own) {
      errors.push(`${file}: <${name}> loads an external URL ${url} (bundle it locally)`);
    }
  }
  for (const [what, re] of TRACKERS) if (re.test(html)) errors.push(`${file}: tracker signature "${what}" found`);

  const robots = /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? null;
  if (page) {
    const want = siteNoindex ? 'noindex, nofollow' : intendedRobots(page.id);
    if (robots !== want) {
      errors.push(`${file}: robots meta is ${robots ? `"${robots}"` : 'missing'}, expected ${want ? `"${want}"` : 'none (indexed page)'} for route ${page.id}`);
    }
    if (!html.includes(DISCLAIMER[page.locale])) errors.push(`${file}: prerendered HTML lacks the disclaimer "${DISCLAIMER[page.locale]}"`);
  } else {
    if (!robots?.includes('noindex')) errors.push(`${file}: the 404 page must be noindex`);
    for (const l of ['it', 'en']) if (!html.includes(DISCLAIMER[l])) errors.push(`${file}: lacks the disclaimer "${DISCLAIMER[l]}"`);
  }
  return errors;
}

/** Problems in one JS/CSS asset: external origins (fetch/XHR/import/url()) and tracker signatures. */
export function checkAsset(file, text) {
  const errors = [];
  const origins = new Set([...text.matchAll(/\b(?:https?|wss?):\/\/[A-Za-z0-9.-]+/g)].map((m) => m[0]));
  for (const o of origins) if (!ALLOWED_BUNDLE_ORIGINS.includes(o)) errors.push(`${file}: external origin ${o} in the bundle`);
  const literal = /\b(?:fetch|importScripts|import)\s*\(\s*["'`]((?:https?:)?\/\/[^"'`]+)/g;
  for (const m of text.matchAll(literal)) errors.push(`${file}: request to an external URL ${m[1]}`);
  for (const m of text.matchAll(/\.open\s*\(\s*["'`][A-Z]+["'`]\s*,\s*["'`]((?:https?:)?\/\/[^"'`]+)/g)) errors.push(`${file}: XHR to an external URL ${m[1]}`);
  for (const m of text.matchAll(/@import\s+(?:url\()?\s*["']?((?:https?:)?\/\/[^"')\s]+)/g)) errors.push(`${file}: CSS @import of ${m[1]}`);
  for (const m of text.matchAll(/url\(\s*["']?((?:https?:)?\/\/[^"')\s]+)/g)) errors.push(`${file}: CSS url() to ${m[1]}`);
  for (const [what, re] of TRACKERS) if (re.test(text)) errors.push(`${file}: tracker signature "${what}" found`);
  return errors;
}

/** Sitemap: indexed pages listed, noindex pages (variants, guided demo, inbox, export, profile) left out. */
export function checkSitemap(xml, pageList, abs) {
  const errors = [];
  const locs = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  for (const p of pageList) {
    const url = abs(p.path);
    const want = intendedRobots(p.id);
    if (want && locs.has(url)) errors.push(`sitemap.xml lists ${url}, which is meant to be noindex (${p.id})`);
    if (!want && !locs.has(url)) errors.push(`sitemap.xml is missing the indexed page ${url} (${p.id})`);
  }
  return errors;
}
