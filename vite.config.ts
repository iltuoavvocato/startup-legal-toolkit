import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function normalizeBase(raw: string | undefined): string {
  let base = (raw ?? '/').trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

export default defineConfig({
  base: normalizeBase(process.env.BASE_PATH),
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
