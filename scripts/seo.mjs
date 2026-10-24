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

// Same text as the `disclaimer` string in src/i18n/messages/common.ts (a test keeps them in sync).
export const DISCLAIMER = {
  it: 'Strumento indicativo: non sostituisce una consulenza legale.',
  en: 'Indicative tool: not a substitute for legal advice.',
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
      ...(r.robots ? { robots: r.robots } : {}),
      alternates: { it: r.it.path, en: r.en.path },
    })),
  );
}

/** The single 404.html: Italian by default, with the English copy alongside for /en/… paths. */
export function notFoundPage(meta) {
  return { ...meta.notFound.it, path: null, locale: 'it', noindex: true, alternates: null, notFound: { it: meta.notFound.it, en: meta.notFound.en } };
}

/**
 * Inline script for the Italian home only. If the visitor chose English earlier with the switcher
 * (localStorage "lang"), it leaves for /en/ before the body is parsed, so no Italian is ever painted.
 * Crawlers have no stored preference, so the prerendered Italian page is what they see.
 */
export function homeRedirectScript(base) {
  const home = JSON.stringify(base);
  const en = JSON.stringify(`${base}en/`);
  return `<script>(function(){try{var p=location.pathname;if((p===${home}||p===${home}+'index.html')&&localStorage.getItem('lang')==='en')location.replace(${en}+location.search+location.hash)}catch(e){}})()</script>`;
}

/**
 * Inline script for 404.html (served for every unknown path): on /en/… it switches <html lang> and the title
 * to English before paint, and a class on <html> shows only the matching copy of the static fallback.
 */
export function notFoundLocaleScript(base, titles) {
  const b = JSON.stringify(base);
  const title = JSON.stringify(titles.en);
  return `<script>(function(){var p=location.pathname,b=${b},d=document.documentElement,en=p===b+'en'||p.indexOf(b+'en/')===0;d.lang=en?'en':'it';d.classList.add(en?'nf-en':'nf-it');if(en)document.title=${title}})()</script><style>.nf-it [data-nf=en],.nf-en [data-nf=it]{display:none}</style>`;
}

/**
 * @param {object} page   { title, description, path, locale, noindex?, robots?, alternates? }
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
      : page.robots
        ? `<meta name="robots" content="${esc(page.robots)}" />`
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

/** Minimal static content shown before JavaScript runs (replaced by React on mount), disclaimer included. */
export function fallbackBody({ heading, description, locale = 'it' }) {
  return `<main style="max-width:44rem;margin:0 auto;padding:4rem 1.25rem;font-family:system-ui,sans-serif;color:#0B1730"><h1>${esc(heading)}</h1><p>${esc(description)}</p><p style="font-size:.85rem">${esc(DISCLAIMER[locale])}</p><noscript><p>${NOSCRIPT[locale]}</p></noscript></main>`;
}

/** Static 404 content in both languages; without JavaScript both are shown. */
export function notFoundBody(notFound) {
  const block = (locale) =>
    `<div lang="${locale}" data-nf="${locale}"><h1>${esc(notFound[locale].heading)}</h1><p>${esc(notFound[locale].description)}</p><p style="font-size:.85rem">${esc(DISCLAIMER[locale])}</p><noscript><p>${NOSCRIPT[locale]}</p></noscript></div>`;
  return `<main style="max-width:44rem;margin:0 auto;padding:4rem 1.25rem;font-family:system-ui,sans-serif;color:#0B1730">${block('it')}${block('en')}</main>`;
}

export function renderPage(template, page, config) {
  const headScript = page.notFound
    ? notFoundLocaleScript(config.base, { en: page.notFound.en.title })
    : page.path === '/' && (page.locale ?? 'it') === 'it'
      ? homeRedirectScript(config.base)
      : '';
  return template
    .replace(/<html lang="[a-z]+">/, `<html lang="${page.locale ?? 'it'}">`)
    .replace(/<meta charset="[^"]*" \/>/i, (m) => (headScript ? `${m}\n    ${headScript}` : m))
    .replace(/<link rel="icon"[^>]*>\s*/, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace('<!--seo-->', headTags(page, config))
    .replace('<!--app-->', page.notFound ? notFoundBody(page.notFound) : fallbackBody(page));
}

/** Pages with a robots directive (the design variants) are noindex and stay out of the sitemap. */
export function sitemapXml(meta, abs, today) {
  const urls = pages(meta)
    .filter((p) => !p.robots)
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
