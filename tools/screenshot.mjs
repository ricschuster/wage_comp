/**
 * Captures the README screenshot from a built copy of the app.
 *
 * Invoked by tools/screenshot.sh, which builds and serves `dist` first.
 *
 * Note on serving: `vite preview` cannot be used here. It returns 404 for the
 * module script when the request carries CORS headers, which browsers send for
 * a `crossorigin` module, so the app never boots and the screenshot comes out
 * blank. A plain static server behaves like GitHub Pages does.
 */

import { chromium } from 'playwright-core';

const [url, out, executablePath] = process.argv.slice(2);

if (!url || !out || !executablePath) {
  console.error('usage: screenshot.mjs <url> <out.png> <chrome-path>');
  process.exit(2);
}

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const page = await browser.newPage({
  viewport: { width: 1280, height: 1180 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
});

const failures = [];
page.on('response', (res) => {
  if (res.status() >= 400) {
    failures.push(`${res.status()} ${res.url()}`);
  }
});
page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));

await page.goto(url, { waitUntil: 'networkidle' });

// Fail loudly rather than saving a blank image: a screenshot of a page that
// did not boot is worse than no screenshot.
await page.waitForSelector('.card .figure', { timeout: 20_000 });
await page.waitForTimeout(500);
await page.screenshot({ path: out });
await browser.close();

if (failures.length > 0) {
  console.error('page reported problems:');
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(`captured ${out}`);
