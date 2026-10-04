// Public, read-only data files (/data/*.json) for developers and AI agents. Generated from
// src/data at build time; unconfirmed values are left out or flagged, exactly as on the pages.
import { iso2 } from './countries';
import { getData } from './data';
import { wheelsFor } from './equipment';
import { teamFacts } from './facts';
import { lastmod, type SourceKey } from './lastmod';
import { hasRacePage } from './races';
import { racePath, riderPath, ROUTES } from './routes';
import { isConfirmedRace, raceLocation, raceName } from './season';
import { legalName, teamProfiles, TEAM, uciCode } from './team';
import { profileRiders, racePages } from './view';

const abs = (p: string) => new URL(p, TEAM.website).href;
const both = (f: (lang: 'pl' | 'en') => string) => ({ pl: abs(f('pl')), en: abs(f('en')) });

export const DATA_FILES = {
  team: '/data/team.json',
  riders: '/data/riders.json',
  races: '/data/races.json',
  results: '/data/results.json',
} as const;
export type DataFile = keyof typeof DATA_FILES;

const KIND: Record<DataFile, SourceKey> = { team: 'team', riders: 'rider', races: 'race', results: 'race' };

function envelope(file: DataFile, data: unknown) {
  return {
    version: 1,
    name: `${TEAM.name}: ${file}`,
    source: abs('/'),
    documentation: both((l) => ROUTES.developers[l]),
    updated: lastmod(KIND[file]),
    attribution: `Please name ${TEAM.name} and link ${abs('/')} when you use this data.`,
    data,
  };
}

function teamData() {
  const f = teamFacts();
  return {
    name: TEAM.name,
    legalName: legalName(),
    alternateNames: TEAM.alternateNames,
    uciCode: uciCode(),
    uciStatus: TEAM.uciStatus.label,
    founded: TEAM.founded,
    city: TEAM.city,
    country: TEAM.country,
    gender: TEAM.gender,
    disciplines: TEAM.disciplines,
    website: TEAM.website,
    email: TEAM.contact.email,
    social: TEAM.social,
    profiles: teamProfiles(),
    asOf: f.asOf,
    roster: { season: f.roster.season, riders: f.roster.split.total, U19: f.roster.split.U19, U23: f.roster.split.U23, Elite: f.roster.split.Elite, staff: f.roster.staff },
    honours: f.honours,
    wheels: f.wheels,
  };
}

function ridersData() {
  return profileRiders().map(({ rider: r, slug }) => ({
    slug,
    name: r.name,
    nationality: { uci: r.nat, iso: iso2(r.nat) },
    squad: r.squad,
    category: r.category,
    seasons: r.seasons,
    instagram: r.instagram ?? null,
    resultsProfile: r.resultsProfile ?? null,
    profiles: r.profiles && !r.profiles.verify ? { procyclingstats: r.profiles.procyclingstats, firstcycling: r.profiles.firstcycling, uci: r.profiles.uci } : null,
    pages: both((l) => riderPath(l, slug)),
  }));
}

function racesData() {
  const { raceEntries, equipment } = getData();
  const pages = racePages();
  return [...raceEntries]
    .sort(([a], [b]) => a - b)
    .flatMap(([season, list]) =>
      list
        .filter((e) => !e.training)
        .map((e) => {
          const page = pages.find((p) => p.season === season && p.event.id === e.id);
          return {
            id: e.id,
            season,
            name: { pl: raceName(e, 'pl'), en: raceName(e, 'en') },
            start: e.start,
            end: e.end,
            month: e.month,
            status: e.status,
            location: e.location ? { pl: raceLocation(e, 'pl'), en: raceLocation(e, 'en') } : null,
            country: e.country ? { uci: e.country, iso: iso2(e.country) } : null,
            discipline: e.discipline,
            class: e.cls,
            nationalChampionship: e.nationalChampionship,
            onTeamCalendar: e.onTeamCalendar !== false,
            wheels: equipment.wheels.disciplinesVerify ? null : wheelsFor(e),
            pages: page && hasRacePage(e) ? both((l) => racePath(l, season, page.slug)) : null,
            ics: isConfirmedRace(e) && e.onTeamCalendar !== false ? abs(`/ics/${season}/${e.id}.ics`) : null,
          };
        }),
    );
}

function resultsData() {
  const { results, events } = getData();
  const slugs = new Map(profileRiders().map((p) => [p.rider.name, p.slug]));
  const pages = racePages();
  return [...results]
    .sort(([a], [b]) => b - a)
    .flatMap(([season, rows]) =>
      rows.map((r) => {
        const e = events.get(season)?.get(r.eventId);
        const page = pages.find((p) => p.season === season && p.event.id === r.eventId);
        return {
          season,
          eventId: r.eventId,
          race: e ? { pl: e.name, en: e.nameEn ?? e.name } : null,
          racePage: page ? abs(racePath('en', season, page.slug)) : null,
          date: r.date,
          stage: r.stage,
          category: r.category,
          rider: r.rider,
          riderSlug: slugs.get(r.rider) ?? null,
          position: r.position,
          status: r.status,
          source: r.source,
          /** false until the team has signed the row off; every row links to its source. */
          checkedByTeam: !r.verify,
        };
      }),
    );
}

const BUILDERS: Record<DataFile, () => unknown> = { team: teamData, riders: ridersData, races: racesData, results: resultsData };

export function dataFile(file: DataFile): string {
  return JSON.stringify(envelope(file, BUILDERS[file]()), null, 2) + '\n';
}

export function dataRoute(file: DataFile) {
  return () => new Response(dataFile(file), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
