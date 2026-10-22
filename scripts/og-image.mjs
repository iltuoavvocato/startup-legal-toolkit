// Dev-time helper: renders scripts/og-template.html to public/og-image.png (1200×630). The PNG is committed.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from './browser.mjs';

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(process.cwd(), 'scripts/og-template.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('public/og-image.png written');
