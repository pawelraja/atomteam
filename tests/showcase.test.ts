import { describe, expect, it } from 'vitest';
import { getData } from '../src/lib/data';
import {
  countHonours,
  countriesRaced,
  disciplinesRaced,
  isPolishChampionshipRow,
  resultLabel,
  sortFeatured,
  stageLabel,
  teamLine,
  type EventIndex,
  type EventInfo,
} from '../src/lib/results';
import { copy } from '../src/lib/i18n';
import type { Result } from '../src/lib/schemas';
import { normalizeCalendar } from '../src/lib/season';
import {
  formatBytes,
  isContactComplete,
  officialRoster,
  rosterSplit,
  seasonNumbers,
  statusBar,
  teaserMonths,
  topUciRaces,
  wordCount,
} from '../src/lib/showcase';

const ev = (o: Partial<EventInfo> & { id: string }): EventInfo => ({
  name: o.id,
  nameEn: null,
  short: null,
  country: 'POL',
  discipline: 'ROAD',
  cls: null,
  nationalChampionship: false,
  onTeamCalendar: true,
  ...o,
});
const row = (o: Partial<Result> & { eventId: string }): Result => ({
  date: '2026-06-25',
  stage: 'Road race',
  category: 'Elite',
  rider: 'A',
  position: 1,
  status: 'Classified',
  note: null,
  source: 'https://example.com',
  featured: false,
  verify: true,
  ...o,
});

describe('title and medal counting (same rules as the workbook)', () => {
  const index: EventIndex = new Map([
    ['NC', ev({ id: 'NC', nationalChampionship: true })],
    ['CRIT', ev({ id: 'CRIT', nationalChampionship: true })],
    ['SVK', ev({ id: 'SVK', nationalChampionship: true, country: 'SVK' })],
    ['UCI', ev({ id: 'UCI', cls: '1.1', country: 'BEL' })],
  ]);

  it('counts a team title once, however many riders share it', () => {
    const rows = ['A', 'B', 'C', 'D'].map((rider) => row({ eventId: 'NC', stage: 'Team TT', rider }));
    expect(countHonours(rows, index)).toEqual({ titles: 1, medals: 1 });
  });

  it('counts different stages, categories and places separately', () => {
    const rows = [
      row({ eventId: 'NC', stage: 'ITT', category: 'U23' }),
      row({ eventId: 'NC', stage: 'ITT', category: 'Elite', position: 2 }),
      row({ eventId: 'NC', stage: 'Road race', category: 'U23', position: 3 }),
      row({ eventId: 'NC', stage: 'Road race', category: 'U23', position: 4 }),
    ];
    expect(countHonours(rows, index)).toEqual({ titles: 1, medals: 3 });
  });

  it('ignores the criterium final race day, other countries and non-championship races', () => {
    expect(isPolishChampionshipRow(row({ eventId: 'CRIT', stage: 'Criterium final' }), index)).toBe(false);
    expect(isPolishChampionshipRow(row({ eventId: 'CRIT', stage: 'MP criterium series – final classification' }), index)).toBe(true);
    expect(countHonours([row({ eventId: 'SVK' }), row({ eventId: 'UCI' })], index)).toEqual({ titles: 0, medals: 0 });
  });

  it('ignores DNFs', () => {
    expect(countHonours([row({ eventId: 'NC', position: null, status: 'DNF' })], index)).toEqual({ titles: 0, medals: 0 });
  });
});

