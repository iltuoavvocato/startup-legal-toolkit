import { describe, expect, it } from 'vitest';
import {
  DISCLAIMER,
  fallbackBody,
  headTags,
  notFoundPage,
  pages,
  renderPage,
  sitemapXml,
  type RoutesMeta,
} from '../../scripts/seo.mjs';
import { MESSAGES } from './messages';
import meta from '../routes-meta.json';

const routesMeta = meta as RoutesMeta;
const abs = (p: string) => `https://example.test${'/'}${p.replace(/^\//, '')}`;
const config = { abs, base: '/', siteNoindex: false };
const template =
  '<!doctype html>\n<html lang="it">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" href="/favicon.svg" />\n    <title>x</title>\n    <!--seo-->\n  </head>\n  <body><div id="root"><!--app--></div></body>\n</html>';

const page = (path: string) => pages(routesMeta).find((p) => p.path === path)!;

describe('prerender meta', () => {
  it('emits a page per route and locale', () => {
    expect(pages(routesMeta)).toHaveLength(routesMeta.routes.length * 2);
  });

  it('renders English pages with lang="en", English meta, canonical and hreflang alternates', () => {
    const html = renderPage(template, page('/en/equity/'), config);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Co-founder equity split calculator | Startup Legal Toolkit</title>');
    expect(html).toContain('<link rel="canonical" href="https://example.test/en/equity/" />');
    expect(html).toContain('<link rel="alternate" hreflang="it" href="https://example.test/equity/" />');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://example.test/en/equity/" />');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://example.test/equity/" />');
    expect(html).toContain('<meta property="og:locale" content="en_GB" />');
    expect(html).toContain('<h1>Equity split calculator</h1>');
    expect(html).toContain('please enable JavaScript');
  });

  it('keeps Italian pages in Italian with the same alternates', () => {
    const html = renderPage(template, page('/match-investitori/'), config);
    expect(html).toContain('<html lang="it">');
    expect(html).toContain('<link rel="canonical" href="https://example.test/match-investitori/" />');
    expect(html).toContain('hreflang="en" href="https://example.test/en/investor-match/"');
    expect(html).toContain('<meta property="og:locale" content="it_IT" />');
    expect(fallbackBody({ heading: 'H', description: 'D' })).toContain('attiva JavaScript');
  });

  it('applies NOINDEX to every page, English included, and noindex to the 404', () => {
    for (const p of pages(routesMeta)) {
      expect(headTags(p, { ...config, siteNoindex: true })).toContain('<meta name="robots" content="noindex, nofollow" />');
      if (!p.robots) expect(headTags(p, config)).not.toContain('name="robots"');
    }
    const nf = headTags(notFoundPage(routesMeta), config);
    expect(nf).toContain('<meta name="robots" content="noindex" />');
    expect(nf).not.toContain('canonical');
    expect(nf).not.toContain('hreflang');
  });

  it('lists both languages in the sitemap with alternates', () => {
    const xml = sitemapXml(routesMeta, abs, '2026-01-01');
    const indexable = routesMeta.routes.filter((r) => !r.robots);
    expect(xml.match(/<url>/g)).toHaveLength(indexable.length * 2);
    expect(xml).toContain('<loc>https://example.test/en/investor-match/double-opt-in/</loc>');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });
});

describe('design variants (internal prototype pages)', () => {
  const variantPages = pages(routesMeta).filter((p) => p.id === 'matchVariants' || /^matchV\d/.test(p.id));

  it('covers the gallery and 5 variants × 5 screens in both languages', () => {
    expect(variantPages).toHaveLength((1 + 5 * 5) * 2);
  });

  it('are noindex, nofollow in the prerendered HTML, in both languages, keeping the canonical', () => {
    for (const p of variantPages) {
      const html = renderPage(template, p, config);
      expect(html, p.path).toContain('<meta name="robots" content="noindex, nofollow" />');
      expect(html).toContain(`<link rel="canonical" href="${abs(p.path)}" />`);
      expect(html).toContain(`<html lang="${p.locale}">`);
    }
    expect(renderPage(template, page('/en/investor-match/variants/v4/investor/'), config)).toContain('<html lang="en">');
  });

  it('stay out of the sitemap while every other page is listed', () => {
    const xml = sitemapXml(routesMeta, abs, '2026-01-01');
    expect(xml).not.toContain('varianti');
    expect(xml).not.toContain('variants');
    expect(xml).toContain('<loc>https://example.test/match-investitori/investitore/</loc>');
    for (const p of pages(routesMeta).filter((x) => !x.robots)) expect(xml).toContain(`<loc>${abs(p.path)}</loc>`);
  });

  it('do not change the robots tag of regular pages', () => {
    expect(headTags(page('/match-investitori/'), config)).not.toContain('robots');
    expect(headTags(page('/match-investitori/varianti/'), { ...config, siteNoindex: true })).toContain('content="noindex, nofollow"');
  });
});

