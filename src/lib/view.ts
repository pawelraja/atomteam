// Build-time view models shared by several pages, so the home page, the team page and the
// media page always agree (e.g. which roster is "official", which season the results cover).
import { getData } from './data';
import { findImage } from './images';
import { countHonours, sortFeatured, sortResults } from './results';
import type { Rider } from './schemas';
import { pickRoster, recapSeason } from './season';
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
