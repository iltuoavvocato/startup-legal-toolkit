// Starts `vite preview` on a free port and resolves once it answers. Used by screenshots/OG scripts.
import { spawn } from 'node:child_process';

export async function startPreview(port = 4179) {
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'inherit'],
    env: process.env,
  });
  const base = (process.env.BASE_PATH ?? '/').replace(/^\/?/, '/').replace(/\/?$/, '/');
  const url = `http://127.0.0.1:${port}${base}`;
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return { url, stop: () => child.kill() };
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  child.kill();
  throw new Error(`vite preview did not start on ${url}`);
}
