// Tells Bing and other IndexNow engines (which also feed Copilot and ChatGPT search) about pages
// whose content changed, right after a production deploy. Runs from .github/workflows/indexnow.yml.
// It does nothing until the new site really serves the team's domain: it checks the live
// robots.txt and the key file first, so while www.atomteam.pl is still the old site, it skips.
//   node scripts/indexnow.mjs [--days 2] [--dry-run]
import { readdirSync, readFileSync } from 'node:fs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const days = Number(arg('days', 2));
const dryRun = process.argv.includes('--dry-run');
const site = JSON.parse(readFileSync('src/data/team.json', 'utf8')).website.replace(/\/$/, '');
const key = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!key) throw new Error('No IndexNow key file (public/<32 hex>.txt).');

const get = async (url) => {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
};

const robots = await get(`${site}/robots.txt`);
if (!robots || /^User-agent: \*\nDisallow: \/$/m.test(robots)) {
  console.log(`${site} is not serving the indexable new site yet; nothing to submit.`);
  process.exit(0);
}
if ((await get(`${site}/${key}.txt`))?.trim() !== key) {
  console.log(`${site}/${key}.txt is not live yet; nothing to submit.`);
  process.exit(0);
}

const sitemap = await get(`${site}/sitemap.xml`);
const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
const urls = [...(sitemap ?? '').matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].filter((m) => m[2] >= since).map((m) => m[1]);
if (!urls.length) {
  console.log(`No pages changed since ${since}.`);
  process.exit(0);
}
console.log(`${urls.length} page(s) changed since ${since}.`);
if (dryRun) {
  console.log(urls.join('\n'));
  process.exit(0);
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: urls.slice(0, 10000) }),
});
console.log(`IndexNow answered ${res.status}.`);
if (res.status >= 400 && res.status !== 429) process.exit(1);
