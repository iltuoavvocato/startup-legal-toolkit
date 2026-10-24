import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chunkFiles, preloadTags, routeSources } from '../scripts/preload.mjs';
import meta from './routes-meta.json';

const ids = meta.routes.map((r) => r.id);
// Paths are relative to the project root, where vitest runs.
const source = readFileSync('src/routePages.tsx', 'utf8');

describe('route chunks (src/routePages.tsx ↔ scripts/prerender.mjs)', () => {
  it('finds a page source file for every route, and the file exists', () => {
    const sources = routeSources(source, ids);
    for (const id of ids) {
      expect(sources[id], id).toBeTruthy();
      expect(existsSync(sources[id]!), sources[id]).toBe(true);
    }
    expect(sources.matchAgentInvestor).toBe('src/pages/MatchAgentPage.tsx');
    expect(sources.matchV4Investor).toBe('src/variants/VariantScreen.tsx');
  });

  it('collects the chunk, its shared imports and CSS, without the entry, once each', () => {
    const manifest = {
      'index.html': { file: 'assets/app-1.js', isEntry: true, imports: ['_ui.js'] },
      '_app.js': { file: 'assets/app-1.js' },
      '_ui.js': { file: 'assets/ui-1.js', css: ['assets/ui.css'] },
      '_match.js': { file: 'assets/match-1.js', imports: ['_ui.js', '_app.js'] },
      'src/pages/A.tsx': { file: 'assets/A-1.js', imports: ['index.html', '_match.js', '_ui.js'], css: ['assets/A.css'] },
    };
    expect(chunkFiles(manifest, 'src/pages/A.tsx')).toEqual({
      js: ['assets/A-1.js', 'assets/match-1.js', 'assets/ui-1.js'],
      css: ['assets/A.css', 'assets/ui.css'],
    });
    expect(chunkFiles(manifest, 'src/pages/Missing.tsx')).toEqual({ js: [], css: [] });
  });

  it('renders font preloads, stylesheets and module preloads under the base path', () => {
    const html = preloadTags({ js: ['assets/A.js'], css: ['assets/A.css'] }, ['assets/F.woff2'], '/toolkit/');
    expect(html).toContain('<link rel="preload" href="/toolkit/assets/F.woff2" as="font" type="font/woff2" crossorigin />');
    expect(html).toContain('<link rel="stylesheet" crossorigin href="/toolkit/assets/A.css" />');
    expect(html).toContain('<link rel="modulepreload" crossorigin href="/toolkit/assets/A.js" />');
  });
});
