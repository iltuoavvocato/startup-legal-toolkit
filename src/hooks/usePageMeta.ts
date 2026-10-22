import { useEffect } from 'react';
import { absoluteUrl, metaFor } from '../site';

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/** Keeps <title>, description, canonical and OG tags in sync during client-side navigation. */
export function usePageMeta(path: string) {
  useEffect(() => {
    const m = metaFor(path);
    document.title = m.title;
    setMeta('meta[name="description"]', 'content', m.description);
    setMeta('meta[property="og:title"]', 'content', m.title);
    setMeta('meta[property="og:description"]', 'content', m.description);
    setMeta('meta[name="twitter:title"]', 'content', m.title);
    setMeta('meta[name="twitter:description"]', 'content', m.description);
    if (m.path) {
      setMeta('link[rel="canonical"]', 'href', absoluteUrl(m.path));
      setMeta('meta[property="og:url"]', 'content', absoluteUrl(m.path));
    }
  }, [path]);
}
