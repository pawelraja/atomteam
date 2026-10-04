// Build-time view models shared by several pages, so the home page, the team page and the
// media page always agree (e.g. which roster is "official", which season the results cover).
import { getData } from './data';
import { findImage } from './images';
import { countHonours, sortFeatured, sortResults, type EventIndex } from './results';
import type { Result, Rider } from './schemas';
import { hasRacePage, raceSlugs } from './races';
import { racePath } from './routes';
import { pickRoster, recapSeason, type RaceEvent } from './season';
import type { Lang } from './text';
import { officialRoster, riderSlug, seasonNumbers } from './showcase';

/**
 * Results chapter: the reviewed season (the previous one while the new season is prepared or
 * raced), or the latest season before it that has results. Null hides the chapter.
 */
export function resultsView() {
  const { site, results, events } = getData();
  const preferred = recapSeason(site);
  const season = [...results.keys()].filter((s) => s <= preferred && (results.get(s) ?? []).length).sort((a, b) => b - a)[0];
  if (season === undefined) return null;
  const rows = results.get(season)!;
  const index = events.get(season) ?? new Map();
  return {
    season,
    rows,
    events: index,
    honours: countHonours(rows, index),
    featured: sortFeatured(rows.filter((r) => r.featured), index),
  };
}

export function numbersView() {
  const { site, calendars, events, results, riders } = getData();
  return seasonNumbers(calendars, events, results, riders, recapSeason(site));
}

/** The roster the pathway diagram, the media fact sheet and the press table rely on. */
export function officialRosterView() {
  const { site, riders } = getData();
  return officialRoster(riders, site);
}

/** Team tabs: current riders as soon as any are listed, otherwise the latest roster. */
export function teamView() {
  const { site, riders, staff } = getData();
  return { roster: pickRoster(riders, site.currentSeason), crew: pickRoster(staff, site.currentSeason) };
}

/** Riders with a profile page: everyone in riders.json. */
export function profileRiders() {
  return getData().riders.map((r) => ({ rider: r, slug: riderSlug(r) }));
}

/** A rider's classified results, newest season first, best places first within a season. */
export function riderResults(r: Pick<Rider, 'name'>) {
  const { results, events } = getData();
  return [...results]
    .sort(([a], [b]) => b - a)
    .map(([season, rows]) => ({
      season,
      events: events.get(season) ?? new Map(),
      rows: sortResults(rows.filter((x) => x.rider === r.name && x.position !== null)),
    }))
    .filter((s) => s.rows.length > 0);
}

export function hasPhoto(dir: 'riders' | 'photos' | 'media', file: string | null | undefined): boolean {
  return Boolean(file && findImage(dir, file));
}

export interface RacePageView {
  season: number;
  slug: string;
  event: RaceEvent;
  /** The team's results at this race, best places first (DNF etc. last). */
  rows: Result[];
  events: EventIndex;
}

let racePageCache: RacePageView[] | null = null;

/** Every race with a page, oldest season first, in calendar order. */
export function racePages(): RacePageView[] {
  if (racePageCache) return racePageCache;
  const { raceEntries, results, events } = getData();
  racePageCache = [...raceEntries]
    .sort(([a], [b]) => a - b)
    .flatMap(([season, list]) => {
      const slugs = raceSlugs(list);
      const rows = results.get(season) ?? [];
      return list.filter(hasRacePage).map((event) => ({
        season,
        slug: slugs.get(event.id)!,
        event,
        rows: sortResults(rows.filter((r) => r.eventId === event.id)),
        events: events.get(season) ?? new Map(),
      }));
    });
  return racePageCache;
}

/** Link to a race's page, or null when the race has none (training, TBC, unknown date). */
export function raceHref(lang: Lang, season: number, eventId: string): string | null {
  const page = racePages().find((p) => p.season === season && p.event.id === eventId);
  return page ? racePath(lang, page.season, page.slug) : null;
}