describe('2026 figures from the real data', () => {
  const { results, events, calendars, riders } = getData();
  const rows = results.get(2026)!;
  const index = events.get(2026)!;

  it('has 481 sourced result rows', () => {
    expect(rows).toHaveLength(481);
    expect(rows.filter((r) => r.featured)).toHaveLength(8);
  });

  it('orders the featured rows like the approved design', () => {
    const rows2 = sortFeatured(rows.filter((r) => r.featured), index);
    expect(rows2.map((r) => `${r.rider.split(' ')[1]} ${r.position}`)).toEqual([
      'Ungerová 1', 'Wankiewicz 2', 'Ungerová 3', 'Wankiewicz 9', 'Tracka 3', 'Tracka 1', 'Glinka 1', 'Szczęsna 1',
    ]);
  });

  it('gives 30 Polish national titles and 58 national-championship medals', () => {
    expect(countHonours(rows, index)).toEqual({ titles: 30, medals: 58 });
  });

  it('gives 20 riders (8 U19, 10 U23, 2 Elite), 47 races, 13 countries and 4 disciplines', () => {
    const n = seasonNumbers(calendars, events, results, riders, 2026)!;
    expect(n.season).toBe(2026);
    expect(n.riders).toMatchObject({ total: 20, U19: 8, U23: 10, Elite: 2, continental: 12, junior: 8 });
    expect(n.races).toBe(47);
    expect(n.countries).toBe(13);
    expect(n.disciplines).toEqual(['ROAD', 'TRACK', 'CX', 'MTB']);
  });

  it('steps back to 2026 for the numbers while 2027 has no results', () => {
    expect(seasonNumbers(calendars, events, results, riders, 2027)?.season).toBe(2026);
  });

  it('lists the 2026 top-class UCI races', () => {
    const top = topUciRaces(calendars, 2027)!;
    expect(top.season).toBe(2026);
    expect(top.races.map((e) => e.short ?? e.name)).toEqual(['Scheldeprijs', 'De Brabantse Pijl', 'Lotto Thüringen', 'Tour de Pologne Women']);
  });

  it('has corrected facts from the old site', () => {
    expect(riders.find((r) => r.name === 'Sofia Ungerová')?.nat).toBe('SVK');
    const cal = calendars.get(2026)!;
    expect(cal.find((e) => e.id === 'E01')?.name).toMatch(/^4\. /);
    expect(cal.find((e) => e.id === 'E12')?.cls).toBe('1.2');
  });
});

describe('countries and disciplines raced', () => {
  const index: EventIndex = new Map([
    ['A', ev({ id: 'A', country: 'BEL' })],
    ['B', ev({ id: 'B', country: null, discipline: 'TRACK' })],
    ['C', ev({ id: 'C', discipline: 'TTT' })],
    ['D', ev({ id: 'D', discipline: 'MTB' })],
  ]);
  const rows = ['A', 'B', 'C', 'D'].map((eventId) => row({ eventId }));
  it('skips events without a country', () => {
    expect(countriesRaced(rows, index)).toEqual(['BEL', 'POL']);
  });
  it('counts team time trials as road', () => {
    expect(disciplinesRaced(rows, index)).toEqual(['ROAD', 'TRACK', 'MTB']);
  });
});

describe('result labels', () => {
  const t = copy('pl').results;
  const index: EventIndex = new Map([
    ['NC', ev({ id: 'NC', nationalChampionship: true })],
    ['EC', ev({ id: 'EC', cls: 'ECh.', country: 'GER', discipline: 'TRACK' })],
    ['G', ev({ id: 'G', name: 'Gracia Orlová', cls: '2.2', country: 'CZE' })],
    ['P', ev({ id: 'P', name: 'POREČ Classic Ladies', cls: '1.2', country: 'CRO' })],
  ]);
  it('names stages in the page language', () => {
    expect(stageLabel('Stage 5', t.stages)).toBe('5. etap');
    expect(stageLabel('General classification (final)', t.stages)).toBe('klasyfikacja generalna');
    expect(stageLabel('ITT (Lubań)', t.stages)).toBe('jazda indywidualna na czas');
    expect(stageLabel('Something new', t.stages)).toBe('Something new');
  });
  it('builds the race cell', () => {
    expect(resultLabel(row({ eventId: 'NC', stage: 'ITT', category: 'U23' }), index, 'pl', t)).toBe('MP: jazda indywidualna na czas · U23');
    expect(resultLabel(row({ eventId: 'G', stage: 'Stage 5' }), index, 'pl', t)).toBe('Gracia Orlová (2.2): 5. etap');
    expect(resultLabel(row({ eventId: 'P', stage: 'One-day race' }), index, 'pl', t)).toBe('POREČ Classic Ladies (1.2)');
    expect(resultLabel(row({ eventId: 'EC', stage: 'Team pursuit', category: 'U23' }), index, 'en', copy('en').results)).toBe(
      'EC: team pursuit · U23',
    );
  });
  it('lists team-mates for team events', () => {
    expect(teamLine({ rider: 'Maja Tracka', note: 'Poland: Sipko, Tracka, Szczęsna, Rabażyńska' })).toBe('Sipko, Tracka, Szczęsna, Rabażyńska');
    expect(teamLine({ rider: 'Maja Tracka', note: 'With Szczęsna' })).toBe('Tracka, Szczęsna');
    expect(teamLine({ rider: 'Maja Tracka', note: 'Polish U23 time trial champion' })).toBeNull();
  });
});

