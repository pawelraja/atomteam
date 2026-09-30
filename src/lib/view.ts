// Build-time view models shared by several pages, so the home page, the team page and the
// media page always agree (e.g. which roster is "official", whether results are shown).
import { getData } from './data';
import { findImage } from './images';
import type { Rider } from './schemas';
import { pickRoster, recapSeason } from './season';
import { officialRoster, resultFigures, riderSlug, seasonNumbers, sortResults } from './showcase';

/** Results chapter: the reviewed season's verified results, or the season before. Null hides it. */
export function resultsView() {
  const { site, results, highlights } = getData();
  const preferred = recapSeason(site);
  for (const season of [preferred, preferred - 1]) {
    const rows = results.get(season) ?? [];
    if (rows.length) {
      return { season, rows: sortResults(rows), figures: resultFigures(rows), highlights: (highlights.get(season) ?? []).slice(0, 3) };
    }
  }
  return null;
}

export function numbersView() {
  const { site, calendars, riders } = getData();
  return seasonNumbers(calendars, riders, recapSeason(site));
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

/** Riders with a profile page: everyone in riders.json, current season first. */
export function profileRiders() {
  return getData().riders.map((r) => ({ rider: r, slug: riderSlug(r) }));
}

export function riderResults(r: Pick<Rider, 'name'>) {
  const { results } = getData();
  return [...results]
    .sort(([a], [b]) => b - a)
    .flatMap(([season, rows]) => sortResults(rows.filter((x) => x.rider === r.name)).map((x) => ({ ...x, season })));
}

export function hasPhoto(dir: 'riders' | 'photos' | 'media', file: string | null | undefined): boolean {
  return Boolean(file && findImage(dir, file));
}
