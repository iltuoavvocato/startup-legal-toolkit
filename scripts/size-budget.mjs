// Bundle size budget for `npm run check:dist`: what a first visit to a page downloads (its entry script, module
// preloads and stylesheets, gzip), against budgets set ~10–15% above the sizes measured when the budget was added
// (Milestone 16, numbers in docs/briefs/investor-matching.md). The pdf.js chunk must stay lazy: no prerendered page
// may preload it. Pure functions here; scripts/check-dist.mjs reads dist/ and gzips the files.

/** Route ids measured (the first-visit cost of the page) and the app shell (entry script and its CSS). */
export const BUDGETS = {
  // kB gzip (1 kB = 1000 bytes, as Vite reports). Measured in M16 → budget (~12% above); pages include the shell.
  shell: { js: 153, css: 22 }, // 136.3 / 19.3: React, router, i18n (both languages), layout
  match: { js: 204, css: 22 }, // 181.6 / 19.3: landing
  matchStartup: { js: 208, css: 22 }, // 185.7 / 19.3: startup flow
  matchAgentStartup: { js: 211, css: 22 }, // 188.2 / 19.3: agent (founder)
  matchDirectory: { js: 207, css: 22 }, // 184.3 / 19.3: directory
  pdf: { js: 121 }, // 107.4: the lazy pdf.js chunk itself, loaded only when a deck is read
};

/** The lazily loaded pdf.js wrapper chunk (the worker is a separate file loaded by URL). */
export const PDF_CHUNK = /(^|\/)pdf-[\w-]+\.js$/;

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? null;

/** Files a page loads up front: module scripts and modulepreloads (js), stylesheets (css); hrefs as written. */
export function initialAssets(html) {
  const js = new Set();
  const css = new Set();
  for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
    const src = attr(tag, 'src');
    if (src && attr(tag, 'type') === 'module') js.add(src);
  }
  for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
    const rel = attr(tag, 'rel');
    const href = attr(tag, 'href');
    if (!href) continue;
    if (rel === 'modulepreload') js.add(href);
    if (rel === 'stylesheet') css.add(href);
  }
  return { js: [...js], css: [...css] };
}

/** The entry script and the stylesheets of a page whose only preloads are the shell's own (index.html). */
export function shellAssets(html) {
  const { css } = initialAssets(html);
  const entry = [...html.matchAll(/<script\b[^>]*>/g)].map(([t]) => t).filter((t) => attr(t, 'type') === 'module');
  return { js: entry.map((t) => attr(t, 'src')).filter(Boolean), css };
}

/** One line per page that preloads or loads the pdf.js chunk up front. */
export function lazyPdfErrors(file, html) {
  return [...initialAssets(html).js, ...initialAssets(html).css]
    .filter((f) => PDF_CHUNK.test(f))
    .map((f) => `${file}: loads the pdf.js chunk up front (${f}); it must stay lazy`);
}

/** `sizes`: { [name]: { js?: bytes, css?: bytes } } (gzip). One line per budget exceeded or not measured. */
export function budgetErrors(sizes, budgets = BUDGETS) {
  const errors = [];
  for (const [name, budget] of Object.entries(budgets)) {
    for (const kind of /** @type {const} */ (['js', 'css'])) {
      if (budget[kind] === undefined) continue;
      const bytes = sizes[name]?.[kind];
      if (bytes === undefined) errors.push(`size budget: ${name} ${kind} not measured`);
      else if (bytes > budget[kind] * 1000)
        errors.push(`size budget: ${name} ${kind} is ${kb(bytes)} kB gzip, budget ${budget[kind]} kB`);
    }
  }
  return errors;
}

export const kb = (bytes) => (bytes / 1000).toFixed(1);