describe('rosters', () => {
  const riders = [
    { name: 'A', squad: 'junior' as const, category: 'U19' as const, seasons: [2026] },
    { name: 'B', squad: 'continental' as const, category: 'U23' as const, seasons: [2026, 2027] },
    { name: 'C', squad: 'continental' as const, category: 'Elite' as const, seasons: [2027] },
  ];
  it('splits by squad and category', () => {
    expect(rosterSplit(riders)).toEqual({ total: 3, junior: 1, continental: 2, U19: 1, U23: 1, Elite: 1 });
  });
  it('uses the last complete roster until the new one is confirmed', () => {
    expect(officialRoster(riders, { currentSeason: 2027, rosterConfirmed: false })).toMatchObject({ season: 2026 });
    expect(officialRoster(riders, { currentSeason: 2027, rosterConfirmed: true }).items.map((r) => r.name)).toEqual(['B', 'C']);
  });
});

describe('calendar teaser', () => {
  const cal = normalizeCalendar(2027, [
    { name: 'Camp', month: 1, status: 'tbc', type: 'training', location: null, country: 'CRO', discipline: 'ROAD', class: null },
    ...[1, 2, 3, 4, 5].map((month) => ({ name: `R${month}`, month, status: 'tbc' as const, location: null, country: 'POL', discipline: 'ROAD' as const, class: null })),
  ]);
  it('shows the first four months with races before the season', () => {
    expect(teaserMonths(cal, '2026-11-15').map((m) => m.month)).toEqual([1, 2, 3, 4]);
  });
  it('moves on as months pass, and is empty after the season', () => {
    expect(teaserMonths(cal, '2027-03-10').map((m) => m.month)).toEqual([3, 4, 5]);
    expect(teaserMonths(cal, '2027-12-01')).toEqual([]);
  });
});

describe('status bar', () => {
  const line = { pl: 'Sezon 2027', en: 'Season 2027' };
  it('shows the presentation countdown while it is upcoming, then the status line', () => {
    const site = { statusLine: line, teamPresentation: { date: '2027-01-20', place: 'Wrocław', url: null } };
    expect(statusBar(site, '2027-01-10')).toMatchObject({ kind: 'presentation', daysToGo: 10 });
    expect(statusBar(site, '2027-01-21')).toEqual({ kind: 'line' });
  });
  it('is hidden with neither', () => {
    expect(statusBar({ statusLine: null, teamPresentation: null }, '2027-01-10')).toBeNull();
  });
});

describe('small helpers', () => {
  it('names a contact only with a name and a way to reach them', () => {
    expect(isContactComplete({ name: 'Ala', email: 'a@b.pl' })).toBe(true);
    expect(isContactComplete({ name: 'Ala' })).toBe(false);
    expect(isContactComplete({ email: 'a@b.pl' })).toBe(false);
    expect(isContactComplete(null)).toBe(false);
  });
  it('counts words and formats sizes per locale', () => {
    expect(wordCount('Mat Atom Deweloper Wrocław — to drużyna.')).toBe(6);
    expect(formatBytes(2_400_000, 'pl-PL')).toBe('2,4 MB');
    expect(formatBytes(2_400_000, 'en-GB')).toBe('2.4 MB');
    expect(formatBytes(820_000, 'en-GB')).toBe('820 KB');
  });
});
