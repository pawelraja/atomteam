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

// --- Home, Polish, desktop ---
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });

  const skipBox = await page.locator('.skip-link').boundingBox();
  check(!skipBox || skipBox.y + skipBox.height <= 0, 'Skip link is off-screen until focused');
  await page.keyboard.press('Tab');
  check((await page.evaluate(() => document.activeElement?.className)).includes('skip-link'), 'First Tab focuses the skip link');
  check(await page.locator('.skip-link').isVisible(), 'Skip link is visible when focused');

  check((await page.locator('.site-header .wordmark').getAttribute('aria-current')) === 'page', 'Header marks the home page as current');

  // Team tabs: arrow keys move selection, panels follow; the junior intro shows only on that tab.
  await page.locator('#tab-continental').focus();
  await page.keyboard.press('ArrowRight');
  check((await page.locator('.team [role="tab"][aria-selected="true"]').getAttribute('id')) === 'tab-junior', 'Team tabs: ArrowRight selects Juniors');
  check(await page.locator('#panel-junior .team__junior').isVisible(), 'Team tabs: the junior intro line is shown');
  await page.keyboard.press('End');
  check((await page.evaluate(() => document.activeElement?.id)) === 'tab-staff', 'Team tabs: End moves focus to Staff');
  check(!(await page.locator('#panel-continental').isVisible()), 'Team tabs: other panels are hidden');

  // Results: headline figures and 8 featured rows with row headers.
  check((await page.locator('.honours dd').allTextContents()).join(',') === '30,58', 'Results: 30 titles and 58 medals');
  check((await page.locator('.results-table tbody tr').count()) === 8, 'Results: 8 featured rows');
  check((await page.locator('.results-table th[scope="col"]').count()) === 3, 'Results: column headers use <th scope="col">');

  // Gallery lightbox: opens as a modal, arrow keys move, Esc closes and returns focus.
  const opener = page.locator('[data-open]').first();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  check(await page.locator('dialog.lightbox[open]').isVisible(), 'Gallery: the lightbox opens as a modal dialog');
  check((await page.evaluate(() => document.activeElement?.closest('dialog')?.className ?? '')).includes('lightbox'), 'Gallery: focus moves into the lightbox');
  await page.keyboard.press('ArrowRight');
  check(((await page.locator('#lightbox-caption').textContent()) ?? '').includes('2 z'), 'Gallery: ArrowRight shows the next photo');
  await page.keyboard.press('Escape');
  check(!(await page.locator('dialog.lightbox[open]').count()), 'Gallery: Esc closes the lightbox');
  check(await page.evaluate(() => document.activeElement?.hasAttribute('data-open')), 'Gallery: focus returns to the photo that opened it');
  check(!(await page.content()).includes('Zostań partnerem'), 'Home: no "Zostań partnerem" call to action');
  check((await page.locator('#twoja-marka').count()) === 0, 'Home: no jersey placement section (it lives on /partnerzy only)');
  check((await page.locator('.site-header .cta').getAttribute('href')) === '#newsletter', 'Header: "Subskrybuj" goes to the newsletter form');

  // Language switch follows the section in view.
  await page.evaluate(() => document.getElementById('kalendarz').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(600);
  const href = await page.locator('.lang-switch [data-lang-link="en"]').getAttribute('href');
  check(href === '/en/#calendar', `Language switch points to the same section in English (${href})`);

  // Newsletter: validation and "not live" state without an endpoint.
  await page.locator('[data-newsletter] button[type="submit"]').click();
  check(await page.locator('#nl-email-error').isVisible(), 'Newsletter: invalid email shows an error');
  check((await page.locator('#nl-email').getAttribute('aria-invalid')) === 'true', 'Newsletter: email marked aria-invalid');
  await page.locator('#nl-email').fill('fan@example.com');
  await page.locator('#nl-consent').check();
  await page.locator('[data-newsletter] button[type="submit"]').click();
  check((await page.locator('[data-newsletter]').getAttribute('data-state')) === 'error', 'Newsletter: without NEWSLETTER_ENDPOINT, shows the friendly error state');
  check((await page.locator('[data-newsletter] input[name="lang"]').inputValue()) === 'pl', 'Newsletter: sends the page language');
  await page.close();
}

