// Preload hints for the prerendered pages: each page's own JS chunk (and its imports and CSS), found through Vite's
// build manifest, plus the self-hosted fonts. Without them the browser would discover the page chunk only after the
// app shell runs, and the fonts only once React has rendered text (a late font swap re-wraps headings: layout shift).

/**
 * Route id → source file of its page, read from the loaders in src/routePages.tsx (`id: () => import('./x')`).
 * Variant screens (`matchV1Landing`…) share src/variants/VariantScreen.tsx.
 */
export function routeSources(routePagesSource, routeIds) {
  const map = {};
  for (const [, id, rel] of routePagesSource.matchAll(/^\s*(\w+): \(\) => import\('\.\/([^']+)'\)/gm)) map[id] = `src/${rel}.tsx`;
  for (const id of routeIds) if (!map[id] && /^matchV\d/.test(id)) map[id] = 'src/variants/VariantScreen.tsx';
  return map;
}

/** JS chunks (the page's own and the shared ones it imports, minus the entry) and CSS files for a source file. */
export function chunkFiles(manifest, src) {
  const js = [];
  const css = [];
  const seen = new Set();
  // The entry is already loaded by the page's <script type="module">.
  const entryFiles = new Set(Object.values(manifest).filter((c) => c.isEntry).map((c) => c.file));
  const visit = (key) => {
    const chunk = manifest[key];
    if (!chunk || seen.has(key) || chunk.isEntry || entryFiles.has(chunk.file)) return;
    seen.add(key);
    js.push(chunk.file);
    css.push(...(chunk.css ?? []));
    for (const dep of chunk.imports ?? []) visit(dep);
  };
  visit(src);
  return { js, css: [...new Set(css)] };
}

/** <link> tags: font preloads, the page's stylesheets and module preloads. */
export function preloadTags({ js = [], css = [] }, fonts, base) {
  return [
    ...fonts.map((f) => `<link rel="preload" href="${base}${f}" as="font" type="font/woff2" crossorigin />`),
    ...css.map((f) => `<link rel="stylesheet" crossorigin href="${base}${f}" />`),
    ...js.map((f) => `<link rel="modulepreload" crossorigin href="${base}${f}" />`),
  ].join('\n    ');
}
