// Pure season + calendar logic. No file system, no DOM: used at build time and in the browser.
import type { CalendarEntry, Discipline, Phase, Site, Status } from './schemas';

export type ISODate = string; // YYYY-MM-DD

export interface RaceEvent {
  id: string;
  season: number;
  name: string;
  nameEn: string | null;
  location: string | null;
  locationEn: string | null;
  country: string;
  discipline: Discipline;
  /** UCI / race class. Null when unknown or when the entry is flagged `verify`. */
  cls: string | null;
  status: Status;
  training: boolean;
  start: ISODate | null;
  end: ISODate | null;
  month: number;
  result: string | null;
  url: string | null;
  verify: boolean;
}

export type EventState = 'past' | 'live' | 'upcoming';

/* ---------- dates ---------- */

/** Today's date in Warsaw (the team's home time zone), as YYYY-MM-DD. */
export function todayISO(now: Date = new Date(), timeZone = 'Europe/Warsaw'): ISODate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const toUTC = (d: ISODate) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function addDays(d: ISODate, n: number): ISODate {
  return new Date(toUTC(d) + n * 86_400_000).toISOString().slice(0, 10);
}

const pad = (n: number) => String(n).padStart(2, '0');

/* ---------- language ---------- */

export type Lang = 'pl' | 'en';

/** Polish (official) name on /, English name on /en/ when one is given. */
export function raceName(e: Pick<RaceEvent, 'name' | 'nameEn'>, lang: Lang): string {
  return lang === 'en' && e.nameEn ? e.nameEn : e.name;
}

export function raceLocation(e: Pick<RaceEvent, 'location' | 'locationEn'>, lang: Lang): string | null {
  return lang === 'en' && e.locationEn ? e.locationEn : e.location;
}

/* ---------- identifiers ---------- */

export function slugify(s: string): string {
  return s
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Stable id for a calendar entry. It deliberately ignores dates, so moving a race to its
 * confirmed dates keeps the same id (and the same .ics UID in subscribed calendars).
 */
export function entryId(e: Pick<CalendarEntry, 'id' | 'name' | 'location' | 'country'>): string {
  return e.id ?? slugify(`${e.name} ${e.location ?? e.country}`);
}

/* ---------- calendar ---------- */

export function normalizeCalendar(season: number, entries: CalendarEntry[]): RaceEvent[] {
  const events = entries.map<RaceEvent>((e) => {
    const month = e.start ? +e.start.slice(5, 7) : e.month!;
    return {
      id: entryId(e),
      season,
      name: e.name,
      nameEn: e.name_en ?? null,
      location: e.location,
      locationEn: e.location_en ?? null,
      country: e.country,
      discipline: e.discipline,
      cls: e.verify ? null : e.class,
      status: e.status,
      training: e.type === 'training',
      start: e.start ?? null,
      end: e.end ?? null,
      month,
      result: e.result ?? null,
      url: e.url ?? null,
      verify: !!e.verify,
    };
  });
  return events.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

// Dated entries sort by start; month-only (TBC) entries sort at the end of their month.
const sortKey = (e: RaceEvent) => e.start ?? `${e.season}-${pad(e.month)}-99`;

/** Checks ids are unique within a season; returns human-readable problems. */
export function duplicateIds(events: RaceEvent[]): string[] {
  const seen = new Map<string, number>();
  for (const e of events) seen.set(e.id, (seen.get(e.id) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
}

export function isDated(e: RaceEvent): e is RaceEvent & { start: ISODate; end: ISODate } {
  return e.start !== null && e.end !== null;
}

export function eventState(e: RaceEvent, today: ISODate): EventState {
  if (isDated(e)) {
    if (e.end < today) return 'past';
    if (e.start <= today) return 'live';
    return 'upcoming';
  }
  const ym = `${e.season}-${pad(e.month)}`;
  const todayYm = today.slice(0, 7);
  if (ym < todayYm) return 'past';
  if (ym === todayYm) return 'live';
  return 'upcoming';
}

/** A race that can be announced as "next": confirmed, dated and not a training block. */
export function isConfirmedRace(e: RaceEvent): e is RaceEvent & { start: ISODate; end: ISODate } {
  return e.status === 'confirmed' && !e.training && isDated(e);
}

export function nextRace(events: RaceEvent[], today: ISODate) {
  return (
    events
      .filter(isConfirmedRace)
      .filter((e) => e.end >= today)
      .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))[0] ?? null
  );
}

export type NextRaceView =
  | { kind: 'next'; event: RaceEvent & { start: ISODate; end: ISODate }; daysToGo: number; live: boolean }
  | { kind: 'soon'; firstMonth: number | null }
  | { kind: 'complete' };

export function nextRaceView(events: RaceEvent[], season: number, today: ISODate): NextRaceView {
  const next = nextRace(events, today);
  if (next) {
    const days = daysBetween(today, next.start);
    return { kind: 'next', event: next, daysToGo: Math.max(0, days), live: days <= 0 };
  }
  if (+today.slice(0, 4) > season) return { kind: 'complete' };

  const pending = events.filter(
    (e) => e.status === 'tbc' && !e.training && eventState(e, today) !== 'past',
  );
  if (pending.length) return { kind: 'soon', firstMonth: Math.min(...pending.map((e) => e.month)) };

  const anyRaced = events.some((e) => isConfirmedRace(e));
  return anyRaced ? { kind: 'complete' } : { kind: 'soon', firstMonth: null };
}

export function groupByMonth(events: RaceEvent[]): { month: number; events: RaceEvent[] }[] {
  const groups = new Map<number, RaceEvent[]>();
  for (const e of events) {
    if (!groups.has(e.month)) groups.set(e.month, []);
    groups.get(e.month)!.push(e);
  }
  return [...groups].sort(([a], [b]) => a - b).map(([month, evs]) => ({ month, events: evs }));
}

export function monthName(month: number, locale: string, style: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, month - 1, 1)),
  );
}

