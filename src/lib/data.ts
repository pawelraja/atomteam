// Build-time data loading. Every data file is validated; a bad entry stops the build with a
// message that says which file, which entry and what is wrong.
//
// Test/preview overrides (never needed for normal editing):
//   MADW_DATA_DIR  folder whose files replace same-named files in src/data (scenario fixtures)
//   MADW_SITE      JSON merged over site.json, e.g. {"phase":"racing"}
//   MADW_TODAY     pretend today is this date (YYYY-MM-DD), at build time and in the browser
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import {
  calendarEntrySchema,
  gallerySchema,
  highlightSchema,
  mediaSchema,
  partnerSchema,
  resultSchema,
  riderSchema,
  siteSchema,
  staffSchema,
  type Highlight,
  type Media,
  type Result,
  type Rider,
  type Site,
} from './schemas';
import { duplicateIds, normalizeCalendar, todayISO, type RaceEvent } from './season';
import { riderSlug } from './showcase';

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

  const riders = load(z.array(riderSchema), 'riders.json');
  const slugs = new Map<string, string>();
  for (const r of riders) {
    const slug = riderSlug(r);
    if (slugs.has(slug)) {
      throw new DataError(
        `Problem in src/data/riders.json: "${r.name}" and "${slugs.get(slug)}" would share the profile address /zespol/${slug}/.
` +
          '  Give one of them a "slug", e.g. "slug": "' + slug + '-2".',
      );
    }
    slugs.set(slug, r.name);
  }

  const results = new Map<number, Result[]>();
  for (const file of listFiles('results', /^\d{4}\.json$/)) {
    results.set(Number(file.slice(0, 4)), visibleResults(load(z.array(resultSchema), `results/${file}`), `results/${file}`, riders));
  }

  const today = process.env.MADW_TODAY ?? todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new DataError('MADW_TODAY must be YYYY-MM-DD');

  return {
    site,
    calendars,
    partners: load(z.array(partnerSchema), 'partners.json'),
    riders,
    results,
    media: loadMedia(),
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

function visibleResults(list: Result[], file: string, riders: Rider[]): Result[] {
  const names = new Set(riders.map((r) => r.name));
  const unknown = list.filter((r) => !names.has(r.rider));
  if (unknown.length) {
    throw new DataError(
      `Problem in src/data/${file}: ${unknown.map((r) => `"${r.rider}"`).join(', ')} not found in riders.json.
` +
        '  Write the rider's name exactly as in riders.json (including Polish letters).',
    );
  }
  const hidden = list.filter((r) => r.verify);
  if (hidden.length) {
    console.warn(
      `[data] ${file}: hiding ${hidden.length} result(s) marked "verify": true until the team checks them: ` +
        hidden.map((r) => `${r.rider} (${r.event.pl}, ${r.place}.)`).join('; '),
    );
  }
  return list.filter((r) => !r.verify);
}

/** Where downloadable media files live. */
export const MEDIA_DIR = resolve('public/media');

export type MediaFileView = Omit<Media['files'][number], 'file'> & {
  /** Per language: the public URL and size in bytes, or null while the file is "soon". */
  file: Record<'pl' | 'en', { href: string; bytes: number } | null>;
};

function loadMedia(): { files: MediaFileView[]; photos: Media['photos'] } {
  const media = load(mediaSchema, 'media.json');
  const missing: string[] = [];
  const files = media.files.map<MediaFileView>((f) => {
    const names = typeof f.file === 'string' ? { pl: f.file, en: f.file } : f.file;
    const view = (name: string) => {
      const path = join(MEDIA_DIR, name);
      if (!existsSync(path)) {
        if (f.status === 'ready') missing.push(`"${f.id}" → public/media/${name}`);
        return null;
      }
      return { href: `/media/${name}`, bytes: statSync(path).size };
    };
    const file = { pl: view(names.pl), en: view(names.en) };
    // A "soon" item never links, even if a file happens to be there already.
    return { ...f, file: f.status === 'ready' ? file : { pl: null, en: null } };
  });
  if (missing.length) {
    throw new DataError(
      `Problem in src/data/media.json: these downloads are marked "ready" but the file is missing:
  - ${missing.join('
  - ')}
` +
        '  Add the file to public/media/, or set "status": "soon" until it is ready.',
    );
  }
  return { files, photos: media.photos };
}
