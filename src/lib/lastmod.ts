// "Last modified" dates for the sitemap and feeds: the date of the last commit that changed the
// data a page is built from (real content dates, not the build time). Falls back to
// site.json → factsAsOf when git history isn't available.
import { execFileSync } from 'node:child_process';
import { getData } from './data';

const cache = new Map<string, string | null>();

function gitDate(paths: string[]): string | null {
  const key = paths.join('|');
  if (!cache.has(key)) {
    let date: string | null = null;
    try {
      const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...paths], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      date = out ? out.slice(0, 10) : null;
    } catch {
      date = null;
    }
    cache.set(key, date);
  }
  return cache.get(key)!;
}

/** Data and copy each kind of page is generated from. */
export const SOURCES = {
  home: ['src/data', 'src/content'],
  team: ['src/data/riders.json', 'src/data/staff.json', 'src/data/team.json', 'src/content'],
  rider: ['src/data/riders.json', 'src/data/results', 'src/content'],
  calendar: ['src/data/calendar', 'src/data/site.json', 'src/content'],
  race: ['src/data/calendar', 'src/data/results', 'src/content'],
  partners: ['src/data/partners.json', 'src/content'],
  media: ['src/data/media.json', 'src/data/riders.json', 'src/data/team.json', 'src/content'],
  equipment: ['src/data/equipment.json', 'src/data/partners.json', 'src/content'],
  faq: ['src/data', 'src/content'],
} as const;

export type SourceKey = keyof typeof SOURCES;

/** YYYY-MM-DD of the last content change for a kind of page. */
export function lastmod(kind: SourceKey): string {
  return gitDate([...SOURCES[kind]]) ?? getData().site.factsAsOf;
}
