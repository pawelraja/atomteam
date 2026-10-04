// Structured data (schema.org JSON-LD), generated from src/data. Pure functions: every input is
// passed in, so the same builders serve the pages and the unit tests. Nothing marked "verify"
// is ever emitted (see src/lib/team.ts).
//
// Node ids are language-neutral and stable, so the PL and EN pages describe the same entities:
//   team        https://www.atomteam.pl/#team
//   website     https://www.atomteam.pl/#website
//   rider       https://www.atomteam.pl/zespol/<slug>/#person
//   race        https://www.atomteam.pl/wyscigi/<season>/<slug>/#event
//   partner     https://www.atomteam.pl/partnerzy/#<slug>
import { countryNameEn, iso2 } from './countries';
import { racePath, riderPath } from './routes';
import type { Partner, Result, Rider, Staff, Team } from './schemas';
import { raceLocation, raceName, slugify, type RaceEvent } from './season';
import { legalName, teamSameAs, uciCode } from './team';
import type { Lang } from './text';

export type Node = Record<string, unknown>;

export interface Ctx {
  /** Site origin with no trailing slash, e.g. "https://www.atomteam.pl". */
  origin: string;
  lang: Lang;
}

const LOCALE: Record<Lang, string> = { pl: 'pl-PL', en: 'en-GB' };
const abs = (ctx: Ctx, path: string) => new URL(path, ctx.origin + '/').href;

export const ids = {
  team: (ctx: Ctx) => `${ctx.origin}/#team`,
  website: (ctx: Ctx) => `${ctx.origin}/#website`,
  uci: (ctx: Ctx) => `${ctx.origin}/#uci`,
  rider: (ctx: Ctx, slug: string) => `${abs(ctx, riderPath('pl', slug))}#person`,
  race: (ctx: Ctx, season: number, slug: string) => `${abs(ctx, racePath('pl', season, slug))}#event`,
  partner: (ctx: Ctx, p: Pick<Partner, 'name'>) => `${ctx.origin}/partnerzy/#${slugify(p.name)}`,
};

const ref = (id: string) => ({ '@id': id });

/* ---------- team, website ---------- */

export interface TeamInput {
  team: Team;
  homeUrl: string;
  description: string;
  logo: string | null;
}

/** The short team node every page carries, so references to #team always resolve. */
export function teamStub(ctx: Ctx, { team, homeUrl, logo }: Omit<TeamInput, 'description'>): Node {
  return {
    '@type': 'SportsTeam',
    '@id': ids.team(ctx),
    name: team.name,
    url: homeUrl,
    sport: team.sport,
    ...(logo ? { logo } : {}),
    sameAs: teamSameAs(team),
  };
}

const GENDER: Record<Team['gender'], string> = {
  Female: 'https://schema.org/Female',
  Male: 'https://schema.org/Male',
  Mixed: 'Mixed',
};

export interface FullTeamInput extends TeamInput {
  /** The roster structured data presents (the official one, as on the media page). */
  riders: { rider: Rider; slug: string }[];
  staff: Staff[];
  partners: Partner[];
  tierLabel: (tier: Partner['tier']) => string;
  partnerDescription: (p: Partner) => string;
  partnerLogo?: (p: Partner) => string | null;
}

/** The full SportsTeam: athletes, coaches, staff, sponsors, governing body and profiles. */
export function teamFull(ctx: Ctx, input: FullTeamInput): Node[] {
  const { team } = input;
  const code = uciCode(team);
  const legal = legalName(team);
  const coaches = input.staff.filter((s) => s.function === 'coach' || s.function === 'director');
  const employees = input.staff.filter((s) => !coaches.includes(s));
  const place = {
    '@type': 'Place',
    name: team.city,
    address: { '@type': 'PostalAddress', addressLocality: team.city, addressRegion: team.region, addressCountry: team.country },
  };
  const node: Node = {
    ...teamStub(ctx, input),
    alternateName: team.alternateNames,
    ...(legal ? { legalName: legal } : {}),
    description: input.description,
    email: team.contact.email,
    ...(team.contact.phone ? { telephone: team.contact.phone } : {}),
    gender: GENDER[team.gender],
    foundingDate: String(team.founded),
    foundingLocation: place,
    location: place,
    memberOf: ref(ids.uci(ctx)),
    ...(code ? { identifier: { '@type': 'PropertyValue', propertyID: 'UCI team code', value: code } } : {}),
    athlete: input.riders.map(({ rider, slug }) => ({ '@type': 'Person', '@id': ids.rider(ctx, slug), name: rider.name, url: abs(ctx, riderPath(ctx.lang, slug)) })),
    coach: coaches.map((s) => staffPerson(ctx, s)),
    employee: employees.map((s) => staffPerson(ctx, s)),
    sponsor: input.partners.map((p) => ({ '@type': 'Role', roleName: input.tierLabel(p.tier), sponsor: ref(ids.partner(ctx, p)) })),
  };
  const uci: Node = {
    '@type': 'SportsOrganization',
    '@id': ids.uci(ctx),
    name: 'Union Cycliste Internationale',
    alternateName: 'UCI',
    url: 'https://www.uci.org/',
    sport: 'Cycling',
  };
  return [node, uci, ...input.partners.map((p) => partnerNode(ctx, p, input.partnerDescription(p), input.partnerLogo?.(p) ?? null))];
}

