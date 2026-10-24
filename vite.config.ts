import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { GetModuleInfo } from 'rollup';

function normalizeBase(raw: string | undefined): string {
  let base = (raw ?? '/').trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

// Shared code for the lazily loaded pages, grouped into a few chunks instead of one tiny chunk per module.
// Everything the entry imports statically (React, router, i18n, layout) goes to `app`.
const CHUNK_GROUPS: [string, RegExp][] = [
  ['deck', /\/src\/(lib\/(deck|deckExtract|deckSignals|pdfText)\.ts|components\/match\/useDeckReader\.ts)$/],
  ['match', /\/src\/(components\/match\/[^/]+|data\/[^/]+|lib\/(match\w*|optin|inbox|agentInbox|intakeAgent|directory|exportDoc)\.ts)$/],
  ['ui', /\/src\/(components\/[^/]+\.tsx|hooks\/[^/]+|lib\/[^/]+\.ts)$/],
];

function inEntry(id: string, getModuleInfo: GetModuleInfo, seen = new Set<string>()): boolean {
  if (seen.has(id)) return false;
  seen.add(id);
  const info = getModuleInfo(id);
  if (!info) return false;
  if (info.isEntry) return true;
  return info.importers.some((importer) => inEntry(importer, getModuleInfo, seen));
}

function manualChunks(id: string, { getModuleInfo }: { getModuleInfo: GetModuleInfo }): string | undefined {
  if (getModuleInfo(id)?.isEntry) return undefined;
  // Named explicitly: otherwise Rollup moves unassigned dependencies (React, i18n) into the first group using them.
  if (inEntry(id, getModuleInfo)) return 'app';
  return CHUNK_GROUPS.find(([, re]) => re.test(id))?.[0];
}

const siteUrl = (process.env.SITE_URL ?? 'https://toolkit.iltuoavvocato.com').replace(/\/+$/, '');

export default defineConfig({
  base: normalizeBase(process.env.BASE_PATH),
  define: {
    __SITE_URL__: JSON.stringify(siteUrl),
  },
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
    // Read by scripts/prerender.mjs (per-page modulepreload hints), then deleted from dist/.
    manifest: true,
    rollupOptions: { output: { manualChunks } },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
