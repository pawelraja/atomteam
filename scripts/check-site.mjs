// Post-build checks for the bilingual site (run after `astro build`):
//  - hreflang alternates are reciprocal and x-default points to PL
//  - every same-page anchor on each page exists
//  - /en/ never links to Polish pages (except the language switch) and vice versa
//  - language-switch links point at an anchor that exists on the other page
import { readFileSync } from 'node:fs';

const pages = {
  pl: { file: 'dist/index.html', url: 'https://www.atomteam.pl/' },
  en: { file: 'dist/en/index.html', url: 'https://www.atomteam.pl/en/' },
};
const html = Object.fromEntries(Object.entries(pages).map(([l, p]) => [l, readFileSync(p.file, 'utf8')]));
const ids = Object.fromEntries(Object.entries(html).map(([l, h]) => [l, new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
const problems = [];

for (const [lang, h] of Object.entries(html)) {
  const alt = Object.fromEntries([...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
  if (alt.pl !== pages.pl.url || alt.en !== pages.en.url) problems.push(`${lang}: hreflang pl/en wrong: ${JSON.stringify(alt)}`);
  if (alt['x-default'] !== pages.pl.url) problems.push(`${lang}: x-default should be ${pages.pl.url}`);
  if (!h.includes(`<html lang="${lang}"`)) problems.push(`${lang}: <html lang> is not "${lang}"`);

  for (const m of h.matchAll(/<a\b([^>]*)>/g)) {
    const attrs = m[1];
    const href = attrs.match(/href="([^"]*)"/)?.[1];
    if (!href) continue;
    const isSwitch = /hreflang="(pl|en)"/.test(attrs);
    if (href.startsWith('#')) {
      if (href.length > 1 && !ids[lang].has(href.slice(1))) problems.push(`${lang}: broken anchor ${href}`);
      continue;
    }
    if (isSwitch) {
      const target = attrs.match(/hreflang="(pl|en)"/)[1];
      const hash = href.split('#')[1];
      if (hash && !ids[target].has(hash)) problems.push(`${lang}: language link ${href} points to a missing anchor`);
      continue;
    }
    if (href.startsWith('/') && !href.startsWith('/_astro') && !/\.(ics|pdf|svg|png)$/.test(href)) {
      const isEn = href === '/en/' || href.startsWith('/en/');
      if (lang === 'en' && !isEn) problems.push(`en: link to a Polish page: ${href}`);
      if (lang === 'pl' && isEn) problems.push(`pl: link to an English page outside the switch: ${href}`);
    }
  }
}
if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('✓ hreflang reciprocal, anchors resolve, links stay in their language');
