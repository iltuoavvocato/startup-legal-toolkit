import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function normalizeBase(raw: string | undefined): string {
  let base = (raw ?? '/').trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
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
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
