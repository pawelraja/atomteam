// Post-build checks for the bilingual, multi-page site (run after `astro build`):
//  - every page has <html lang>, a canonical URL and reciprocal hreflang pairs (x-default → PL)
//  - every internal link resolves to a built page, and its #anchor exists on that page
//  - English pages never link to Polish pages (and vice versa), except the language links
//  - language links land on the counterpart page
//  - every file link (/media/…, .ics, .pdf, .zip …) exists in the build
//  - indexable pages have unique titles and meta descriptions
//  - sitemap.xml lists exactly the indexable pages; robots.txt names the crawlers and the sitemap
//  - every link in llms.txt / llms-full.txt and every Markdown / RSS alternate resolves
//  - indexable pages have exactly one <h1> and a canonical pointing to themselves
//  - redirect pages (src/data/redirects.json) point to pages that exist
//  - staging builds (temporary address) say noindex everywhere and disallow crawling
//   node scripts/check-site.mjs [--dir dist]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dirArg = process.argv.indexOf('--dir');
const dir = dirArg > -1 ? process.argv[dirArg + 1] : 'dist';
const SITE = JSON.parse(readFileSync('src/data/team.json', 'utf8')).website;

/** All built HTML pages, keyed by URL path ("/", "/en/team/", …). */
const pages = new Map();
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f === 'index.html') {
      const url = '/' + relative(dir, d).split(sep).filter(Boolean).join('/') + (relative(dir, d) ? '/' : '');
      pages.set(url, readFileSync(p, 'utf8'));
    }
  }
})(dir);

