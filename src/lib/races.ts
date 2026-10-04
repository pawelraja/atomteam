// Race pages: which calendar entries get one, and at which address. Pure functions.
import { slugify, type RaceEvent } from './season';

/** A race gets a page once it has dates: every past race, and upcoming races once confirmed. Training never does. */
export function hasRacePage(e: RaceEvent): boolean {
  return !e.training && e.start !== null && e.end !== null && e.status !== 'tbc' && Boolean(e.country);
}

/**
 * Address per race id within one season: the "slug" from the calendar, else the Polish name.
 * Races sharing a name (the Polish Cup rounds) get their place added, then the id.
 */
export function raceSlugs(events: RaceEvent[]): Map<string, string> {
  const base = new Map(events.map((e) => [e.id, e.slug ?? slugify(e.name)]));
  const count = new Map<string, number>();
  for (const s of base.values()) count.set(s, (count.get(s) ?? 0) + 1);
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const e of events) {
    let slug = base.get(e.id)!;
    if (count.get(slug)! > 1 && !e.slug) {
      const place = e.location ? slugify(e.location.split(/[/(,]/)[0]) : '';
      slug = place ? `${slug}-${place}` : `${slug}-${slugify(e.id)}`;
    }
    if (used.has(slug)) slug = `${slug}-${slugify(e.id)}`;
    used.add(slug);
    out.set(e.id, slug);
  }
  return out;
}
