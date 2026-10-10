// Takes Playwright screenshots of a built site.
//   node scripts/screenshots.mjs [--dir dist] [--out screenshots/default] [--widths 360,768,1280,1600]
//                                [--path /en/] [--selector "#calendar"] [--full] [--name prefix] [--actions "sel|sel"]
// Serves the folder on a local port, visits "/", and saves one PNG per width.
// Also fails if any width scrolls horizontally.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]]);
    return acc;
  }, []),
);
const dir = resolve(args.dir ?? 'dist');
const out = resolve(args.out ?? 'screenshots/default');
const widths = String(args.widths ?? '360,768,1280,1600').split(',').map(Number);
const selector = typeof args.selector === 'string' ? args.selector : null;
const name = typeof args.name === 'string' ? args.name : 'page';
const path = typeof args.path === 'string' ? args.path : '/';

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.ics': 'text/calendar', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const body = await readFile(join(dir, p));
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
let failed = false;
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: width < 700 ? 780 : 900 }, deviceScaleFactor: 1 });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (args.actions) {
    for (const step of String(args.actions).split('|')) await page.click(step);
    await page.waitForTimeout(200);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) {
    failed = true;
    const culprits = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
        .slice(0, 8)
        .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`),
    );
    console.error(`  ✗ ${width}px scrolls horizontally by ${overflow}px: ${culprits.join(', ')}`);
  }
  const file = join(out, `${name}-${width}.png`);
  if (selector) {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await el.screenshot({ path: file, animations: 'disabled' });
  } else {
    if (args.full) {
      // Lazy images only load near the viewport: scroll the whole page once, then wait for them.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 60));
        }
        // Images in hidden panels never load, so only wait for visible ones, and never for long.
        const pending = [...document.images].filter((img) => !img.complete && img.getClientRects().length);
        const loaded = Promise.all(pending.map((img) => new Promise((r) => img.addEventListener('load', r) || img.addEventListener('error', r))));
        await Promise.race([loaded, new Promise((r) => setTimeout(r, 5000))]);
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: file, fullPage: Boolean(args.full), animations: 'disabled' });
  }
  console.log(`  ✓ ${file}`);
  await page.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
