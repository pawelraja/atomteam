import { describe, expect, it } from 'vitest';
import calendar2026 from '../src/data/calendar/2026.json';
import calendar2027 from '../src/data/calendar/2027.json';
import partners from '../src/data/partners.json';
import riders from '../src/data/riders.json';
import staff from '../src/data/staff.json';
import { checkGraph } from '../scripts/check-jsonld.mjs';
import { IOC_TO_ISO2 } from '../src/lib/countries';
import { graph, person, riderSameAs, sportsEvent, teamFull, website, type Ctx } from '../src/lib/jsonld';
import { hasRacePage, raceSlugs } from '../src/lib/races';
import { partnerSchema, riderSchema, staffSchema, type Rider } from '../src/lib/schemas';
import { normalizeCalendar, type RaceEvent } from '../src/lib/season';
import { TEAM } from '../src/lib/team';

const ctx: Ctx = { origin: 'https://www.atomteam.pl', lang: 'en' };
const allRiders = riders.map((r) => riderSchema.parse(r));
const rider = allRiders[0];

const full = () =>
  teamFull(ctx, {
    team: TEAM,
    homeUrl: 'https://www.atomteam.pl/en/',
    description: 'A team.',
    logo: null,
    riders: allRiders.map((r) => ({ rider: r, slug: r.name.toLowerCase().replace(/\W+/g, '-') })),
    staff: staff.map((s) => staffSchema.parse(s)),
    partners: partners.map((p) => partnerSchema.parse(p)),
    tierLabel: (t) => t,
    partnerDescription: (p) => `Partner ${p.name}`,
  });

const race: RaceEvent & { start: string; end: string } = {
  ...normalizeCalendar(2026, calendar2026 as never).find((e) => e.id === 'E09')!,
} as RaceEvent & { start: string; end: string };

describe('structured data builders produce valid schema.org', () => {
  it('home: WebSite + full SportsTeam with athletes, coaches, sponsors and the UCI', () => {
    const nodes = [website(ctx, { team: TEAM, homeUrl: 'https://www.atomteam.pl/en/' }), ...full()];
    expect(checkGraph(graph(nodes))).toEqual([]);
    const team = nodes[1] as Record<string, unknown[]>;
    expect(team.athlete).toHaveLength(riders.length);
    expect(team.coach.length).toBeGreaterThan(0);
    expect(team.sponsor).toHaveLength(partners.length);
  });

  it('rider: Person with nationality, team membership and sameAs', () => {
    const p = person(ctx, { rider, slug: 'olga-wankiewicz', pageUrl: 'https://www.atomteam.pl/en/team/olga-wankiewicz/', description: 'x', jobTitle: 'Cyclist', image: null });
    expect(checkGraph(graph([...full(), p]))).toEqual([]);
    expect(p.nationality).toMatchObject({ '@type': 'Country', identifier: 'PL' });
  });

  it('race: SportsEvent with dates, place, ISO country and competitors', () => {
    const e = sportsEvent(ctx, { event: race, slug: 'porec-classic-ladies', pageUrl: 'https://www.atomteam.pl/en/races/2026/porec-classic-ladies/', description: 'x', riders: [] });
    expect(checkGraph(graph([...full(), e]))).toEqual([]);
    // The calendar says CRO (UCI code); structured data needs ISO HR.
    expect((e.location as { address: { addressCountry: string } }).address.addressCountry).toBe('HR');
  });

  it('only emits rider profile links once they are checked', () => {
    const unchecked: Rider = { ...rider, profiles: { procyclingstats: 'https://www.procyclingstats.com/rider/x', firstcycling: null, uci: null, verify: true } };
    expect(riderSameAs(unchecked)).not.toContain('https://www.procyclingstats.com/rider/x');
    expect(riderSameAs({ ...unchecked, profiles: { ...unchecked.profiles!, verify: false } })).toContain('https://www.procyclingstats.com/rider/x');
  });
});

describe('the JSON-LD check rejects invalid data', () => {
  const base = { '@type': 'SportsTeam', '@id': 'https://x.pl/#team', name: 'T', url: 'https://x.pl/' };
  const problems = (nodes: object[]) => checkGraph(graph(nodes as never));
  it('accepts a minimal valid team', () => expect(problems([base])).toEqual([]));
  it('unknown property', () => expect(problems([{ ...base, colour: 'pink' }]).join()).toMatch(/"colour" is not a property/));
  it('unknown type', () => expect(problems([{ ...base, '@type': 'CyclingTeam' }]).join()).toMatch(/unknown @type/));
  it('missing required property', () => expect(problems([{ '@type': 'SportsEvent', name: 'R', location: { '@type': 'Place', address: 'x' } }]).join()).toMatch(/needs "startDate"/));
  it('dangling reference', () => expect(problems([{ ...base, memberOf: { '@id': 'https://x.pl/#uci' } }]).join()).toMatch(/not defined on this page/));
  it('non-ISO date', () => expect(problems([{ ...base, foundingDate: '2016 r.' }]).join()).toMatch(/ISO 8601/));
  it('relative URL', () => expect(problems([{ ...base, url: '/en/' }]).join()).toMatch(/absolute URL/));
  it('IOC country code', () => expect(problems([{ ...base, location: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'NED' } } }]).join()).toMatch(/alpha-2/));
  it('unconfirmed placeholder', () => expect(problems([{ ...base, description: 'Code [VERIFY]' }]).join()).toMatch(/VERIFY/));
  it('wrong context', () => expect(checkGraph({ '@context': 'http://schema.org', '@graph': [base] }).join()).toMatch(/@context/));
});

describe('race pages', () => {
  const events = normalizeCalendar(2026, calendar2026 as never);
  it('gives every country used in the data an ISO code', () => {
    const codes = new Set([...calendar2026, ...calendar2027].map((e) => e.country).filter(Boolean) as string[]);
    for (const r of riders) codes.add(r.nat);
    for (const c of codes) expect(IOC_TO_ISO2[c], c).toBeDefined();
  });
  it('never gives training blocks or TBC races a page', () => {
    expect(events.filter((e) => e.training).some(hasRacePage)).toBe(false);
    expect(normalizeCalendar(2027, calendar2027 as never).some(hasRacePage)).toBe(false);
  });
  it('gives races that share a name distinct addresses', () => {
    const slugs = [...raceSlugs(events).values()];
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('puchar-polski-szosa-lubartow');
  });
});
