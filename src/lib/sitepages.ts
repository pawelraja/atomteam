// Every indexable page, in both languages, with its kind (for lastmod). The sitemap, llms.txt
// and the link checks all read this list, so a new page type only needs adding here.
import { lastmod, type SourceKey } from './lastmod';
import { racePaths, riderPaths, ROUTES, type PageKey } from './routes';
import type { Lang } from './text';
import { profileRiders, racePages } from './view';

export interface SitePage {
  paths: Record<Lang, string>;
  kind: SourceKey;
  lastmod: string;
}

const STATIC: { key: PageKey; kind: SourceKey }[] = [
  { key: 'home', kind: 'home' },
  { key: 'team', kind: 'team' },
  { key: 'calendar', kind: 'calendar' },
  { key: 'equipment', kind: 'equipment' },
  { key: 'faq', kind: 'faq' },
  { key: 'partners', kind: 'partners' },
  { key: 'media', kind: 'media' },
];

export function sitePages(): SitePage[] {
  return [
    ...STATIC.map(({ key, kind }) => ({ paths: ROUTES[key], kind, lastmod: lastmod(kind) })),
    ...profileRiders().map(({ slug }) => ({ paths: riderPaths(slug), kind: 'rider' as const, lastmod: lastmod('rider') })),
    ...racePages().map((p) => ({ paths: racePaths(p.season, p.slug), kind: 'race' as const, lastmod: lastmod('race') })),
  ];
}
