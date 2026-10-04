// Page-level structured data: connects the pure builders in jsonld.ts to the site's data and copy.
import { getData } from './data';
import { copy, fill, homePath, plural, type Lang } from './i18n';
import { brandLogoExists, findOriginal, partnerLogoExists } from './images';
import { breadcrumbs, person, ridersIn, sportsEvent, teamFull, teamStub, website, type Ctx, type Node } from './jsonld';
import { bestResult, categoryLabel, stageLabel } from './results';
import { DOWNLOADS, racePath, riderPath, route } from './routes';
import type { Partner, Rider } from './schemas';
import { pickPartners, raceLocation, raceName, type RaceEvent } from './season';
import { TEAM } from './team';
import { typo } from './text';
import { officialRosterView, profileRiders, racePages, type RacePageView } from './view';

const origin = TEAM.website.replace(/\/$/, '');
export const ctxFor = (lang: Lang): Ctx => ({ origin, lang });
const abs = (path: string) => new URL(path, origin + '/').href;
const logo = () => (brandLogoExists() ? abs('/brand/logo.svg') : null);

/** What every page carries: the website and a short team node, so references to #team resolve. */
export function baseNodes(lang: Lang): Node[] {
  const ctx = ctxFor(lang);
  const homeUrl = abs(homePath(lang));
  return [website(ctx, { team: TEAM, homeUrl }), teamStub(ctx, { team: TEAM, homeUrl, logo: logo() })];
}

/** The partners structured data presents: the same list the partners page thanks or presents. */
function currentPartners(): Partner[] {
  const { site, partners } = getData();
  return pickPartners(partners, site.currentSeason, site.partnersConfirmed).items;
}

/** The full SportsTeam with its roster, coaches, staff, sponsors and the UCI (home, partners, media). */
export function fullTeamNodes(lang: Lang): Node[] {
  const ctx = ctxFor(lang);
  const t = copy(lang);
  const { staff } = getData();
  const roster = officialRosterView();
  const slugs = new Map(profileRiders().map((p) => [p.rider.name, p.slug]));
  const rosterSeason = roster.season;
  return teamFull(ctx, {
    team: TEAM,
    homeUrl: abs(homePath(lang)),
    description: fill(t.mediaPage.boilerplateText, { founded: TEAM.founded, season: rosterSeason ?? '', riders: plural(t.mediaPage.riderCount, roster.items.length, lang) }, lang),
    logo: logo(),
    riders: roster.items.map((rider) => ({ rider, slug: slugs.get(rider.name)! })),
    staff: rosterSeason === null ? [] : staff.filter((s) => s.seasons.includes(rosterSeason)),
    partners: currentPartners(),
    tierLabel: (tier) => t.partners.tierSingular[tier],
    partnerDescription: (p) => fill(t.partners.about, { tier: t.partners.tierSingular[p.tier] }, lang),
    partnerLogo: (p) => (partnerLogoExists(p.logo) ? abs(`/partners/${p.logo}`) : null),
  });
}

/** "Sofia Ungerová – zawodniczka drużyny Continental, Mat Atom Deweloper Wrocław. Kategoria: U23. Kraj: Słowacja." */
export function riderSummary(rider: Rider, lang: Lang): string {
  const t = copy(lang);
  const countries = t.calendar.countryNames as Record<string, string>;
  return fill(t.rider.summary, { name: rider.name, squad: t.rider.squad[rider.squad], category: t.rider.category[rider.category], country: countries[rider.nat] ?? rider.nat }, lang);
}

/** Person + breadcrumbs for a rider profile. */
export function riderNodes(lang: Lang, rider: Rider, slug: string): Node[] {
  const ctx = ctxFor(lang);
  const t = copy(lang);
  const original = findOriginal('riders', rider.photo);
  const pageUrl = abs(riderPath(lang, slug));
  return [
    person(ctx, {
      rider,
      slug,
      pageUrl,
      jobTitle: t.rider.jobTitle,
      description: riderSummary(rider, lang),
      image: original ? abs(DOWNLOADS.portrait(original.name)) : null,
    }),
    breadcrumbs([
      { name: t.nav.home, url: abs(homePath(lang)) },
      { name: t.nav.team, url: abs(route(lang, 'team')) },
      { name: rider.name, url: pageUrl },
    ]),
  ];
}

