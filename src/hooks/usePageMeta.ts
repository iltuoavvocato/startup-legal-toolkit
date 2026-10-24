import { useEffect } from 'react';
import { OG_LOCALE } from '../i18n/locales';
import { metaFor, pathFor, routeRobots } from '../i18n/routes';
import { absoluteUrl } from '../site';

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * The robots meta follows the route on every navigation: added, changed or removed so a page reached client-side
 * carries the same directive as its prerendered HTML. Only a site-wide NOINDEX (preview deploys) is left alone.
 */
function syncRobots(content: string | null) {
  if (document.head.querySelector('meta[name="robots"][data-site-noindex]')) return;
  const el = document.head.querySelector('meta[name="robots"]');
  if (!content) {
    el?.remove();
    return;
  }
  const meta = el ?? document.head.appendChild(document.createElement('meta'));
  meta.setAttribute('name', 'robots');
  meta.setAttribute('content', content);
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
    syncRobots(routeRobots(id));
    if (path && id) {
      setMeta('link[rel="canonical"]', 'href', absoluteUrl(path));
      setMeta('meta[property="og:url"]', 'content', absoluteUrl(path));
      setMeta('link[rel="alternate"][hreflang="it"]', 'href', absoluteUrl(pathFor(id, 'it')));
      setMeta('link[rel="alternate"][hreflang="en"]', 'href', absoluteUrl(pathFor(id, 'en')));
      setMeta('link[rel="alternate"][hreflang="x-default"]', 'href', absoluteUrl(pathFor(id, 'it')));
    }
  }, [pathname]);
}
