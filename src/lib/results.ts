// Results logic. Pure functions, no file system: the same rules as the results workbook
// (data/MADW_Results_<year>.xlsx, "Summary" sheet), so the site and the workbook always agree.
import type { CalendarEntry, Discipline, Result } from './schemas';
import type { Lang } from './text';

/** What a result row needs to know about its event. */
export interface EventInfo {
  id: string;
  name: string;
  nameEn: string | null;
  short: string | null;
  country: string | null;
  discipline: Discipline;
  cls: string | null;
  nationalChampionship: boolean;
  onTeamCalendar: boolean;
}

export function eventInfo(e: CalendarEntry & { id: string }): EventInfo {
  return {
    id: e.id,
    name: e.name,
    nameEn: e.name_en ?? null,
    short: e.short ?? null,
    country: e.country,
    discipline: e.discipline,
    cls: e.class,
    nationalChampionship: Boolean(e.nationalChampionship),
    onTeamCalendar: e.onTeamCalendar !== false,
  };
}

export type EventIndex = Map<string, EventInfo>;

/* ---------- titles and medals ---------- */

/**
 * A row counts towards Polish titles and medals when its event is a national championship held
 * in Poland. The race-day results of the criterium final are not titles (the title is the
 * series classification), exactly as in the workbook.
 */
export function isPolishChampionshipRow(row: Pick<Result, 'eventId' | 'stage'>, events: EventIndex): boolean {
  const e = events.get(row.eventId);
  return Boolean(e && e.nationalChampionship && e.country === 'POL' && !/criterium final/i.test(row.stage));
}

export interface Honours {
  /** Distinct Polish national titles: a pairs / team title counts once. */
  titles: number;
  /** Distinct Polish national-championship medals (1st–3rd), counted the same way. */
  medals: number;
}

export function countHonours(rows: Pick<Result, 'eventId' | 'stage' | 'category' | 'position'>[], events: EventIndex): Honours {
  const titles = new Set<string>();
  const medals = new Set<string>();
  for (const r of rows) {
    if (r.position === null || r.position > 3 || !isPolishChampionshipRow(r, events)) continue;
    const key = [r.eventId, r.stage, r.category, r.position].join('|');
    medals.add(key);
    if (r.position === 1) titles.add(key);
  }
  return { titles: titles.size, medals: medals.size };
}

/* ---------- season facts from results ---------- */

/** Countries the team's riders raced in (including starts for their national teams). */
export function countriesRaced(rows: Pick<Result, 'eventId'>[], events: EventIndex): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const c = events.get(r.eventId)?.country;
    if (c) set.add(c);
  }
  return [...set].sort();
}

const DISCIPLINE_ORDER: Discipline[] = ['ROAD', 'TRACK', 'CX', 'MTB'];

/** Disciplines raced. Team time trials are road racing, so TTT counts as road. */
export function disciplinesRaced(rows: Pick<Result, 'eventId'>[], events: EventIndex): Discipline[] {
  const set = new Set<Discipline>();
  for (const r of rows) {
    const d = events.get(r.eventId)?.discipline;
    if (d) set.add(d === 'TTT' ? 'ROAD' : d);
  }
  return DISCIPLINE_ORDER.filter((d) => set.has(d));
}

/* ---------- display ---------- */

export interface ResultCopy {
  /** Exact stage names or regular expressions (as "/…/i") → label; "$1" is the stage number. */
  stages: Record<string, string>;
  categories: Record<string, string>;
  /** Short event names for national / European championships, e.g. "MP", "ME". */
  nationalChampionship: string;
  europeanChampionship: string;
  worldChampionship: string;
}

/** "Stage 2" → "2. etap", "General classification (final)" → "klasyfikacja generalna", … */
export function stageLabel(stage: string, dict: ResultCopy['stages']): string {
  if (stage in dict) return dict[stage];
  for (const [pattern, label] of Object.entries(dict)) {
    const m = pattern.match(/^\/(.+)\/(\w*)$/);
    if (!m) continue;
    const hit = stage.match(new RegExp(m[1], m[2]));
    if (hit) return label.replace(/\$(\d)/g, (_, i) => hit[Number(i)] ?? '');
  }
  return stage;
}

export function categoryLabel(category: string, dict: ResultCopy['categories']): string {
  return dict[category] ?? category;
}

export function eventName(e: Pick<EventInfo, 'name' | 'nameEn'>, lang: Lang): string {
  return lang === 'en' && e.nameEn ? e.nameEn : e.name;
}

/**
 * The "Race" cell: "MP: jazda indywidualna na czas · U23", "Gracia Orlová (2.2): 5. etap",
 * "POREČ Classic Ladies (1.2)". National class "Nat." is left out.
 */
export function resultLabel(row: Pick<Result, 'eventId' | 'stage' | 'category'>, events: EventIndex, lang: Lang, copy: ResultCopy): string {
  const e = events.get(row.eventId);
  if (!e) return row.stage;
  let head: string;
  if (e.nationalChampionship && e.country === 'POL') head = copy.nationalChampionship;
  else if (e.cls === 'ECh.') head = copy.europeanChampionship;
  else if (e.cls === 'CM') head = copy.worldChampionship;
  else head = e.cls && e.cls !== 'Nat.' && e.cls !== 'NCh.' ? `${eventName(e, lang)} (${e.cls})` : eventName(e, lang);
  const stage = stageLabel(row.stage, copy.stages);
  const cat = categoryLabel(row.category, copy.categories);
  const tail = [stage, cat].filter(Boolean).join(' · ');
  return tail ? `${head}: ${tail}` : head;
}

/**
 * Team events list the whole squad in the note ("Poland: Sipko, Tracka, …" or "With Szczęsna").
 * Returns the riders' surnames for the "Rider" cell, or null for an individual result.
 */
export function teamLine(row: Pick<Result, 'rider' | 'note'>): string | null {
  const note = row.note ?? '';
  const surname = (full: string) => full.trim().split(/\s+/).pop()!;
  const listed = note.match(/^Poland:\s*(.+)$/);
  if (listed) return listed[1].trim();
  const withOthers = note.match(/^With\s+(.+)$/);
  if (withOthers) return [surname(row.rider), ...withOthers[1].split(/,\s*/).map((s) => s.trim())].join(', ');
  return null;
}

/** Best place first, then by date. DNFs and unplaced rows last. */
export function sortResults<T extends Pick<Result, 'position' | 'date'>>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.position ?? 999) - (b.position ?? 999) || (a.date ?? '').localeCompare(b.date ?? ''));
}

/**
 * Order of the featured table: UCI races first, then European / world championships, then Polish
 * races and championships — best place first within each group, then by date.
 */
export function sortFeatured<T extends Pick<Result, 'eventId' | 'position' | 'date'>>(rows: T[], events: EventIndex): T[] {
  const group = (r: T) => {
    const cls = events.get(r.eventId)?.cls ?? '';
    if (/^[12]\./.test(cls)) return 0;
    if (cls === 'ECh.' || cls === 'CM') return 1;
    return 2;
  };
  return [...rows].sort(
    (a, b) => group(a) - group(b) || (a.position ?? 999) - (b.position ?? 999) || (a.date ?? '').localeCompare(b.date ?? ''),
  );
}
