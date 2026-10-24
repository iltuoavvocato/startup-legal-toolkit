// Build output check (`npm run check:dist`, also run by `npm run e2e` after the build). Fails with a list of
// problems if dist/ loads anything from another origin, contains analytics/tracker code, a prerendered page has
// the wrong robots directive or lacks the disclaimer, or the sitemap lists a noindex page (or misses an indexed one).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAsset, checkHtml, checkSitemap } from './dist-check.mjs';
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

if (errors.length) {
  console.error(`check:dist: ${errors.length} problem(s) in the build output:\n${errors.map((e) => `  ✗ ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`check:dist: ok — ${seen.size} HTML pages, ${assets.length} JS/CSS assets, sitemap: no external origins, no trackers, robots and disclaimer as intended.`);
