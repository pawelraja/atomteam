// Post-build checks for the bilingual, multi-page site (run after `astro build`):
//  - every page has <html lang>, a canonical URL and reciprocal hreflang pairs (x-default → PL)
//  - every internal link resolves to a built page, and its #anchor exists on that page
//  - English pages never link to Polish pages (and vice versa), except the language links
//  - language links land on the counterpart page
//  - every file link (/media/…, .ics, .pdf, .zip …) exists in the build
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

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'));
  console.error(`\n${problems.length} problem(s) in ${pages.size} pages.`);
  process.exit(1);
}
console.log(`✓ ${pages.size} pages: hreflang reciprocal, links and anchors resolve, links stay in their language, files exist`);
