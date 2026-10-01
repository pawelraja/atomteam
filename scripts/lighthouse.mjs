// Lighthouse (mobile) on the built site. Fails below the quality bar:
// Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO ≥ 95.
//   node scripts/lighthouse.mjs [--dir dist] [--pages /,/media/,/en/]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const dir = resolve(arg('dir', 'dist'));
const pages = arg('pages', '/,/en/,/zespol/,/kalendarz/,/partnerzy/,/media/,/zespol/sofia-ungerova/').split(',');
const BAR = { performance: 90, accessibility: 100, 'best-practices': 95, seo: 95 };

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ics': 'text/calendar',
};
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const body = await readFile(join(dir, p));
    const cache = p.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache';
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream', 'cache-control': cache });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html' }).end('<!doctype html><title>404</title>');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = false;
for (const path of pages) {
  const { lhr } = await lighthouse(`${base}${path}`, { port: chrome.port, output: 'json', logLevel: 'error', formFactor: 'mobile', onlyCategories: Object.keys(BAR) });
  const scores = Object.fromEntries(Object.keys(BAR).map((k) => [k, Math.round(lhr.categories[k].score * 100)]));
  const low = Object.entries(scores).filter(([k, v]) => v < BAR[k]);
  if (low.length) failed = true;
  console.log(`${low.length ? '✗' : '✓'} ${path.padEnd(28)} ${Object.entries(scores).map(([k, v]) => `${k} ${v}`).join(' · ')}  LCP ${(lhr.audits['largest-contentful-paint'].numericValue / 1000).toFixed(2)}s`);
  for (const [k] of low) {
    const audits = lhr.categories[k].auditRefs
      .map((r) => lhr.audits[r.id])
      .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
      .slice(0, 6);
    for (const a of audits) console.log(`    - ${k}: ${a.id} (${a.title})`);
  }
}
await chrome.kill();
server.close();
process.exit(failed ? 1 : 0);
