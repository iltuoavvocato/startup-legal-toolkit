// Post-build step: writes one static HTML file per route and language with its own <html lang>, <title>,
// description, canonical, hreflang alternates and Open Graph tags, plus 404.html (SPA fallback for GitHub Pages),
// robots.txt and sitemap.xml (with hreflang alternates).
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkFiles, preloadTags, routeSources } from './preload.mjs';
import { normalizeBase, notFoundPage, pages, renderPage, sitemapXml } from './seo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const meta = JSON.parse(readFileSync(join(root, 'src/routes-meta.json'), 'utf8'));

const base = normalizeBase(process.env.BASE_PATH);
const siteUrl = (process.env.SITE_URL ?? 'https://toolkit.iltuoavvocato.com').replace(/\/+$/, '');
const abs = (path) => `${siteUrl}${base}${path.replace(/^\//, '')}`;
// NOINDEX=true: site-wide noindex for preview deployments (every page gets the robots meta, no Sitemap in robots.txt).
const siteNoindex = process.env.NOINDEX === 'true';
const config = { abs, base, siteNoindex };

const template = readFileSync(join(dist, 'index.html'), 'utf8');
if (!template.includes('<!--seo-->') || !template.includes('<!--app-->') || !/<meta charset="[^"]*" \/>/i.test(template)) {
  throw new Error('dist/index.html is missing the <!--seo--> or <!--app--> placeholder or the <meta charset> tag');
}

// Preload hints: the page's own chunk (Vite manifest, then removed from the deploy) and the fonts.
const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8'));
rmSync(join(dist, '.vite'), { recursive: true, force: true });
const sources = routeSources(readFileSync(join(root, 'src/routePages.tsx'), 'utf8'), meta.routes.map((r) => r.id));
// Only the heading font (roman + italic): a late swap re-wraps the hero title and shifts the page. Inter (body text)
// swaps in place without measurable shift, and preloading it too would take bandwidth from the scripts.
const fonts = readdirSync(join(dist, 'assets'))
  .filter((f) => /^Playfair(Italic)?-[\w-]+\.woff2$/.test(f))
  .map((f) => `assets/${f}`);
if (fonts.length !== 2) throw new Error(`expected 2 Playfair font files in dist/assets, found ${fonts.length}`);
const withHints = (html, files) => html.replace('</head>', `  ${preloadTags(files, fonts, base)}\n  </head>`);

for (const page of pages(meta)) {
  const out = page.path === '/' ? join(dist, 'index.html') : join(dist, page.path, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  const files = chunkFiles(manifest, sources[page.id]);
  if (!files.js.length) throw new Error(`no chunk found for route ${page.id} (${sources[page.id]})`);
  writeFileSync(out, withHints(renderPage(template, page, config), files));
  console.log(`prerender: ${page.path} → ${out.replace(root + '/', '')}`);
}

// One 404.html for the whole site (GitHub Pages and Vercel serve it for any unknown path). It carries both
// languages: an inline script picks English on /en/… paths before paint (<html lang>, title, static copy),
// then the app renders the matching "page not found" page.
writeFileSync(join(dist, '404.html'), withHints(renderPage(template, notFoundPage(meta), config), {}));
console.log('prerender: 404.html');

const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, 'sitemap.xml'), sitemapXml(meta, abs, today));
// Never Disallow here: crawlers must be able to fetch the pages to see the noindex tag.
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n${siteNoindex ? '' : `\nSitemap: ${abs('sitemap.xml')}\n`}`,
);
console.log('prerender: sitemap.xml, robots.txt');