// --- Calendar page ---
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}/kalendarz/`, { waitUntil: 'networkidle' });
  check((await page.locator('.site-header .nav a[aria-current="page"]').textContent())?.trim() === 'Kalendarz', 'Calendar page is marked current in the nav');
  await page.goto(`${base}/partnerzy/`, { waitUntil: 'networkidle' });
  check((await page.locator('#twoja-marka').count()) === 1, 'Partners page: shows "Twoja marka w peletonie"');
  await page.goto(`${base}/kalendarz/`, { waitUntil: 'networkidle' });
  await page.locator('#kalendarz-2026-tab').click();
  check(await page.locator('#kalendarz-2026').isVisible(), 'Season switch shows the 2026 archive');
  const archive = page.locator('#kalendarz-2026');
  await archive.locator('[data-filter="TRACK"]').click();
  check((await archive.locator('[data-filter="TRACK"]').getAttribute('aria-pressed')) === 'true', 'Filter chip reports aria-pressed');
  const shownCats = await archive.locator('[data-row]:not([hidden])').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.cat))]);
  check(shownCats.length === 1 && shownCats[0] === 'TRACK', `Track filter shows only track rows (${shownCats.join(',')})`);
  await page.locator('#kalendarz-2027-tab').click();
  const current = page.locator('#kalendarz-2027');
  await current.locator('[data-past-toggle]').click();
  check((await current.locator('[data-past-toggle]').getAttribute('aria-pressed')) === 'true', 'Show-past toggle reports aria-pressed');
  await page.close();
}

// --- Media centre ---
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  await page.goto(`${base}/media/`, { waitUntil: 'networkidle' });
  check(await page.locator('#boiler-pl').isVisible(), 'Boilerplate: Polish text shown first');
  check(!(await page.locator('#boiler-en').isVisible()), 'Boilerplate: English text hidden until chosen');
  await page.locator('#boiler-tab-en').click();
  check(await page.locator('#boiler-en').isVisible() && !(await page.locator('#boiler-pl').isVisible()), 'Boilerplate: EN tab switches the text');
  await page.locator('#boiler-en [data-copy]').click();
  await page.waitForTimeout(200);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(clip.startsWith('Mat Atom Deweloper Wrocław is'), 'Boilerplate: "Copy text" puts the text on the clipboard');
  check(((await page.locator('#boiler-en [data-copy-status]').textContent()) ?? '').length > 0, 'Boilerplate: confirmation is announced (aria-live)');

  const soon = page.locator('.file__soon');
  check((await soon.count()) > 0 && (await page.locator('.file a[href=""]').count()) === 0, 'Downloads: "soon" items are not links');
  await page.locator('[data-photo-filter="track"]').click();
  const visibleCats = await page.locator('[data-photo-library] li[data-cat]:not([hidden])').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.cat))]);
  check(visibleCats.join() === 'track', `Photo filter shows only track photos (${visibleCats.join()})`);
  check((await page.locator('[data-photo-filter="track"]').getAttribute('aria-pressed')) === 'true', 'Photo filter reports aria-pressed');
  check((await page.locator('table.roster tbody tr').count()) === 20, 'Roster table lists the 20-rider roster');
  await ctx.close();
}

// --- Mobile menu and language link ---
{
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await page.goto(`${base}/en/team/`, { waitUntil: 'networkidle' });
  await page.locator('[data-menu-open]').click();
  check(await page.locator('#mobile-menu[open]').isVisible(), 'Mobile: hamburger opens the full-screen menu');
  check((await page.locator('[data-menu-open]').getAttribute('aria-expanded')) === 'true', 'Mobile: hamburger reports aria-expanded');
  await page.keyboard.press('Escape');
  check(!(await page.locator('#mobile-menu[open]').count()), 'Mobile: Esc closes the menu');
  const box = await page.locator('.lang-single').boundingBox();
  check(box && box.width >= 44 && box.height >= 44, `Mobile: language link is a 44px touch target (${box?.width}×${box?.height})`);
  check((await page.locator('.lang-single').getAttribute('href'))?.startsWith('/zespol/'), 'Mobile: language link goes to the Polish team page');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(overflow <= 0, 'Mobile: no horizontal scroll on the team page');
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
