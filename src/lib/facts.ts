// The headline facts the answer-first summaries and the FAQ quote. Everything is computed from
// src/data at build time, so an answer can never drift from the pages it summarises.
import { getData } from './data';
import { copy, fill, plural, type Lang } from './i18n';
import { listJoin, rosterSplit } from './showcase';
import { isConfirmedRace, pickPartners } from './season';
import { TEAM } from './team';
import { numbersView, officialRosterView, resultsView } from './view';
import type { Partner, Rider } from './schemas';

export function teamFacts() {
  const { site, calendars, partners, staff, equipment } = getData();
  const roster = officialRosterView();
  const split = rosterSplit(roster.items);
  const byCategory = (c: Rider['category']) => roster.items.filter((r) => r.category === c).map((r) => r.name);
  const crew = roster.season === null ? [] : staff.filter((s) => s.seasons.includes(roster.season!));
  const numbers = numbersView();
  const results = resultsView();
  const calendar = (calendars.get(site.currentSeason) ?? []).filter((e) => !e.training);
  const partnerPick = pickPartners(partners, site.currentSeason, site.partnersConfirmed);
  const tier = (t: Partner['tier']) => partnerPick.items.filter((p) => p.tier === t).map((p) => p.name);
  return {
    asOf: site.factsAsOf,
    founded: TEAM.founded,
    roster: {
      season: roster.season,
      split,
      names: { U19: byCategory('U19'), U23: byCategory('U23'), Elite: byCategory('Elite') },
      staff: crew.length,
    },
    /** The reviewed season's numbers (2026 while 2027 is prepared). */
    numbers,
    honours: results ? { season: results.season, ...results.honours } : null,
    calendar: {
      season: site.currentSeason,
      total: calendar.length,
      confirmed: calendar.filter(isConfirmedRace).length,
      provisional: !site.calendarConfirmed,
    },
    partners: {
      season: partnerPick.season,
      isCurrent: partnerPick.isCurrent,
      count: partnerPick.items.length,
      title: tier('title'),
      main: tier('main'),
      technical: tier('technical'),
      institutional: tier('institutional'),
    },
    wheels: equipment.wheels.partner,
    instagramHandle: TEAM.social.instagram.replace(/\/$/, '').split('/').pop()!,
  };
}

export type TeamFacts = ReturnType<typeof teamFacts>;

/** "4 października 2026" / "4 October 2026". */
export function formatAsOf(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(copy(lang).meta.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(iso + 'T00:00:00Z'))
    .replace(/ r\.$/, '');
}

/** Values every summary and FAQ answer may use, already in the page language. */
export function factVars(lang: Lang) {
  const f = teamFacts();
  const t = copy(lang);
  const c = t.faq.counts;
  const join = (names: string[]) => listJoin(names, t.meta.locale);
  const n = f.numbers;
  return {
    asOf: formatAsOf(f.asOf, lang),
    founded: f.founded,
    rosterSeason: f.roster.season ?? '',
    riders: plural(t.mediaPage.riderCount, f.roster.split.total, lang),
    u19: f.roster.split.U19,
    u23: f.roster.split.U23,
    elite: f.roster.split.Elite,
    u19Names: join(f.roster.names.U19),
    u23Names: join(f.roster.names.U23),
    eliteNames: join(f.roster.names.Elite),
    staff: plural(c.staff, f.roster.staff, lang),
    juniors: plural(c.juniors, f.roster.split.junior, lang),
    resultsSeason: f.honours?.season ?? '',
    titles: plural(c.titles, f.honours?.titles ?? 0, lang),
    medals: plural(c.medals, f.honours?.medals ?? 0, lang),
    statsSeason: n?.season ?? '',
    statsRiders: plural(t.mediaPage.riderCount, n?.riders.total ?? 0, lang),
    races: plural(c.races, n?.races ?? 0, lang),
    countries: plural(c.countries, n?.countries ?? 0, lang),
    calSeason: f.calendar.season,
    calRaces: plural(c.races, f.calendar.total, lang),
    calSentence: fill(f.calendar.provisional ? t.faq.calendarProvisional : t.faq.calendarConfirmed, { calSeason: f.calendar.season, calRaces: plural(c.races, f.calendar.total, lang) }, lang),
    partnerSeason: f.partners.season ?? '',
    partnerCount: plural(c.partners, f.partners.count, lang),
    titleSponsor: join(f.partners.title),
    mainSponsors: join(f.partners.main),
    technicalPartners: join(f.partners.technical),
    wheels: f.wheels,
    instagram: `@${f.instagramHandle}`,
  };
}