/* ---------- races ---------- */

/** Where a race is, in words: "Kortrijk, Belgium" / "Kortrijk, Belgia". */
export function raceWhere(e: RaceEvent, lang: Lang): string {
  const countries = copy(lang).calendar.countryNames as Record<string, string>;
  return [raceLocation(e, lang), countries[e.country] ?? e.country].filter(Boolean).join(', ');
}

/** "25–29 czerwca 2026" / "25–29 June 2026": full month and year, so a quoted sentence stays unambiguous. */
export function raceDates(e: { start: string; end: string }, lang: Lang): string {
  const locale = copy(lang).meta.locale;
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(new Date(iso + 'T00:00:00Z'));
  const full = (iso: string) => fmt(iso, { day: 'numeric', month: 'long', year: 'numeric' }).replace(/ r\.$/, '');
  if (e.start === e.end) return full(e.start);
  if (e.start.slice(0, 7) === e.end.slice(0, 7)) return `${+e.start.slice(8, 10)}–${full(e.end)}`;
  if (e.start.slice(0, 4) === e.end.slice(0, 4)) return `${fmt(e.start, { day: 'numeric', month: 'long' })} – ${full(e.end)}`;
  return `${full(e.start)} – ${full(e.end)}`;
}

/** The answer-first sentence that opens a race page and becomes its structured-data description. */
export function raceSummary(page: RacePageView, lang: Lang, today: string): string {
  const t = copy(lang);
  const tr = t.race;
  const e = page.event as RaceEvent & { start: string; end: string };
  const vars = { race: raceName(e, lang), dates: raceDates(e, lang), where: raceWhere(e, lang), season: page.season };
  if (e.status === 'cancelled') return fill(tr.summaryCancelled, vars, lang);
  if (e.start > today) return fill(tr.summaryUpcoming, vars, lang);
  const classified = page.rows.filter((r) => r.position !== null);
  if (!classified.length) return fill(tr.summaryPastNone, vars, lang);
  const top = bestResult(classified, page.events)!;
  const place = lang === 'pl' ? String(top.position) : top.position! <= 3 ? t.results.placeName[String(top.position) as '1' | '2' | '3'] : fill(t.results.placeName.other, { n: top.position! });
  const detail = [stageLabel(top.stage, t.results.stages), categoryLabel(top.category, t.results.categories)].filter(Boolean).join(', ');
  const best = fill(tr.best, { place, rider: top.rider, detail: detail ? ` (${detail})` : '' });
  return fill(tr.summaryPast, { ...vars, count: plural(tr.placings, classified.length, lang), best }, lang);
}

export function raceNodes(lang: Lang, page: RacePageView, today: string): Node[] {
  const ctx = ctxFor(lang);
  const t = copy(lang);
  const pageUrl = abs(racePath(lang, page.season, page.slug));
  const name = typo(lang, raceName(page.event, lang));
  return [
    sportsEvent(ctx, {
      event: page.event as RaceEvent & { start: string; end: string },
      slug: page.slug,
      pageUrl,
      description: raceSummary(page, lang, today),
      riders: ridersIn(page.rows, profileRiders()),
    }),
    breadcrumbs([
      { name: t.nav.home, url: abs(homePath(lang)) },
      { name: t.nav.calendar, url: abs(route(lang, 'calendar')) },
      { name: `${name} ${page.season}`, url: pageUrl },
    ]),
  ];
}

/** SportsEvent nodes for the current season's confirmed races that are still to come (home and calendar). */
export function upcomingEventNodes(lang: Lang): Node[] {
  const { site, today } = getData();
  return racePages()
    .filter((p) => p.season === site.currentSeason && p.event.status === 'confirmed' && p.event.onTeamCalendar !== false && p.event.end! >= today)
    .map((p) => raceNodes(lang, p, today)[0]);
}

