// Facts the showcase pages compute from data. Pure functions: no file system, no DOM.
// Every number on the site comes from here, so nothing is typed in by hand.
import { countriesRaced, disciplinesRaced, type EventIndex } from './results';
import type { Category, Discipline, Result, Rider, Site } from './schemas';
import { eventState, groupByMonth, isConfirmedRace, nextRace, presentationCountdown, slugify, type ISODate, type RaceEvent } from './season';

/* ---------- riders ---------- */

export function riderSlug(r: Pick<Rider, 'name' | 'slug'>): string {
  return r.slug ?? slugify(r.name);
}

export interface RosterSplit {
  total: number;
  junior: number;
  continental: number;
  U19: number;
  U23: number;
  Elite: number;
}

export function rosterSplit(riders: Pick<Rider, 'squad' | 'category'>[]): RosterSplit {
  const split: RosterSplit = { total: riders.length, junior: 0, continental: 0, U19: 0, U23: 0, Elite: 0 };
  for (const r of riders) {
    split[r.squad]++;
    split[r.category]++;
  }
  return split;
}

export const CATEGORY_ORDER: Category[] = ['U19', 'U23', 'Elite'];

/**
 * The roster journalists and the pathway diagram may rely on: the new season's riders once
 * "rosterConfirmed" is true, otherwise the last complete roster. A half-announced roster is
 * never counted.
 */
export function officialRoster<T extends { seasons: number[] }>(riders: T[], site: Pick<Site, 'currentSeason' | 'rosterConfirmed'>) {
  const current = riders.filter((r) => r.seasons.includes(site.currentSeason));
  if (site.rosterConfirmed && current.length) return { season: site.currentSeason, items: current };
  const past = riders.flatMap((r) => r.seasons).filter((s) => s < site.currentSeason);
  if (!past.length) return { season: null, items: [] as T[] };
  const season = Math.max(...past);
  return { season, items: riders.filter((r) => r.seasons.includes(season)) };
}

/* ---------- season numbers ---------- */

export interface SeasonNumbers {
  season: number;
  riders: RosterSplit;
  /** Races and championships on the published team calendar (training blocks left out). */
  races: number;
  /** Countries raced, from results (includes starts with national teams). */
  countries: number;
  disciplines: Discipline[];
}

/**
 * The four big figures. Starts at `preferred` and steps back until a season has a roster, a
 * calendar and results, so the figures are never zero or half-empty.
 */
export function seasonNumbers(
  calendars: Map<number, RaceEvent[]>,
  events: Map<number, EventIndex>,
  results: Map<number, Pick<Result, 'eventId'>[]>,
  riders: (Pick<Rider, 'squad' | 'category'> & { seasons: number[] })[],
  preferred: number,
): SeasonNumbers | null {
  const oldest = Math.min(preferred, ...calendars.keys());
  for (let season = preferred; season >= oldest; season--) {
    const races = (calendars.get(season) ?? []).filter(isConfirmedRace);
    const roster = riders.filter((r) => r.seasons.includes(season));
    const rows = results.get(season) ?? [];
    const index = events.get(season) ?? new Map();
    if (!races.length || !roster.length || !rows.length) continue;
    return {
      season,
      riders: rosterSplit(roster),
      races: races.length,
      countries: countriesRaced(rows, index).length,
      disciplines: disciplinesRaced(rows, index),
    };
  }
  return null;
}

const TOP_CLASS = /^[12]\.Pro$/;

/**
 * The season's top-tier UCI races (1.Pro / 2.Pro) on the team calendar. Uses the current season
 * once any of them is confirmed; until then the previous season's, labelled with its year.
 */
export function topUciRaces(calendars: Map<number, RaceEvent[]>, current: number) {
  for (const season of [current, current - 1]) {
    const races = (calendars.get(season) ?? []).filter((e) => isConfirmedRace(e) && e.cls && TOP_CLASS.test(e.cls));
    if (races.length) return { season, races };
  }
  return null;
}

/**
 * Calendar teaser: the next `n` months that still have races (training blocks left out). Before
 * the season starts that is simply its first four months. Empty once the season is over.
 */
export function teaserMonths(events: RaceEvent[], today: ISODate, n = 4) {
  const races = events.filter((e) => !e.training);
  const next = nextRace(races, today);
  return groupByMonth(races)
    .filter((g) => g.events.some((e) => eventState(e, today) !== 'past'))
    .slice(0, n)
    .map((g) => ({ ...g, events: g.events.filter((e) => eventState(e, today) !== 'past'), nextId: next?.id ?? null }));
}

/* ---------- status bar ---------- */

export type StatusBar =
  | { kind: 'presentation'; date: ISODate; place: string; url: string | null; daysToGo: number }
  | { kind: 'line' }
  | null;

/** A team presentation countdown wins while it is upcoming; otherwise the status line, if any. */
export function statusBar(site: Pick<Site, 'teamPresentation' | 'statusLine'>, today: ISODate): StatusBar {
  const tp = presentationCountdown(site.teamPresentation, today);
  if (tp) return { kind: 'presentation', date: tp.date, place: tp.place, url: tp.url ?? null, daysToGo: tp.daysToGo };
  return site.statusLine ? { kind: 'line' } : null;
}

/* ---------- contacts ---------- */

/** A person is named on a contact card only with a name and a way to reach them. */
export function isContactComplete(c: { name?: string | null; email?: string | null; phone?: string | null } | null): boolean {
  return Boolean(c && c.name && (c.email || c.phone));
}

/* ---------- media ---------- */

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** "2,4 MB" / "2.4 MB", "820 KB". */
export function formatBytes(bytes: number, locale: string): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  const digits = i === 0 || v >= 100 ? 0 : 1;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)} ${units[i]}`;
}

/** "a, b i c" / "a, b and c". */
export function listJoin(items: string[], locale: string): string {
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
}
