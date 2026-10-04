// Page addresses per language. Polish lives at "/", English under "/en/"; every page has a
// counterpart, so the language switch always lands on the same page in the other language.
import type { Lang } from './text';

export const PAGES = ['home', 'team', 'calendar', 'partners', 'media', 'equipment', 'faq', 'developers', 'privacy'] as const;
export type PageKey = (typeof PAGES)[number];

export const ROUTES: Record<PageKey, Record<Lang, string>> = {
  home: { pl: '/', en: '/en/' },
  team: { pl: '/zespol/', en: '/en/team/' },
  calendar: { pl: '/kalendarz/', en: '/en/calendar/' },
  partners: { pl: '/partnerzy/', en: '/en/partners/' },
  media: { pl: '/media/', en: '/en/media/' },
  equipment: { pl: '/sprzet/', en: '/en/equipment/' },
  faq: { pl: '/pytania/', en: '/en/faq/' },
  developers: { pl: '/dane/', en: '/en/developers/' },
  privacy: { pl: '/polityka-prywatnosci/', en: '/en/privacy/' },
};

export function route(lang: Lang, page: PageKey): string {
  return ROUTES[page][lang];
}

/** A rider profile, e.g. /zespol/eliza-rabazynska/ and /en/team/eliza-rabazynska/. */
export function riderPath(lang: Lang, slug: string): string {
  return `${ROUTES.team[lang]}${slug}/`;
}

export function riderPaths(slug: string): Record<Lang, string> {
  return { pl: riderPath('pl', slug), en: riderPath('en', slug) };
}

/** Race pages live under these folders: /wyscigi/2026/nxt-classic/ and /en/races/2026/nxt-classic/. */
export const RACES_BASE: Record<Lang, string> = { pl: '/wyscigi/', en: '/en/races/' };

export function racePath(lang: Lang, season: number, slug: string): string {
  return `${RACES_BASE[lang]}${season}/${slug}/`;
}

export function racePaths(season: number, slug: string): Record<Lang, string> {
  return { pl: racePath('pl', season, slug), en: racePath('en', season, slug) };
}

/** "partners" → the partners page in this language; anything else (a URL or path) is used as-is. */
export function resolveHref(lang: Lang, href: string): string {
  return (PAGES as readonly string[]).includes(href) ? ROUTES[href as PageKey][lang] : href;
}

/** Stable, language-neutral download addresses for photos served from src/assets. */
export const DOWNLOADS = {
  photo: (file: string) => `/media/foto/${file}`,
  portrait: (file: string) => `/media/portrety/${file}`,
};
