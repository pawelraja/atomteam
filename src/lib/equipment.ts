// The race setup and the wheel partnership: which races were ridden on the partner's wheels,
// the podiums won on them, and the structured data for the wheel models. Unconfirmed items
// ("verify": true) are left out unless SHOW_UNVERIFIED (team preview builds).
import { getData, SHOW_UNVERIFIED } from './data';
import { ids, type Ctx, type Node } from './jsonld';
import type { Result } from './schemas';
import type { RaceEvent } from './season';

/** Wheel mentions in results need the disciplines confirmed (preview builds show them anyway). */
export function wheelMentionsOn(): boolean {
  return SHOW_UNVERIFIED || !getData().equipment.wheels.disciplinesVerify;
}

/** Keeps confirmed items; preview builds keep everything (and mark the rest [VERIFY]). */
export function visible<T extends { verify: boolean }>(items: T[]): T[] {
  return SHOW_UNVERIFIED ? items : items.filter((i) => !i.verify);
}

/**
 * The wheel brand raced at an event, or null. The calendar entry decides when it says so
 * ("equipment": { "wheels": … } or false); otherwise a team-calendar race in a season and
 * discipline covered by equipment.json counts. Races ridden for national teams never do.
 */
export function wheelsFor(e: Pick<RaceEvent, 'season' | 'discipline' | 'training' | 'onTeamCalendar'> & { equipment?: { wheels: string | false } }): string | null {
  const { wheels } = getData().equipment;
  if (e.equipment) return e.equipment.wheels || null;
  if (e.training || e.onTeamCalendar === false) return null;
  return wheels.seasons.includes(e.season) && wheels.disciplines.includes(e.discipline) ? wheels.partner : null;
}

/** Podium places (1st–3rd) among result rows, each event/stage/category/place counted once. */
export function podiums(rows: Pick<Result, 'eventId' | 'stage' | 'category' | 'position'>[]): number {
  return new Set(rows.filter((r) => r.position !== null && r.position <= 3).map((r) => [r.eventId, r.stage, r.category, r.position].join('|'))).size;
}

/** Podiums won on the wheel partner's wheels in a season, and in how many races. */
export function wheelPodiums(season: number) {
  const { raceEntries, results } = getData();
  const onWheels = new Set((raceEntries.get(season) ?? []).filter((e) => wheelsFor(e)).map((e) => e.id));
  const rows = (results.get(season) ?? []).filter((r) => onWheels.has(r.eventId));
  const podiumRows = rows.filter((r) => r.position !== null && r.position <= 3);
  return { season, podiums: podiums(rows), races: new Set(podiumRows.map((r) => r.eventId)).size };
}

const DISCIPLINE_EN: Record<RaceEvent['discipline'], string> = { ROAD: 'road', TTT: 'time trial', TRACK: 'track', CX: 'cyclocross', MTB: 'MTB' };

/** Product nodes for the confirmed wheel models, made by (and branded) the wheel partner. */
export function wheelProducts(ctx: Ctx): Node[] {
  const { equipment, partners } = getData();
  const partner = partners.find((p) => p.name === equipment.wheels.partner)!;
  return equipment.wheels.models
    .filter((m) => !m.verify)
    .map((m) => ({
      '@type': 'Product',
      name: `${partner.name} ${m.name}`,
      category: `Carbon ${DISCIPLINE_EN[m.discipline]} bicycle wheels`,
      brand: { '@id': ids.partner(ctx, partner) },
      manufacturer: { '@id': ids.partner(ctx, partner) },
      ...(m.url ? { url: m.url } : {}),
      ...(m.rimDepth ? { additionalProperty: { '@type': 'PropertyValue', name: 'Rim depth', value: m.rimDepth, unitCode: 'MMT' } } : {}),
    }));
}
