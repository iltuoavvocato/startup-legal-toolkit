// Build output check (`npm run check:dist`, also run by `npm run e2e` after the build). Fails with a list of
// problems if dist/ loads anything from another origin, contains analytics/tracker code, a prerendered page has
// the wrong robots directive or lacks the disclaimer, the sitemap lists a noindex page (or misses an indexed one), a
// page's first-visit JS/CSS exceeds its size budget (scripts/size-budget.mjs) or a page preloads the pdf.js chunk.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAsset, checkHtml, checkSitemap } from './dist-check.mjs';
import { BUDGETS, PDF_CHUNK, budgetErrors, initialAssets, kb, lazyPdfErrors, shellAssets } from './size-budget.mjs';
import { normalizeBase, pages } from './seo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.error('check:dist: dist/ not found — run `npm run build` first.');
  process.exit(1);
}
const meta = JSON.parse(readFileSync(join(root, 'src/routes-meta.json'), 'utf8'));
// Same environment as scripts/prerender.mjs, so a preview build (NOINDEX=true) or another SITE_URL checks out too.
const base = normalizeBase(process.env.BASE_PATH);
const siteOrigin = (process.env.SITE_URL ?? 'https://toolkit.iltuoavvocato.com').replace(/\/+$/, '');
const siteNoindex = process.env.NOINDEX === 'true';
const abs = (path) => `${siteOrigin}${base}${path.replace(/^\//, '')}`;

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const files = walk(dist);
const rel = (f) => relative(root, f);
const errors = [];

// Prerendered pages: one per route and language, plus 404.html.
const list = pages(meta);
const seen = new Set();
for (const page of list) {
  const file = page.path === '/' ? join(dist, 'index.html') : join(dist, page.path, 'index.html');
  if (!existsSync(file)) {
    errors.push(`${rel(file)}: missing prerendered page for ${page.id} (${page.locale})`);
    continue;
  }
  seen.add(file);
  errors.push(...checkHtml(rel(file), readFileSync(file, 'utf8'), page, { siteOrigin, siteNoindex }));
}
errors.push(...checkHtml('dist/404.html', readFileSync(join(dist, '404.html'), 'utf8'), null, { siteOrigin, siteNoindex }));
seen.add(join(dist, '404.html'));
for (const f of files.filter((f) => f.endsWith('.html') && !seen.has(f))) errors.push(`${rel(f)}: unexpected HTML file (not a route)`);

// Bundles and styles.
const assets = files.filter((f) => /\.(m?js|css)$/.test(f));
for (const f of assets) errors.push(...checkAsset(rel(f), readFileSync(f, 'utf8')));

errors.push(...checkSitemap(readFileSync(join(dist, 'sitemap.xml'), 'utf8'), list, abs));

// Size budget (gzip) and pdf.js staying lazy.
const gz = new Map();
const gzipOf = (href) => {
  const file = join(dist, href.startsWith(base) ? href.slice(base.length) : href.replace(/^\//, ''));
  if (!gz.has(file)) gz.set(file, existsSync(file) ? gzipSync(readFileSync(file)).length : 0);
  return gz.get(file);
};
const total = ({ js, css }) => ({ js: js.reduce((n, f) => n + gzipOf(f), 0), css: css.reduce((n, f) => n + gzipOf(f), 0) });
const htmlOf = (id) => {
  const page = list.find((p) => p.id === id && p.locale === 'it');
  const file = page && join(dist, page.path, 'index.html');
  return file && existsSync(file) ? readFileSync(file, 'utf8') : null;
};
const sizes = { shell: total(shellAssets(readFileSync(join(dist, 'index.html'), 'utf8'))) };
for (const id of Object.keys(BUDGETS).filter((k) => k !== 'shell' && k !== 'pdf')) {
  const html = htmlOf(id);
  if (html) sizes[id] = total(initialAssets(html)); // a missing page is reported as "not measured"
}
const pdfChunks = assets.filter((f) => PDF_CHUNK.test(f));
if (pdfChunks.length !== 1) errors.push(`size budget: expected one pdf.js chunk in dist/assets, found ${pdfChunks.length}`);
else sizes.pdf = { js: gzipSync(readFileSync(pdfChunks[0])).length };
errors.push(...budgetErrors(sizes));
for (const f of files.filter((f) => f.endsWith('.html'))) errors.push(...lazyPdfErrors(rel(f), readFileSync(f, 'utf8')));
const sizeLine = Object.entries(sizes)
  .map(([name, s]) => `${name} ${kb(s.js)}${s.css === undefined ? '' : `+${kb(s.css)}`}`)
  .join(', ');

if (errors.length) {
  console.error(`check:dist: ${errors.length} problem(s) in the build output:\n${errors.map((e) => `  ✗ ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`check:dist: ok — ${seen.size} HTML pages, ${assets.length} JS/CSS assets, sitemap: no external origins, no trackers, robots and disclaimer as intended.`);
console.log(`check:dist: sizes within budget (kB gzip, JS+CSS on a first visit): ${sizeLine}; pdf.js not preloaded by any page.`);
