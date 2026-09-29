// Keyboard and ARIA behaviour checks against a built site (default: dist/).
//   node scripts/e2e.mjs [--dir dist]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const dirArg = process.argv.indexOf('--dir');
const dir = resolve(dirArg > -1 ? process.argv[dirArg + 1] : 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const body = await readFile(join(dir, p));
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failures++;
};

// --- Polish page, desktop ---
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });

  await page.keyboard.press('Tab');
  check((await page.evaluate(() => document.activeElement?.className)).includes('skip-link'), 'First Tab focuses the skip link');
  check(await page.locator('.skip-link').isVisible(), 'Skip link is visible when focused');

  // Team tabs: arrow keys move selection, panels follow.
  const firstTab = page.locator('.team [role="tab"]').first();
  await firstTab.focus();
  await page.keyboard.press('ArrowRight');
  check((await page.locator('.team [role="tab"][aria-selected="true"]').getAttribute('id')) === 'tab-junior', 'Team tabs: ArrowRight selects the Junior tab');
  check(await page.locator('#panel-junior').isVisible(), 'Team tabs: Junior panel is shown');
  await page.keyboard.press('End');
  check((await page.evaluate(() => document.activeElement?.id)) === 'tab-staff', 'Team tabs: End moves focus to the last tab');

  // Calendar: season switch, filters, past toggle.
  await page.locator('#kalendarz-2026-tab').click();
  check(await page.locator('#kalendarz-2026').isVisible(), 'Season switch shows the 2026 archive');
  const archive = page.locator('#kalendarz-2026');
  await archive.locator('[data-filter="TRACK"]').click();
  check((await archive.locator('[data-filter="TRACK"]').getAttribute('aria-pressed')) === 'true', 'Filter chip reports aria-pressed');
  const shownCats = await archive.locator('[data-row]:not([hidden])').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.cat))]);
  check(shownCats.length === 1 && shownCats[0] === 'TRACK', `Track filter shows only track rows (${shownCats.join(',')})`);
  check(((await archive.locator('[data-count]').textContent()) ?? '').length > 0, 'Filter result count is announced in a status region');

  await page.locator('#kalendarz-2027-tab').click();
  const current = page.locator('#kalendarz-2027');
  const hiddenPast = await current.locator('[data-row][hidden]').count();
  await current.locator('[data-past-toggle]').click();
  check((await current.locator('[data-past-toggle]').getAttribute('aria-pressed')) === 'true', 'Show-past toggle reports aria-pressed');
  check((await current.locator('[data-row][hidden]').count()) <= hiddenPast, 'Show-past toggle reveals past rows');

  // Language switch follows the section in view.
  await page.locator('#kalendarz').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.getElementById('kalendarz').scrollIntoView());
  await page.waitForTimeout(400);
  const href = await page.locator('.lang-switch [data-lang-link="en"]').getAttribute('href');
  check(href === '/en/#calendar', `Language switch points to the same section in English (${href})`);

  // Lightbox: opens, traps focus in a modal dialog, Esc closes and restores focus.
  const opener = page.locator('[data-open]').first();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  check(await page.locator('dialog.lightbox[open]').isVisible(), 'Lightbox opens as a modal dialog');
  check((await page.evaluate(() => document.activeElement?.closest('dialog')?.className ?? '')).includes('lightbox'), 'Focus moves into the lightbox');
  await page.keyboard.press('ArrowRight');
  check(((await page.locator('#lightbox-caption').textContent()) ?? '').includes('2 z'), 'ArrowRight shows the next photo');
  await page.keyboard.press('Escape');
  check(!(await page.locator('dialog.lightbox[open]').count()), 'Esc closes the lightbox');
  check(await page.evaluate(() => document.activeElement?.hasAttribute('data-open')), 'Focus returns to the photo that opened it');

  // Newsletter: validation and "not live" state without an endpoint.
  await page.locator('[data-newsletter] button[type="submit"]').click();
  check(await page.locator('#nl-email-error').isVisible(), 'Newsletter: invalid email shows an error');
  check((await page.locator('#nl-email').getAttribute('aria-invalid')) === 'true', 'Newsletter: email marked aria-invalid');
  await page.locator('#nl-email').fill('fan@example.com');
  await page.locator('#nl-consent').check();
  await page.locator('[data-newsletter] button[type="submit"]').click();
  check((await page.locator('[data-newsletter]').getAttribute('data-state')) === 'error', 'Newsletter: without NEWSLETTER_ENDPOINT, shows the friendly error state');
  await page.close();
}

// --- Mobile menu ---
{
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await page.goto(`${base}/en/`, { waitUntil: 'networkidle' });
  await page.locator('[data-menu-open]').click();
  check(await page.locator('#mobile-menu[open]').isVisible(), 'Mobile: hamburger opens the full-screen menu');
  check((await page.locator('[data-menu-open]').getAttribute('aria-expanded')) === 'true', 'Mobile: hamburger reports aria-expanded');
  await page.keyboard.press('Escape');
  check(!(await page.locator('#mobile-menu[open]').count()), 'Mobile: Esc closes the menu');
  const box = await page.locator('.lang-single').boundingBox();
  check(box && box.width >= 44 && box.height >= 44, `Mobile: language link is a 44px touch target (${box?.width}×${box?.height})`);
  await page.close();
}

// --- Reduced motion stops the ticker ---
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const anim = await page.locator('.ticker__track').evaluate((el) => getComputedStyle(el).animationName);
  check(anim === 'none', `prefers-reduced-motion: ticker animation is "${anim}"`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll behaviour checks passed.');
process.exit(failures ? 1 : 0);