/** "03/ March" — the site's month label style. */
export function monthLabel(month: number, locale: string) {
  const name = monthName(month, locale);
  return `${pad(month)}/ ${name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)}`;
}

/** "4 Mar", "4–8 Mar", "30 Apr – 3 May", "30 Dec 2026 – 2 Jan 2027". */
export function formatRange(start: ISODate, end: ISODate, locale: string): string {
  const d = (iso: ISODate, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(new Date(toUTC(iso)));
  const day = (iso: ISODate) => String(+iso.slice(8, 10));
  const mon = (iso: ISODate) => d(iso, { month: 'short' });
  if (start === end) return `${day(start)} ${mon(start)}`;
  if (start.slice(0, 4) !== end.slice(0, 4))
    return `${day(start)} ${mon(start)} ${start.slice(0, 4)} – ${day(end)} ${mon(end)} ${end.slice(0, 4)}`;
  if (start.slice(0, 7) === end.slice(0, 7)) return `${day(start)}–${day(end)} ${mon(end)}`;
  return `${day(start)} ${mon(start)} – ${day(end)} ${mon(end)}`;
}

/** Filter category used by the calendar chips. */
export function category(e: RaceEvent): Discipline | 'TRAINING' {
  return e.training ? 'TRAINING' : e.discipline;
}

export interface SeasonStats {
  races: number;
  raceDays: number;
  countries: number;
  uciRaces: number;
}

/** Facts computed from a season's calendar — only confirmed, raced (non-cancelled) entries count. */
export function seasonStats(events: RaceEvent[]): SeasonStats {
  const races = events.filter(isConfirmedRace);
  return {
    races: races.length,
    raceDays: races.reduce((n, e) => n + daysBetween(e.start, e.end) + 1, 0),
    countries: new Set(races.map((e) => e.country)).size,
    uciRaces: races.filter((e) => e.cls && /^[12]\./.test(e.cls)).length,
  };
}

/* ---------- season model ---------- */

/** 2027 for a team founded in 2016 is season 12. */
export function seasonNumber(site: Pick<Site, 'currentSeason' | 'foundedYear'>): number {
  return site.currentSeason - site.foundedYear + 1;
}

export type SectionId =
  | 'presentation'
  | 'glance'
  | 'recap'
  | 'next-race'
  | 'story'
  | 'team'
  | 'calendar'
  | 'partners'
  | 'movement'
  | 'contact';

/** Section order per phase. The hero is always first and the footer always last. */
export function sectionOrder(phase: Phase): SectionId[] {
  switch (phase) {
    case 'preseason':
      return ['presentation', 'glance', 'recap', 'partners', 'next-race', 'story', 'team', 'calendar', 'movement', 'contact'];
    case 'racing':
      return ['presentation', 'glance', 'next-race', 'calendar', 'story', 'team', 'partners', 'recap', 'movement', 'contact'];
    case 'offseason':
      return ['presentation', 'recap', 'glance', 'story', 'partners', 'team', 'calendar', 'next-race', 'movement', 'contact'];
  }
}

/** Which season the "in review" section recaps. */
export function recapSeason(site: Pick<Site, 'currentSeason' | 'phase'>): number {
  return site.phase === 'offseason' ? site.currentSeason : site.currentSeason - 1;
}

/** Countdown for the team presentation, or null once the day has passed (or none is set). */
export function presentationCountdown(tp: Site['teamPresentation'], today: ISODate) {
  if (!tp || tp.date < today) return null;
  return { ...tp, daysToGo: daysBetween(today, tp.date) };
}

interface Seasonal {
  seasons: number[];
}

export interface SeasonPick<T> {
  /** The season the shown items belong to. */
  season: number | null;
  items: T[];
  /** True when the items are for the current season. */
  isCurrent: boolean;
}

function latestPreviousSeason<T extends Seasonal>(items: T[], current: number): number | null {
  const prev = items.flatMap((i) => i.seasons).filter((s) => s < current);
  return prev.length ? Math.max(...prev) : null;
}

/**
 * Roster / staff: show current-season people as soon as any are listed (a partial roster is
 * fine — the copy says the announcement is coming). Otherwise fall back to the latest season.
 */
export function pickRoster<T extends Seasonal>(items: T[], current: number): SeasonPick<T> {
  const now = items.filter((i) => i.seasons.includes(current));
  if (now.length) return { season: current, items: now, isCurrent: true };
  const prev = latestPreviousSeason(items, current);
  return { season: prev, items: prev === null ? [] : items.filter((i) => i.seasons.includes(prev)), isCurrent: false };
}

/**
 * Partners: only present current-season partners once the list is confirmed. Until then,
 * thank the previous season's partners — never present them as current.
 */
export function pickPartners<T extends Seasonal>(items: T[], current: number, confirmed: boolean): SeasonPick<T> {
  if (confirmed) {
    const now = items.filter((i) => i.seasons.includes(current));
    if (now.length) return { season: current, items: now, isCurrent: true };
  }
  const prev = latestPreviousSeason(items, current);
  return { season: prev, items: prev === null ? [] : items.filter((i) => i.seasons.includes(prev)), isCurrent: false };
}

export type RowStatus = 'cancelled' | 'next' | 'live' | 'tbc' | 'past' | 'upcoming';

/** The status label a calendar row shows. `nextId` is the id of the next confirmed race. */
export function rowStatus(
  e: Pick<RaceEvent, 'id' | 'status' | 'season' | 'month' | 'start' | 'end'>,
  today: ISODate,
  nextId: string | null,
): RowStatus {
  if (e.status === 'cancelled') return 'cancelled';
  if (nextId !== null && e.id === nextId) return 'next';
  const state = eventState(e as RaceEvent, today);
  if (state === 'past') return 'past';
  if (e.status === 'tbc') return 'tbc';
  return state;
}
