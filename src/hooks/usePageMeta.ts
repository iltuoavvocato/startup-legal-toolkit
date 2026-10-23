import { useEffect } from 'react';
import { OG_LOCALE } from '../i18n/locales';
import { metaFor, pathFor, robotsFor } from '../i18n/routes';
import { absoluteUrl } from '../site';

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

const ROUTE_ROBOTS = 'data-route-robots';

/**
 * Client-side navigation into a noindex page (design variants) adds a robots meta, removed again on leaving.
 * A robots meta from the static HTML (site-wide NOINDEX or the page's own) is never touched.
 */
function syncRobots(content: string | null) {
  if (document.head.querySelector(`meta[name="robots"]:not([${ROUTE_ROBOTS}])`)) return;
  const own = document.head.querySelector(`meta[name="robots"][${ROUTE_ROBOTS}]`);
  if (!content) {
    own?.remove();
    return;
  }
  const el = own ?? document.head.appendChild(document.createElement('meta'));
  el.setAttribute('name', 'robots');
  el.setAttribute('content', content);
  el.setAttribute(ROUTE_ROBOTS, '');
}

/** Keeps lang, <title>, description, canonical, hreflang and OG tags in sync during client-side navigation. */
export function usePageMeta(pathname: string) {
  useEffect(() => {
    const { meta: m, path, id, locale } = metaFor(pathname);
    document.documentElement.lang = locale;
    document.title = m.title;
    setMeta('meta[name="description"]', 'content', m.description);
    setMeta('meta[property="og:title"]', 'content', m.title);
    setMeta('meta[property="og:description"]', 'content', m.description);
    setMeta('meta[property="og:locale"]', 'content', OG_LOCALE[locale]);
    setMeta('meta[name="twitter:title"]', 'content', m.title);
    setMeta('meta[name="twitter:description"]', 'content', m.description);
    syncRobots(id ? robotsFor(id) : null);
    if (path && id) {
      setMeta('link[rel="canonical"]', 'href', absoluteUrl(path));
      setMeta('meta[property="og:url"]', 'content', absoluteUrl(path));
      setMeta('link[rel="alternate"][hreflang="it"]', 'href', absoluteUrl(pathFor(id, 'it')));
      setMeta('link[rel="alternate"][hreflang="en"]', 'href', absoluteUrl(pathFor(id, 'en')));
      setMeta('link[rel="alternate"][hreflang="x-default"]', 'href', absoluteUrl(pathFor(id, 'it')));
    }
  }, [pathname]);
}