const ids = new Map([...pages].map(([url, h]) => [url, new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
const isEn = (url) => url === '/en/' || url.startsWith('/en/');
const problems = [];
const add = (url, msg) => problems.push(`${url}: ${msg}`);

// Redirect pages for old addresses: check the target, then leave them out of the page checks.
const redirects = [];
for (const [url, h] of pages) {
  const to = h.match(/<meta http-equiv="refresh" content="0;url=([^"]+)"/)?.[1];
  if (!to) continue;
  redirects.push(url);
  pages.delete(url);
  if (!pages.has(to.split('#')[0]) && !existsSync(join(dir, to))) problems.push(`${url}: redirects to ${to}, which was not built`);
}
const staging = [...pages.values()].some((h) => h.includes('data-site-staging'));


for (const [url, h] of pages) {
  const lang = isEn(url) ? 'en' : 'pl';
  if (!h.includes(`<html lang="${lang}"`)) add(url, `<html lang> is not "${lang}"`);

  // hreflang: both languages + x-default, and the counterpart points back.
  const alt = Object.fromEntries([...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
  if (!alt.pl || !alt.en || !alt['x-default']) add(url, `missing hreflang alternates: ${JSON.stringify(alt)}`);
  else {
    if (alt[lang] !== SITE + url) add(url, `hreflang ${lang} should be ${SITE + url}, is ${alt[lang]}`);
    if (alt['x-default'] !== alt.pl) add(url, 'x-default should point to the Polish page');
    const other = lang === 'pl' ? 'en' : 'pl';
    const counterpart = alt[other].replace(SITE, '');
    const back = pages.get(counterpart);
    if (!back) add(url, `hreflang ${other} points to a page that was not built: ${counterpart}`);
    else if (!back.includes(`hreflang="${lang}" href="${SITE + url}"`)) add(url, `hreflang pair with ${counterpart} is not reciprocal`);
  }

  for (const m of h.matchAll(/<a\b([^>]*)>/g)) {
    const attrs = m[1];
    const href = attrs.match(/\shref="([^"]*)"/)?.[1];
    if (!href || /^(https?:|mailto:|tel:)/.test(href)) continue;
    const [path, hash] = href.split('#');
    const target = path === '' ? url : path;
    const switchTo = attrs.match(/\shreflang="(pl|en)"/)?.[1];

    if (/\.[a-z0-9]+$/i.test(target)) {
      if (!existsSync(join(dir, decodeURIComponent(target)))) add(url, `file link does not resolve: ${href}`);
      continue;
    }
    if (!pages.has(target)) {
      add(url, `link to a page that was not built: ${href}`);
      continue;
    }
    if (hash && !ids.get(target).has(hash)) add(url, `broken anchor ${href}`);
    if (switchTo) {
      if ((switchTo === 'en') !== isEn(target)) add(url, `language link hreflang="${switchTo}" points to ${href}`);
      continue;
    }
    if (target !== url && isEn(target) !== isEn(url)) add(url, `links to the other language outside the switch: ${href}`);
  }
}

/* ---------- titles, descriptions, crawler files ---------- */

const resolves = (href) => {
  const path = href.replace(SITE, '').split('#')[0] || '/';
  return pages.has(path) || existsSync(join(dir, decodeURIComponent(path)));
};
// Page-level noindex (privacy); a staging build's site-wide noindex doesn't count here.
const indexable = [...pages].filter(([, h]) => !/<meta name="robots" content="noindex"/.test(h));
if (staging) for (const [url, h] of pages) if (!/name="robots" content="noindex/.test(h)) add(url, 'staging build without noindex');
const longTitles = [];
// Per language: a PL page and its EN counterpart may share a proper name.
const seen = { pl: { title: new Map(), description: new Map() }, en: { title: new Map(), description: new Map() } };
for (const [url, h] of indexable) {
  const title = h.match(/<title>([^<]*)<\/title>/)?.[1];
  const description = h.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!title) add(url, 'no <title>');
  else if (title.replace(/&#39;|&amp;|&quot;/g, 'x').length > 65) longTitles.push(url);
  const h1 = (h.match(/<h1\b/g) ?? []).length;
  if (h1 !== 1) add(url, `${h1} <h1> elements (expected 1)`);
  const canonical = h.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== SITE + url) add(url, `canonical is ${canonical}, expected ${SITE + url}`);
  if (!description) add(url, 'no meta description');
  else if (description.length < 50 || description.length > 320) add(url, `meta description is ${description.length} characters (50–320)`);
  for (const [key, value] of [['title', title], ['description', description]]) {
    if (!value) continue;
    const bucket = seen[isEn(url) ? 'en' : 'pl'][key];
    if (bucket.has(value)) add(url, `same ${key} as ${bucket.get(value)}: "${value}"`);
    else bucket.set(value, url);
  }
  for (const m of h.matchAll(/<link rel="alternate" type="(?:text\/markdown|application\/rss\+xml)"[^>]*href="([^"]+)"/g)) {
    if (!resolves(m[1])) add(url, `alternate ${m[1]} does not exist`);
  }
}

const read = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : null);
const sitemap = read('sitemap.xml');
if (!sitemap) add('/sitemap.xml', 'missing');
else {
  const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '')));
  for (const [url] of indexable) if (!locs.has(url)) add('/sitemap.xml', `missing ${url}`);
  for (const loc of locs) if (!pages.has(loc)) add('/sitemap.xml', `lists ${loc}, which was not built`);
  for (const m of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) if (!/^\d{4}-\d{2}-\d{2}$/.test(m[1])) add('/sitemap.xml', `bad lastmod ${m[1]}`);
}
const robots = read('robots.txt');
if (!robots) add('/robots.txt', 'missing');
else if (staging) {
  if (!/^User-agent: \*\nDisallow: \/$/m.test(robots)) add('/robots.txt', 'staging build must disallow all crawling');
} else {
  for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended']) {
    if (!new RegExp(`^User-agent: ${bot}$`, 'm').test(robots)) add('/robots.txt', `no group for ${bot}`);
  }
  if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) add('/robots.txt', 'no Sitemap line');
}
for (const f of ['llms.txt', 'llms-full.txt']) {
  const txt = read(f);
  if (!txt) {
    add(`/${f}`, 'missing');
    continue;
  }
  for (const m of txt.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) if (m[1].startsWith(SITE) && !resolves(m[1])) add(`/${f}`, `link does not resolve: ${m[1]}`);
  if (/\[VERIFY/i.test(txt)) add(`/${f}`, 'contains an unconfirmed [VERIFY] value');
}

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'));
  console.error(`\n${problems.length} problem(s) in ${pages.size} pages.`);
  process.exit(1);
}
if (longTitles.length) console.log(`  note: ${longTitles.length} title(s) longer than 65 characters (long race names), e.g. ${longTitles[0]}`);
if (staging) console.log('  note: staging build: every page is noindex and robots.txt disallows crawling.');
console.log(`✓ ${pages.size} pages${redirects.length ? ` (+${redirects.length} redirects)` : ''}${staging ? ' [staging]' : ''}: hreflang reciprocal, links and anchors resolve, links stay in their language, files exist; unique titles and descriptions; sitemap, robots.txt and llms.txt complete`);