/** Runs the first inline <script> of a rendered page against stubbed browser globals. */
function runInlineScript(html: string, env: { pathname: string; search?: string; hash?: string; stored?: string | null }) {
  const body = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!body) throw new Error('no inline script');
  const replaced: string[] = [];
  const classes: string[] = [];
  const location = {
    pathname: env.pathname,
    search: env.search ?? '',
    hash: env.hash ?? '',
    replace: (u: string) => replaced.push(u),
  };
  const localStorage = { getItem: (k: string) => (k === 'lang' ? (env.stored ?? null) : null) };
  const document = { title: 'IT title', documentElement: { lang: 'it', classList: { add: (c: string) => classes.push(c) } } };
  new Function('location', 'localStorage', 'document', body)(location, localStorage, document);
  return { replaced, classes, lang: document.documentElement.lang, title: document.title };
}

describe('no Italian flash for English visitors on the home', () => {
  const home = renderPage(template, page('/'), config);

  it('puts the redirect script before any stylesheet or module script, on the Italian home only', () => {
    expect(home.indexOf('<script>')).toBeGreaterThan(home.indexOf('<meta charset="UTF-8" />'));
    expect(home.indexOf('<script>')).toBeLessThan(home.indexOf('<title>'));
    expect(renderPage(template, page('/en/'), config)).not.toContain('<script>');
    expect(renderPage(template, page('/equity/'), config)).not.toContain('<script>');
  });

  it('redirects "/" to "/en/" before paint only when English was chosen, keeping query and hash', () => {
    expect(runInlineScript(home, { pathname: '/', stored: 'en', search: '?a=1', hash: '#x' }).replaced).toEqual(['/en/?a=1#x']);
    expect(runInlineScript(home, { pathname: '/index.html', stored: 'en' }).replaced).toEqual(['/en/']);
    expect(runInlineScript(home, { pathname: '/', stored: 'it' }).replaced).toEqual([]);
    expect(runInlineScript(home, { pathname: '/', stored: null }).replaced).toEqual([]);
  });

  it('honours the base path', () => {
    const html = renderPage(template, page('/'), { ...config, base: '/toolkit/' });
    expect(runInlineScript(html, { pathname: '/toolkit/', stored: 'en' }).replaced).toEqual(['/toolkit/en/']);
    expect(runInlineScript(html, { pathname: '/', stored: 'en' }).replaced).toEqual([]);
  });

  it('keeps the Italian home intact when storage is unavailable', () => {
    const body = home.match(/<script>([\s\S]*?)<\/script>/)![1]!;
    const throwing = { getItem: () => { throw new Error('denied'); } };
    expect(() => new Function('location', 'localStorage', body)({ pathname: '/', replace: () => {} }, throwing)).not.toThrow();
  });
});

describe('bilingual 404.html', () => {
  const html = renderPage(template, notFoundPage(routesMeta), config);

  it('contains both languages with the disclaimer, Italian by default', () => {
    expect(html).toContain('<html lang="it">');
    expect(html).toContain('<h1>Pagina non trovata</h1>');
    expect(html).toContain('<h1>Page not found</h1>');
    expect(html).toContain(DISCLAIMER.it);
    expect(html).toContain(DISCLAIMER.en);
    expect(html).toContain('<meta name="robots" content="noindex" />');
  });

  it('switches to English before paint on /en/ paths only', () => {
    const en = runInlineScript(html, { pathname: '/en/missing/' });
    expect(en).toMatchObject({ lang: 'en', classes: ['nf-en'], title: 'Page not found | Startup Legal Toolkit' });
    expect(runInlineScript(html, { pathname: '/en' }).lang).toBe('en');
    const it = runInlineScript(html, { pathname: '/pagina-che-non-esiste/' });
    expect(it).toMatchObject({ lang: 'it', classes: ['nf-it'], title: 'IT title' });
    expect(runInlineScript(html, { pathname: '/english/' }).lang).toBe('it');
    const based = renderPage(template, notFoundPage(routesMeta), { ...config, base: '/toolkit/' });
    expect(runInlineScript(based, { pathname: '/toolkit/en/x/' }).lang).toBe('en');
  });

  it('uses the same disclaimer text as the app', () => {
    expect(DISCLAIMER.it).toBe(MESSAGES.it.common.disclaimer);
    expect(DISCLAIMER.en).toBe(MESSAGES.en.common.disclaimer);
  });
});
