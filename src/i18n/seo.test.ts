import { describe, expect, it } from 'vitest';
import { fallbackBody, headTags, notFoundPage, pages, renderPage, sitemapXml, type RoutesMeta } from '../../scripts/seo.mjs';
import meta from '../routes-meta.json';

const routesMeta = meta as RoutesMeta;
const abs = (p: string) => `https://example.test${'/'}${p.replace(/^\//, '')}`;
const config = { abs, base: '/', siteNoindex: false };
const template =
  '<!doctype html>\n<html lang="it">\n  <head>\n    <link rel="icon" href="/favicon.svg" />\n    <title>x</title>\n    <!--seo-->\n  </head>\n  <body><div id="root"><!--app--></div></body>\n</html>';

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
      expect(headTags(p, config)).not.toContain('name="robots"');
    }
    const nf = headTags(notFoundPage(routesMeta), config);
    expect(nf).toContain('<meta name="robots" content="noindex" />');
    expect(nf).not.toContain('canonical');
    expect(nf).not.toContain('hreflang');
  });

  it('lists both languages in the sitemap with alternates', () => {
    const xml = sitemapXml(routesMeta, abs, '2026-01-01');
    expect(xml.match(/<url>/g)).toHaveLength(routesMeta.routes.length * 2);
    expect(xml).toContain('<loc>https://example.test/en/investor-match/double-opt-in/</loc>');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });
});
