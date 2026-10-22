import { chromium } from 'playwright-core';

/** Uses the system Google Chrome; set CHROME_PATH to point to another Chromium binary. */
export function launchBrowser() {
  return process.env.CHROME_PATH
    ? chromium.launch({ executablePath: process.env.CHROME_PATH })
    : chromium.launch({ channel: 'chrome' });
}
