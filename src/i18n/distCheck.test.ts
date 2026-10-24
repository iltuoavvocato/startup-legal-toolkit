import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkAsset, checkHtml, checkSitemap, intendedRobots } from '../../scripts/dist-check.mjs';
import { DISCLAIMER, notFoundPage, pages, renderPage, sitemapXml, type RoutesMeta } from '../../scripts/seo.mjs';

const routesMeta: RoutesMeta = JSON.parse(readFileSync(new URL('../routes-meta.json', import.meta.url), 'utf8'));
const siteOrigin = 'https://example.test';
const abs = (path: string) => `${siteOrigin}${path}`;
const seo = { abs, base: '/', siteNoindex: false };
const cfg = { siteOrigin, siteNoindex: false };
const template = `<!doctype html><html lang="it"><head><meta charset="UTF-8" /><link rel="icon" href="/x.svg" /><title>x</title><!--seo--><script type="module" crossorigin src="/assets/app.js"></script></head><body><div id="root"><!--app--></div></body></html>`;
const byId = (id: string, locale: 'it' | 'en' = 'it') => pages(routesMeta).find((p) => p.id === id && p.locale === locale)!;
const html = (id: string, locale: 'it' | 'en' = 'it') => renderPage(template, byId(id, locale), seo);

describe('dist check: prerendered HTML', () => {
  it('accepts every page as the prerender writes it (both languages) and the 404', () => {
    for (const p of pages(routesMeta)) expect(checkHtml('f', renderPage(template, p, seo), p, cfg), p.id).toEqual([]);
    expect(checkHtml('404', renderPage(template, notFoundPage(routesMeta), seo), null, cfg)).toEqual([]);
  });

  it('follows the written-out policy: variants and export noindex+nofollow, demo/inbox/profile noindex, the rest indexed', () => {
    expect(intendedRobots('matchVariants')).toBe('noindex, nofollow');
    expect(intendedRobots('matchV3Agent')).toBe('noindex, nofollow');
    expect(intendedRobots('matchExport')).toBe('noindex, nofollow');
    expect(intendedRobots('matchGuidedDemo')).toBe('noindex, follow');
    expect(intendedRobots('matchHowItWorks')).toBeNull();
    expect(intendedRobots('match')).toBeNull();
  });

  it('fails a variant page that lost its noindex, and an indexed page that gained one', () => {
    const v = html('matchV1Landing').replace(/<meta name="robots"[^>]*>/, '');
    expect(checkHtml('v1', v, byId('matchV1Landing'), cfg)).toEqual([expect.stringContaining('robots meta is missing, expected "noindex, nofollow"')]);
    const m = html('match').replace('</head>', '<meta name="robots" content="noindex" /></head>');
    expect(checkHtml('m', m, byId('match'), cfg)).toEqual([expect.stringContaining('expected none (indexed page)')]);
  });

  it('fails a page without the disclaimer in its prerendered HTML', () => {
    const page = byId('matchGuidedDemo', 'en');
    const h = renderPage(template, page, seo).replace(DISCLAIMER.en, '');
    expect(checkHtml('demo', h, page, cfg)).toEqual([expect.stringContaining('lacks the disclaimer')]);
  });

  it('fails external scripts, styles, images and trackers; allows own canonical/hreflang links', () => {
    const page = byId('match');
    const base = html('match');
    const add = (s: string) => checkHtml('m', base.replace('</head>', `${s}</head>`), page, cfg);
    expect(add('<script src="https://cdn.example.com/lib.js"></script>')).toEqual([expect.stringContaining('<script> loads an external URL')]);
    expect(add('<link rel="stylesheet" href="//fonts.googleapis.com/css" />')).toEqual([expect.stringContaining('<link> loads an external URL')]);
    expect(add('<img src="https://px.example.com/p.gif" />')).toEqual([expect.stringContaining('<img> loads an external URL')]);
    expect(add('<script>gtag("config","G-1")</script>').join()).toContain('Google tag');
    expect(add('<script>!function(f,b,e,v,n,t,s){fbq("init","1")}()</script>').join()).toContain('Facebook pixel');
    expect(base).toContain(`<link rel="canonical" href="${siteOrigin}/match-investitori/" />`);
  });

  it('expects noindex, nofollow everywhere on a NOINDEX preview build', () => {
    const p = byId('match');
    expect(checkHtml('m', renderPage(template, p, { ...seo, siteNoindex: true }), p, { ...cfg, siteNoindex: true })).toEqual([]);
  });
});

describe('dist check: bundles and sitemap', () => {
  it('allows namespace URLs and the site’s own domains, fails any other origin, request or tracker', () => {
    expect(checkAsset('a.js', 'createElementNS("http://www.w3.org/2000/svg","svg");fetch("/demo/deck.pdf")')).toEqual([]);
    expect(checkAsset('a.js', 'fetch("https://api.example.com/track")').join()).toContain('request to an external URL');
    expect(checkAsset('a.js', 'x.open("POST","https://api.example.com")').join()).toContain('XHR to an external URL');
    expect(checkAsset('a.css', '@import url("https://fonts.googleapis.com/css2")').join()).toContain('CSS @import');
    for (const t of ['googletagmanager.com/gtm.js', 'static.hotjar.com', 'cdn.segment.com/analytics.js', 'plausible.io/js', 'navigator.sendBeacon(u)']) {
      expect(checkAsset('a.js', t), t).not.toEqual([]);
    }
  });

  it('accepts the real sitemap and fails one that lists a variant page or misses an indexed one', () => {
    const list = pages(routesMeta);
    const xml = sitemapXml(routesMeta, abs, '2026-01-01');
    expect(checkSitemap(xml, list, abs)).toEqual([]);
    const variant = abs(byId('matchV2Results', 'en').path);
    expect(checkSitemap(xml.replace('</urlset>', `<url><loc>${variant}</loc></url></urlset>`), list, abs)).toEqual([expect.stringContaining('meant to be noindex')]);
    const how = abs(byId('matchHowItWorks').path);
    expect(checkSitemap(xml.replace(`<loc>${how}</loc>`, ''), list, abs)).toEqual([expect.stringContaining('missing the indexed page')]);
  });
});
