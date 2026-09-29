// Build-time data loading. Every data file is validated; a bad entry stops the build with a
// message that says which file, which entry and what is wrong.
//
// Test/preview overrides (never needed for normal editing):
//   MADW_DATA_DIR  folder whose files replace same-named files in src/data (scenario fixtures)
//   MADW_SITE      JSON merged over site.json, e.g. {"phase":"racing"}
//   MADW_TODAY     pretend today is this date (YYYY-MM-DD), at build time and in the browser
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import {
  calendarEntrySchema,
  gallerySchema,
  highlightSchema,
  partnerSchema,
  riderSchema,
  siteSchema,
  staffSchema,
  type Highlight,
  type Site,
} from './schemas';
import { duplicateIds, normalizeCalendar, todayISO, type RaceEvent } from './season';

const BASE = resolve('src/data');
const OVERLAY = process.env.MADW_DATA_DIR ? resolve(process.env.MADW_DATA_DIR) : null;

function pathFor(rel: string): string | null {
  if (OVERLAY && existsSync(join(OVERLAY, rel))) return join(OVERLAY, rel);
  return existsSync(join(BASE, rel)) ? join(BASE, rel) : null;
}

export class DataError extends Error {}

function readJSON(rel: string): unknown {
  const p = pathFor(rel);
  if (!p) throw new DataError(`Missing data file src/data/${rel}`);
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (err) {
    throw new DataError(
      `src/data/${rel} is not valid JSON: ${(err as Error).message}\n` +
        '  Tip: check for a missing comma, a trailing comma after the last item, or a missing quote.',
    );
  }
}

function describe(item: unknown): string {
  if (item && typeof item === 'object' && 'name' in item) return ` ("${String((item as { name: unknown }).name)}")`;
  if (item && typeof item === 'object' && 'title' in item) {
    const title = (item as { title: unknown }).title;
    return ` ("${typeof title === 'object' && title ? String((title as { pl?: unknown }).pl) : String(title)}")`;
  }
  return '';
}

export function validate<T extends z.ZodType>(schema: T, data: unknown, file: string): z.infer<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const problems = result.error.issues.map((issue) => {
    const [index, ...field] = issue.path;
    const where =
      typeof index === 'number' && Array.isArray(data)
        ? `entry #${index + 1}${describe(data[index])}${field.length ? `, field "${field.join('.')}"` : ''}`
        : issue.path.length
          ? `field "${issue.path.join('.')}"`
          : 'file';
    return `  - ${where}: ${issue.message}`;
  });
  throw new DataError(`Problem in src/data/${file}:\n${problems.join('\n')}`);
}

function load<T extends z.ZodType>(schema: T, rel: string): z.infer<T> {
  return validate(schema, readJSON(rel), rel);
}

let cache: ReturnType<typeof loadAll> | null = null;

export function getData() {
  cache ??= loadAll();
  return cache;
}

function listFiles(dir: string, pattern: RegExp): string[] {
  const names = new Set<string>();
  for (const root of [BASE, OVERLAY]) {
    if (root && existsSync(join(root, dir))) {
      for (const f of readdirSync(join(root, dir))) if (pattern.test(f)) names.add(f);
    }
  }
  return [...names].sort();
}

function loadAll() {
  let site: Site = load(siteSchema, 'site.json');
  if (process.env.MADW_SITE) {
    site = validate(siteSchema, { ...site, ...JSON.parse(process.env.MADW_SITE) }, 'site.json (MADW_SITE override)');
  }
  if (site.foundedYear > site.currentSeason) {
    throw new DataError('Problem in src/data/site.json: "foundedYear" is after "currentSeason"');
  }

  const calendars = new Map<number, RaceEvent[]>();
  for (const file of listFiles('calendar', /^\d{4}\.json$/)) {
    const season = Number(file.slice(0, 4));
    const entries = load(z.array(calendarEntrySchema), `calendar/${file}`);
    const wrongYear = entries.filter((e) => e.start && !e.start.startsWith(String(season)));
    if (wrongYear.length) {
      throw new DataError(
        `Problem in src/data/calendar/${file}: these races start outside ${season}: ` +
          wrongYear.map((e) => `"${e.name}" (${e.start})`).join(', '),
      );
    }
    const events = normalizeCalendar(season, entries);
    const dupes = duplicateIds(events);
    if (dupes.length) {
      throw new DataError(
        `Problem in src/data/calendar/${file}: two or more entries share the same name and place (${dupes.join(', ')}).\n` +
          '  Give each of them a unique "id", e.g. "id": "polish-cup-lubawa-june".',
      );
    }
    const unverified = events.filter((e) => e.verify);
    if (unverified.length) {
      console.warn(
        `[data] calendar/${file}: ${unverified.length} entr${unverified.length === 1 ? 'y has' : 'ies have'} "verify": true — race class hidden until checked: ` +
          unverified.map((e) => e.name).join('; '),
      );
    }
    calendars.set(season, events);
  }
  if (!calendars.has(site.currentSeason)) calendars.set(site.currentSeason, []);

  const highlights = new Map<number, Highlight[]>();
  for (const file of listFiles('.', /^highlights-\d{4}\.json$/)) {
    const season = Number(file.match(/\d{4}/)![0]);
    highlights.set(season, visibleHighlights(load(z.array(highlightSchema), file), file));
  }

  const today = process.env.MADW_TODAY ?? todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new DataError('MADW_TODAY must be YYYY-MM-DD');

  return {
    site,
    calendars,
    partners: load(z.array(partnerSchema), 'partners.json'),
    riders: load(z.array(riderSchema), 'riders.json'),
    staff: load(z.array(staffSchema), 'staff.json'),
    highlights,
    gallery: load(z.array(gallerySchema), 'gallery.json'),
    today,
    todayOverridden: Boolean(process.env.MADW_TODAY),
  };
}

function visibleHighlights<T extends { verify?: boolean; title: { pl: string } }>(list: T[], file: string): T[] {
  const hidden = list.filter((h) => h.verify);
  if (hidden.length) {
    console.warn(
      `[data] ${file}: hiding ${hidden.length} highlight(s) marked "verify": true until the team checks them: ` +
        hidden.map((h) => `"${h.title.pl}"`).join('; '),
    );
  }
  return list.filter((h) => !h.verify);
}