function staffPerson(ctx: Ctx, s: Staff): Node {
  return { '@type': 'Person', name: s.name, jobTitle: s.role[ctx.lang], worksFor: ref(ids.team(ctx)) };
}

export function website(ctx: Ctx, { team, homeUrl }: { team: Team; homeUrl: string }): Node {
  return {
    '@type': 'WebSite',
    '@id': ids.website(ctx),
    name: team.name,
    alternateName: team.shortName,
    url: homeUrl,
    inLanguage: LOCALE[ctx.lang],
    publisher: ref(ids.team(ctx)),
    about: ref(ids.team(ctx)),
  };
}

/* ---------- partners ---------- */

export function partnerNode(ctx: Ctx, p: Partner, description: string, logo: string | null = null): Node {
  const isBrand = p.kind === 'brand';
  return {
    '@type': isBrand ? 'Brand' : 'Organization',
    '@id': ids.partner(ctx, p),
    name: p.name,
    ...(p.label ? { alternateName: p.label[ctx.lang] } : {}),
    url: p.url,
    description,
    ...(logo ? { logo } : {}),
    ...(p.sameAs?.length ? { sameAs: p.sameAs } : {}),
  };
}

/* ---------- riders ---------- */

export interface PersonInput {
  rider: Rider;
  slug: string;
  pageUrl: string;
  description: string;
  jobTitle: string;
  /** Absolute URL of the portrait download, when the photo exists. */
  image: string | null;
}

/** Confirmed external pages of a rider: Instagram, the results profile, PCS / FirstCycling / UCI. */
export function riderSameAs(r: Rider): string[] {
  const out: string[] = [];
  if (r.instagram) out.push(`https://www.instagram.com/${r.instagram}/`);
  if (r.resultsProfile) out.push(r.resultsProfile);
  if (r.profiles && !r.profiles.verify) {
    for (const url of [r.profiles.procyclingstats, r.profiles.firstcycling, r.profiles.uci]) if (url) out.push(url);
  }
  return out;
}

export function person(ctx: Ctx, input: PersonInput): Node {
  const { rider } = input;
  const parts = rider.name.split(/\s+/);
  const first = Math.min(...rider.seasons);
  return {
    '@type': 'Person',
    '@id': ids.rider(ctx, input.slug),
    name: rider.name,
    givenName: parts.slice(0, -1).join(' ') || rider.name,
    familyName: parts.at(-1),
    gender: 'https://schema.org/Female',
    nationality: { '@type': 'Country', name: countryNameEn(rider.nat), identifier: iso2(rider.nat) },
    jobTitle: input.jobTitle,
    description: input.description,
    url: input.pageUrl,
    ...(input.image ? { image: input.image } : {}),
    sameAs: riderSameAs(rider),
    affiliation: ref(ids.team(ctx)),
    memberOf: {
      '@type': 'OrganizationRole',
      memberOf: ref(ids.team(ctx)),
      roleName: input.jobTitle,
      startDate: String(first),
    },
  };
}

/* ---------- races ---------- */

const SPORT: Record<RaceEvent['discipline'], string> = {
  ROAD: 'Road cycling',
  TTT: 'Road cycling',
  TRACK: 'Track cycling',
  CX: 'Cyclo-cross',
  MTB: 'Mountain biking',
};

const STATUS: Record<RaceEvent['status'], string> = {
  confirmed: 'https://schema.org/EventScheduled',
  tbc: 'https://schema.org/EventScheduled',
  cancelled: 'https://schema.org/EventCancelled',
};

export interface EventInput {
  event: RaceEvent & { start: string; end: string };
  slug: string;
  pageUrl: string;
  description: string;
  /** Riders of the team who appear in this race's results. */
  riders: { rider: Rider; slug: string }[];
}

export function sportsEvent(ctx: Ctx, { event: e, slug, pageUrl, description, riders }: EventInput): Node {
  const place = raceLocation(e, ctx.lang);
  return {
    '@type': 'SportsEvent',
    '@id': ids.race(ctx, e.season, slug),
    name: raceName(e, ctx.lang),
    description,
    url: pageUrl,
    startDate: e.start,
    endDate: e.end,
    eventStatus: STATUS[e.status],
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    sport: SPORT[e.discipline],
    location: {
      '@type': 'Place',
      name: [place, countryNameEn(e.country)].filter(Boolean).join(', '),
      address: { '@type': 'PostalAddress', addressCountry: iso2(e.country), ...(place ? { addressLocality: place } : {}) },
    },
    ...(e.organizer ? { organizer: { '@type': 'Organization', name: e.organizer.name, ...(e.organizer.url ? { url: e.organizer.url } : {}) } } : {}),
    competitor: [ref(ids.team(ctx)), ...riders.map(({ rider, slug: s }) => ({ '@type': 'Person', '@id': ids.rider(ctx, s), name: rider.name }))],
  };
}

/** Riders (with profile slugs) who appear in a set of result rows, in order of first appearance. */
export function ridersIn(rows: Pick<Result, 'rider'>[], riders: { rider: Rider; slug: string }[]) {
  const byName = new Map(riders.map((r) => [r.rider.name, r]));
  return [...new Set(rows.map((r) => r.rider))].map((n) => byName.get(n)).filter((r): r is { rider: Rider; slug: string } => Boolean(r));
}

/* ---------- breadcrumbs ---------- */

export function breadcrumbs(items: { name: string; url: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export function graph(nodes: Node[]): Node {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
