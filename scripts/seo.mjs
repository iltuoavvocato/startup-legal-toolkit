// Pure helpers for scripts/prerender.mjs: per-route head tags, static fallback, page list and sitemap.
// Kept free of file-system access so they can be unit tested (src/i18n/seo.test.ts).

export const LOCALES = ['it', 'en'];
const OG_LOCALE = { it: 'it_IT', en: 'en_GB' };
const OG_IMAGE_ALT = {
  it: 'Startup Legal Toolkit di ilTuoAvvocato.com',
  en: 'Startup Legal Toolkit by ilTuoAvvocato.com',
};
const NOSCRIPT = {
  it: 'Per usare gli strumenti interattivi attiva JavaScript.',
  en: 'To use the interactive tools, please enable JavaScript.',
};

export function normalizeBase(raw) {
  let base = (raw ?? '/').trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Every page to write: one per route and locale, plus the alternates of each. */
export function pages(meta) {
  return meta.routes.flatMap((r) =>
    LOCALES.map((locale) => ({
      ...r[locale],
      id: r.id,
      locale,
      alternates: { it: r.it.path, en: r.en.path },
    })),
  );
}

export function notFoundPage(meta) {
  return { ...meta.notFound.it, path: null, locale: 'it', noindex: true, alternates: null };
}

/**
 * @param {object} page   { title, description, path, locale, noindex?, alternates? }
 * @param {object} config { abs(path) → absolute URL, base, siteNoindex }
 */
export function headTags(page, { abs, base, siteNoindex }) {
  const url = page.path ? abs(page.path) : null;
  const locale = page.locale ?? 'it';
  const alternates = page.alternates
    ? [
        `<link rel="alternate" hreflang="it" href="${abs(page.alternates.it)}" />`,
        `<link rel="alternate" hreflang="en" href="${abs(page.alternates.en)}" />`,
        `<link rel="alternate" hreflang="x-default" href="${abs(page.alternates.it)}" />`,
      ]
    : [];
  const ogImage = abs('og-image.png');
  return [
    `<meta name="description" content="${esc(page.description)}" />`,
    siteNoindex
      ? '<meta name="robots" content="noindex, nofollow" />'
      : page.noindex
        ? '<meta name="robots" content="noindex" />'
        : '',
    url ? `<link rel="canonical" href="${url}" />` : '',
    ...alternates,
    `<link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="${OG_LOCALE[locale]}" />`,
    `<meta property="og:site_name" content="Startup Legal Toolkit · ilTuoAvvocato.com" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    url ? `<meta property="og:url" content="${url}" />` : '',
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${OG_IMAGE_ALT[locale]}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

/** Minimal static content shown before JavaScript runs (replaced by React on mount). */
export function fallbackBody({ heading, description, locale = 'it' }) {
  return `<main style="max-width:44rem;margin:0 auto;padding:4rem 1.25rem;font-family:system-ui,sans-serif;color:#0B1730"><h1>${esc(heading)}</h1><p>${esc(description)}</p><noscript><p>${NOSCRIPT[locale]}</p></noscript></main>`;
}

export function renderPage(template, page, config) {
  return template
    .replace(/<html lang="[a-z]+">/, `<html lang="${page.locale ?? 'it'}">`)
    .replace(/<link rel="icon"[^>]*>\s*/, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace('<!--seo-->', headTags(page, config))
    .replace('<!--app-->', fallbackBody(page));
}

export function sitemapXml(meta, abs, today) {
  const urls = pages(meta)
    .map((p) => {
      const priority = p.id === 'home' ? '1.0' : p.id === 'privacy' ? '0.3' : '0.8';
      return `  <url>
    <loc>${abs(p.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="it" href="${abs(p.alternates.it)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${abs(p.alternates.en)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(p.alternates.it)}" />
  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
