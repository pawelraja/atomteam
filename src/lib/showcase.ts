// Facts the showcase pages compute from data. Pure functions: no file system, no DOM.
// Every number on the site comes from here, so nothing is typed in by hand.
import type { Category, Discipline, Result, Rider, Site } from './schemas';
import {
  eventState,
  groupByMonth,
  isConfirmedRace,
  nextRace,
  presentationCountdown,
  slugify,
  type ISODate,
  type RaceEvent,
} from './season';

/* ---------- riders ---------- */

export function riderSlug(r: Pick<Rider, 'name' | 'slug'>): string {
  return r.slug ?? slugify(r.name);
}

/** Juniors are U19 by definition; continental riders need "category" in riders.json. */
export function riderCategory(r: Pick<Rider, 'squad' | 'category'>): Category | null {
  return r.category ?? (r.squad === 'junior' ? 'U19' : null);
}

export interface RosterSplit {
  total: number;
  junior: number;
  continental: number;
  U19: number;
  U23: number;
  ELITE: number;
  /** Riders whose age category is not filled in yet. */
  unknown: number;
}

export function rosterSplit(riders: Pick<Rider, 'squad' | 'category'>[]): RosterSplit {
  const split: RosterSplit = { total: riders.length, junior: 0, continental: 0, U19: 0, U23: 0, ELITE: 0, unknown: 0 };
  for (const r of riders) {
    split[r.squad]++;
    const c = riderCategory(r);
    if (c) split[c]++;
    else split.unknown++;
  }
  return split;
}

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

/* ---------- calendar facts ---------- */

const DISCIPLINE_ORDER: Discipline[] = ['ROAD', 'TRACK', 'CX', 'MTB', 'TTT'];

/** Disciplines the team raced (confirmed, non-training), in a fixed order. */
export function disciplinesRaced(events: RaceEvent[]): Discipline[] {
  const set = new Set(events.filter(isConfirmedRace).map((e) => e.discipline));
  return DISCIPLINE_ORDER.filter((d) => set.has(d));
}

export interface SeasonNumbers {
  season: number;
  riders: RosterSplit;
  races: number;
  countries: number;
  disciplines: Discipline[];
}

/**
 * The four big figures. Starts at `preferred` and steps back until a season has both a
 * roster and confirmed races, so the figures are never zero or half-empty.
 */
export function seasonNumbers(
  calendars: Map<number, RaceEvent[]>,
  riders: (Pick<Rider, 'squad' | 'category'> & { seasons: number[] })[],
  preferred: number,
): SeasonNumbers | null {
  const oldest = Math.min(preferred, ...calendars.keys());
  for (let season = preferred; season >= oldest; season--) {
    const races = (calendars.get(season) ?? []).filter(isConfirmedRace);
    const roster = riders.filter((r) => r.seasons.includes(season));
    if (!races.length || !roster.length) continue;
    return {
      season,
      riders: rosterSplit(roster),
      races: races.length,
      countries: new Set(races.map((e) => e.country)).size,
      disciplines: disciplinesRaced(races),
    };
  }
  return null;
}

const TOP_CLASS = /^[12]\.Pro$/;

/**
 * The season's top-tier UCI races (1.Pro / 2.Pro). Uses the current season once any of them
 * is confirmed; until then the previous season's, labelled with its year.
 */
export function topUciRaces(calendars: Map<number, RaceEvent[]>, current: number) {
  for (const season of [current, current - 1]) {
    const races = (calendars.get(season) ?? []).filter((e) => isConfirmedRace(e) && e.cls && TOP_CLASS.test(e.cls));
    if (races.length) return { season, races };
  }
  return null;
}

/**
 * Calendar teaser: the next `n` months that still have races (training blocks left out).
 * Returns an empty list once the season is over.
 */
export function teaserMonths(events: RaceEvent[], today: ISODate, n = 4) {
  const races = events.filter((e) => !e.training);
  const next = nextRace(races, today);
  return groupByMonth(races)
    .filter((g) => g.events.some((e) => eventState(e, today) !== 'past'))
    .slice(0, n)
    .map((g) => ({ ...g, events: g.events.filter((e) => eventState(e, today) !== 'past'), nextId: next?.id ?? null }));
}

/* ---------- results ---------- */

export interface ResultFigures {
  titles: number;
  medals: number;
}

/** National titles (1st) and national-championship medals (1st–3rd), counting repeats. */
export function resultFigures(results: Pick<Result, 'championship' | 'place' | 'count'>[]): ResultFigures {
  let titles = 0;
  let medals = 0;
  for (const r of results) {
    if (r.championship !== 'national') continue;
    const n = r.count ?? 1;
    if (r.place === 1) titles += n;
    if (r.place <= 3) medals += n;
  }
  return { titles, medals };
}

/** Best place first, then championships before other races, then by rider. */
export function sortResults<T extends Pick<Result, 'place' | 'championship' | 'rider'>>(results: T[]): T[] {
  const rank = { world: 0, continental: 1, national: 2, other: 3 };
  return [...results].sort(
    (a, b) => a.place - b.place || rank[a.championship] - rank[b.championship] || a.rider.localeCompare(b.rider, 'pl'),
  );
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

/** A contact card is shown only when it names a person and gives a way to reach them. */
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
