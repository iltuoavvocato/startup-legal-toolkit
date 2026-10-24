// Lighthouse on the production build (`npm run build` first): home, matching landing, startup form, agent and
// directory, mobile and desktop presets, with the system Chrome. Reports (JSON + HTML) go to screenshots/lighthouse/
// (gitignored) with a summary table in summary.md. Usage: `npm run lighthouse [-- --lang=en] [-- --only=home]`.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startPreview } from './serve-dist.mjs';

const OUT = 'screenshots/lighthouse';
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const lang = arg('lang') ?? 'it';
const only = arg('only');

const PAGES = {
  it: [
    ['home', ''],
    ['match', 'match-investitori/'],
    ['startup-form', 'match-investitori/startup/'],
    ['agent', 'match-investitori/agente/startup/'],
    ['directory', 'match-investitori/investitori/'],
  ],
  en: [
    ['home', 'en/'],
    ['match', 'en/investor-match/'],
    ['startup-form', 'en/investor-match/startup/'],
    ['agent', 'en/investor-match/agent/startup/'],
    ['directory', 'en/investor-match/investors/'],
  ],
}[lang];

if (!existsSync('dist/index.html')) {
  console.error('dist/ not found: run `npm run build` first.');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const { url: base, stop } = await startPreview(4199);
const rows = [];
try {
  for (const [name, path] of PAGES.filter(([n]) => !only || n === only)) {
    for (const preset of ['mobile', 'desktop']) {
      const file = join(OUT, `${lang === 'it' ? '' : `${lang}-`}${name}-${preset}`);
      const args = [
        '--yes',
        'lighthouse@12',
        `${base}${path}`,
        `--chrome-path=${CHROME}`,
        '--chrome-flags=--headless=new --no-sandbox',
        `--only-categories=${CATEGORIES.join(',')}`,
        '--output=json',
        '--output=html',
        `--output-path=${file}`,
        '--quiet',
        ...(preset === 'desktop' ? ['--preset=desktop'] : []),
      ];
      const res = spawnSync('npx', args, { stdio: 'inherit' });
      if (res.status !== 0) throw new Error(`lighthouse failed on ${path} (${preset})`);
      const report = JSON.parse(readFileSync(`${file}.report.json`, 'utf8'));
      const score = (c) => Math.round((report.categories[c]?.score ?? 0) * 100);
      const audit = (id) => report.audits[id]?.displayValue ?? '';
      rows.push({
        page: `/${path}`,
        preset,
        ...Object.fromEntries(CATEGORIES.map((c) => [c, score(c)])),
        lcp: audit('largest-contentful-paint'),
        cls: audit('cumulative-layout-shift'),
        tbt: audit('total-blocking-time'),
      });
      console.log(rows.at(-1));
    }
  }
} finally {
  stop();
}

const table = [
  '| Page | Preset | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...rows.map((r) => `| \`${r.page}\` | ${r.preset} | ${r.performance} | ${r.accessibility} | ${r['best-practices']} | ${r.seo} | ${r.lcp} | ${r.cls} | ${r.tbt} |`),
].join('\n');
writeFileSync(join(OUT, `summary${lang === 'it' ? '' : `-${lang}`}.md`), `${table}\n`);
writeFileSync(join(OUT, `summary${lang === 'it' ? '' : `-${lang}`}.json`), JSON.stringify(rows, null, 2));
console.log(`\n${table}\n\nReports in ${OUT}/`);
