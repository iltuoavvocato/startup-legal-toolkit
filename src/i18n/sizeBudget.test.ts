import { describe, expect, it } from 'vitest';
import { BUDGETS, budgetErrors, initialAssets, lazyPdfErrors, shellAssets } from '../../scripts/size-budget.mjs';

const page = (extra = '') =>
  `<html><head><script type="module" crossorigin src="/assets/app-A1.js"></script><link rel="stylesheet" crossorigin href="/assets/app-A1.css">` +
  `<link rel="preload" href="/assets/Inter-X.woff2" as="font" type="font/woff2" crossorigin />` +
  `<link rel="stylesheet" crossorigin href="/assets/app-A1.css" /><link rel="modulepreload" crossorigin href="/assets/Page-B2.js" />` +
  `<link rel="modulepreload" crossorigin href="/assets/app-A1.js" />${extra}<link rel="canonical" href="https://example.test/x/"></head></html>`;

describe('size budget', () => {
  it('lists what a page loads up front, once each, without fonts or canonical links', () => {
    expect(initialAssets(page())).toEqual({ js: ['/assets/app-A1.js', '/assets/Page-B2.js'], css: ['/assets/app-A1.css'] });
    expect(shellAssets(page())).toEqual({ js: ['/assets/app-A1.js'], css: ['/assets/app-A1.css'] });
  });

  it('fails a page that preloads the pdf.js chunk, not one that only mentions pdf in a name', () => {
    expect(lazyPdfErrors('dist/x.html', page('<link rel="modulepreload" href="/assets/MatchPdfPage-C3.js" />'))).toEqual([]);
    expect(lazyPdfErrors('dist/x.html', page())).toEqual([]);
    const bad = lazyPdfErrors('dist/x.html', page('<link rel="modulepreload" crossorigin href="/base/assets/pdf-BnPRJEQ6.js" />'));
    expect(bad).toHaveLength(1);
    expect(bad[0]).toMatch(/dist\/x\.html: loads the pdf\.js chunk up front/);
  });

  it('reports budgets exceeded or not measured, and passes sizes at the budget', () => {
    const budgets = { shell: { js: 100, css: 20 }, pdf: { js: 50 } };
    expect(budgetErrors({ shell: { js: 100_000, css: 20_000 }, pdf: { js: 50_000 } }, budgets)).toEqual([]);
    expect(budgetErrors({ shell: { js: 100_001, css: 1 }, pdf: { js: 1 } }, budgets)).toEqual([
      'size budget: shell js is 100.0 kB gzip, budget 100 kB',
    ]);
    expect(budgetErrors({ shell: { js: 1 } }, budgets)).toEqual(['size budget: shell css not measured', 'size budget: pdf js not measured']);
  });

  it('budgets the shell, the main match routes and the pdf.js chunk', () => {
    expect(Object.keys(BUDGETS)).toEqual(['shell', 'match', 'matchStartup', 'matchAgentStartup', 'matchDirectory', 'pdf']);
    for (const b of Object.values(BUDGETS)) expect(b.js).toBeGreaterThan(0);
  });
});
