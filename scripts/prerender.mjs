// Post-build step: writes one static HTML file per route with its own <title>, description,
// canonical and Open Graph tags, plus 404.html (SPA fallback for GitHub Pages), robots.txt and sitemap.xml.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const meta = JSON.parse(readFileSync(join(root, 'src/routes-meta.json'), 'utf8'));

function normalizeBase(raw) {
  let base = (raw ?? '/').trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

const base = normalizeBase(process.env.BASE_PATH);
const siteUrl = (process.env.SITE_URL ?? 'https://toolkit.iltuoavvocato.com').replace(/\/+$/, '');
const abs = (path) => `${siteUrl}${base}${path.replace(/^\//, '')}`;
const ogImage = abs('og-image.png');
// NOINDEX=true: site-wide noindex for preview deployments (every page gets the robots meta, no Sitemap in robots.txt).
const siteNoindex = process.env.NOINDEX === 'true';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function headTags({ title, description, path, noindex }) {
  const url = path ? abs(path) : null;
  return [
    `<meta name="description" content="${esc(description)}" />`,
    siteNoindex
      ? '<meta name="robots" content="noindex, nofollow" />'
      : noindex
        ? '<meta name="robots" content="noindex" />'
        : '',
    url ? `<link rel="canonical" href="${url}" />` : '',
    `<link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="it_IT" />`,
    `<meta property="og:site_name" content="Startup Legal Toolkit · ilTuoAvvocato.com" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    url ? `<meta property="og:url" content="${url}" />` : '',
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Startup Legal Toolkit di ilTuoAvvocato.com" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

// Minimal static content shown before JavaScript runs (replaced by React on mount).
function fallbackBody({ heading, description }) {
  return `<main style="max-width:44rem;margin:0 auto;padding:4rem 1.25rem;font-family:system-ui,sans-serif;color:#0B1730"><h1>${esc(heading)}</h1><p>${esc(description)}</p><noscript><p>Per usare gli strumenti interattivi attiva JavaScript.</p></noscript></main>`;
}

const template = readFileSync(join(dist, 'index.html'), 'utf8');
if (!template.includes('<!--seo-->') || !template.includes('<!--app-->')) {
  throw new Error('dist/index.html is missing the <!--seo--> or <!--app--> placeholder');
}

function render(page) {
  return template
    .replace(/<link rel="icon"[^>]*>\s*/, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace('<!--seo-->', headTags(page))
    .replace('<!--app-->', fallbackBody(page));
}

for (const route of meta.routes) {
  const out = route.path === '/' ? join(dist, 'index.html') : join(dist, route.path, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, render(route));
  console.log(`prerender: ${route.path} → ${out.replace(root + '/', '')}`);
}

writeFileSync(join(dist, '404.html'), render({ ...meta.notFound, path: null, noindex: true }));
console.log('prerender: 404.html');

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${meta.routes
  .map(
    (r) => `  <url>
    <loc>${abs(r.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${r.path === '/' ? '1.0' : r.path === '/privacy/' ? '0.3' : '0.8'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync(join(dist, 'sitemap.xml'), sitemap);
// Never Disallow here: crawlers must be able to fetch the pages to see the noindex tag.
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n${siteNoindex ? '' : `\nSitemap: ${abs('sitemap.xml')}\n`}`,
);
console.log('prerender: sitemap.xml, robots.txt');
