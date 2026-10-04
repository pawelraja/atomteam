// RSS feeds of race results (/rss.xml in Polish, /en/rss.xml in English): one item per race with
// the team's results, newest first. Stands in for a news feed until the site has news.
import { getData } from './data';
import { copy, fill, homePath, type Lang } from './i18n';
import { lastmod } from './lastmod';
import { raceSummary } from './pageld';
import { racePath } from './routes';
import { raceName } from './season';
import { TEAM } from './team';
import { racePages } from './view';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, ' ');
const rfc822 = (iso: string) => new Date(iso + 'T18:00:00Z').toUTCString();

export const FEEDS: Record<Lang, string> = { pl: '/rss.xml', en: '/en/rss.xml' };

export function rssFeed(lang: Lang): string {
  const t = copy(lang);
  const tm = t.markdown;
  const { today } = getData();
  const abs = (p: string) => new URL(p, TEAM.website).href;
  const items = racePages()
    .filter((p) => p.rows.some((r) => r.position !== null) && p.event.end! <= today)
    .sort((a, b) => b.event.end!.localeCompare(a.event.end!))
    .map((p) => {
      const url = abs(racePath(lang, p.season, p.slug));
      return [
        '    <item>',
        `      <title>${esc(fill(tm.feedItem, { race: raceName(p.event, lang), season: p.season }))}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${rfc822(p.event.end!)}</pubDate>`,
        `      <description>${esc(raceSummary(p, lang, today))}</description>`,
        '    </item>',
      ].join('\n');
    });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${esc(fill(tm.feedTitle, {}))}</title>`,
    `    <link>${abs(homePath(lang))}</link>`,
    `    <description>${esc(fill(tm.feedDescription, {}))}</description>`,
    `    <language>${t.meta.locale.toLowerCase()}</language>`,
    `    <lastBuildDate>${rfc822(lastmod('race'))}</lastBuildDate>`,
    `    <atom:link href="${abs(FEEDS[lang])}" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
