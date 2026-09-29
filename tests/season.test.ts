import { describe, expect, it } from 'vitest';
import type { CalendarEntry } from '../src/lib/schemas';
import {
  daysBetween,
  entryId,
  eventState,
  formatRange,
  groupByMonth,
  monthLabel,
  nextRace,
  nextRaceView,
  normalizeCalendar,
  pickPartners,
  pickRoster,
  presentationCountdown,
  recapSeason,
  rowStatus,
  seasonNumber,
  seasonStats,
  sectionOrder,
  todayISO,
} from '../src/lib/season';

const race = (o: Partial<CalendarEntry> & { name: string }): CalendarEntry => ({
  location: null,
  country: 'POL',
  discipline: 'ROAD',
  class: null,
  status: 'confirmed',
  ...o,
});

const cal2027 = normalizeCalendar(2027, [
  race({ name: 'Training camp', start: '2027-02-01', end: '2027-02-20', type: 'training', country: 'CRO' }),
  race({ name: 'Umag Classic Ladies', start: '2027-03-03', end: '2027-03-03', class: '1.2', country: 'CRO' }),
  race({ name: 'Gracia', start: '2027-04-29', end: '2027-05-02', class: '2.2', country: 'CZE' }),
  race({ name: 'Scheldeprijs', month: 4, status: 'tbc', class: '1.Pro', country: 'BEL' }),
  race({ name: 'Cancelled Classic', start: '2027-03-10', end: '2027-03-10', status: 'cancelled' }),
  race({ name: 'Tour de Pologne Women', month: 7, status: 'tbc', class: '2.Pro' }),
]);

describe('dates', () => {
  it('computes today in Warsaw, not UTC', () => {
    // 23:30 UTC on 31 Dec is already 1 Jan in Warsaw.
    expect(todayISO(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });
  it('counts days across months and years', () => {
    expect(daysBetween('2027-02-27', '2027-03-02')).toBe(3);
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
  });
});

describe('formatRange', () => {
  it('formats one-day, same-month, cross-month and cross-year ranges', () => {
    expect(formatRange('2027-03-04', '2027-03-04', 'en-GB')).toBe('4 Mar');
    expect(formatRange('2027-03-04', '2027-03-08', 'en-GB')).toBe('4–8 Mar');
    expect(formatRange('2027-04-29', '2027-05-02', 'en-GB')).toBe('29 Apr – 2 May');
    expect(formatRange('2026-12-30', '2027-01-02', 'en-GB')).toBe('30 Dec 2026 – 2 Jan 2027');
  });
  it('labels months in the site style', () => {
    expect(monthLabel(3, 'en-GB')).toBe('03/ March');
  });
});

describe('multi-day ranges across months', () => {
  const gracia = cal2027.find((e) => e.name === 'Gracia')!;
  it('groups under the start month', () => {
    const april = groupByMonth(cal2027).find((g) => g.month === 4)!;
    expect(april.events.map((e) => e.name)).toContain('Gracia');
  });
  it('is live on every day of the range, including after the month changes', () => {
    expect(eventState(gracia, '2027-04-28')).toBe('upcoming');
    expect(eventState(gracia, '2027-04-29')).toBe('live');
    expect(eventState(gracia, '2027-05-02')).toBe('live');
    expect(eventState(gracia, '2027-05-03')).toBe('past');
  });
  it('stays the next race while it is running', () => {
    expect(nextRace(cal2027, '2027-05-01')?.name).toBe('Gracia');
  });
});

describe('past / upcoming state', () => {
  it('handles dated entries', () => {
    const umag = cal2027.find((e) => e.name === 'Umag Classic Ladies')!;
    expect(eventState(umag, '2027-03-02')).toBe('upcoming');
    expect(eventState(umag, '2027-03-03')).toBe('live');
    expect(eventState(umag, '2027-03-04')).toBe('past');
  });
  it('handles month-only TBC entries by month', () => {
    const tbc = cal2027.find((e) => e.name === 'Scheldeprijs')!;
    expect(eventState(tbc, '2027-03-31')).toBe('upcoming');
    expect(eventState(tbc, '2027-04-15')).toBe('live');
    expect(eventState(tbc, '2027-05-01')).toBe('past');
  });
  it('sorts TBC entries after dated entries of the same month', () => {
    const april = groupByMonth(cal2027).find((g) => g.month === 4)!;
    expect(april.events.map((e) => e.name)).toEqual(['Gracia', 'Scheldeprijs']);
  });
});

describe('next confirmed race', () => {
  it('skips training, TBC and cancelled entries', () => {
    expect(nextRace(cal2027, '2027-01-10')?.name).toBe('Umag Classic Ladies');
    expect(nextRace(cal2027, '2027-03-05')?.name).toBe('Gracia'); // not the cancelled race on 10 Mar
  });
  it('never returns a TBC entry', () => {
    const onlyTbc = normalizeCalendar(2027, [race({ name: 'X', month: 3, status: 'tbc' })]);
    expect(nextRace(onlyTbc, '2027-01-01')).toBeNull();
  });
  it('reports days to go and live state', () => {
    const view = nextRaceView(cal2027, 2027, '2027-02-24');
    expect(view).toMatchObject({ kind: 'next', daysToGo: 7, live: false });
    expect(nextRaceView(cal2027, 2027, '2027-03-03')).toMatchObject({ kind: 'next', daysToGo: 0, live: true });
  });
});

describe('TBC and season-complete states', () => {
  const draft = normalizeCalendar(2027, [
    race({ name: 'A', month: 3, status: 'tbc' }),
    race({ name: 'B', month: 5, status: 'tbc' }),
    race({ name: 'Camp', month: 2, status: 'tbc', type: 'training' }),
  ]);
  it('shows "coming soon" with the first TBC race month when nothing is confirmed', () => {
    expect(nextRaceView(draft, 2027, '2026-11-15')).toEqual({ kind: 'soon', firstMonth: 3 });
  });
  it('ignores TBC months that have already passed', () => {
    expect(nextRaceView(draft, 2027, '2027-04-02')).toEqual({ kind: 'soon', firstMonth: 5 });
  });
  it('shows "coming soon" without a month for an empty calendar', () => {
    expect(nextRaceView([], 2027, '2026-11-15')).toEqual({ kind: 'soon', firstMonth: null });
  });
  it('is complete once every confirmed race is past and nothing is pending', () => {
    expect(nextRaceView(cal2027, 2027, '2027-08-01')).toEqual({ kind: 'complete' });
  });
  it('is complete once the season year is over, even with stale TBC entries', () => {
    expect(nextRaceView(draft, 2027, '2028-01-05')).toEqual({ kind: 'complete' });
  });
});

describe('stable ids', () => {
  it('ignore dates so confirming a TBC race keeps its id', () => {
    const tbc = race({ name: 'Ronde de Mouscron', location: 'Mouscron', month: 4, status: 'tbc' });
    const confirmed = { ...tbc, start: '2027-04-05', end: '2027-04-05', status: 'confirmed' as const };
    expect(entryId(tbc)).toBe(entryId(confirmed));
    expect(entryId(tbc)).toBe('ronde-de-mouscron-mouscron');
  });
  it('transliterate Polish characters', () => {
    expect(entryId(race({ name: 'Ślężański Mnich', month: 4, status: 'tbc' }))).toBe('slezanski-mnich-pol');
  });
});

describe('verify flag', () => {
  it('hides the race class until checked', () => {
    const [e] = normalizeCalendar(2026, [race({ name: 'X', start: '2026-01-01', end: '2026-01-01', class: 'NCh.', verify: true })]);
    expect(e.cls).toBeNull();
  });
});

describe('season stats', () => {
  it('counts only confirmed races', () => {
    expect(seasonStats(cal2027)).toEqual({ races: 2, raceDays: 5, countries: 2, uciRaces: 2 });
  });
});

describe('season model', () => {
  it('computes the season number', () => {
    expect(seasonNumber({ currentSeason: 2027, foundedYear: 2016 })).toBe(12);
    expect(seasonNumber({ currentSeason: 2016, foundedYear: 2016 })).toBe(1);
  });

  it('orders sections by phase', () => {
    const pre = sectionOrder('preseason');
    expect(pre.indexOf('partners')).toBe(pre.indexOf('recap') + 1);
    expect(pre.indexOf('partner-cta')).toBe(pre.indexOf('partners') + 1);
    const racing = sectionOrder('racing');
    expect(racing.slice(2, 4)).toEqual(['next-race', 'calendar']);
    expect(sectionOrder('offseason')[1]).toBe('recap');
    for (const p of ['preseason', 'racing', 'offseason'] as const) {
      expect(new Set(sectionOrder(p)).size).toBe(11);
    }
  });

  it('recaps the previous season, or the current one in the off-season', () => {
    expect(recapSeason({ currentSeason: 2027, phase: 'preseason' })).toBe(2026);
    expect(recapSeason({ currentSeason: 2027, phase: 'racing' })).toBe(2026);
    expect(recapSeason({ currentSeason: 2027, phase: 'offseason' })).toBe(2027);
  });
});

describe('team presentation countdown', () => {
  const tp = { date: '2027-01-20', place: 'Wrocław', url: null };
  it('counts down to the day', () => {
    expect(presentationCountdown(tp, '2027-01-10')?.daysToGo).toBe(10);
    expect(presentationCountdown(tp, '2027-01-20')?.daysToGo).toBe(0);
  });
  it('expires the day after', () => {
    expect(presentationCountdown(tp, '2027-01-21')).toBeNull();
  });
  it('is absent when not set', () => {
    expect(presentationCountdown(null, '2027-01-10')).toBeNull();
  });
});

describe('roster fallback', () => {
  const riders = [
    { name: 'A', seasons: [2026] },
    { name: 'B', seasons: [2026, 2027] },
    { name: 'C', seasons: [2027] },
  ];
  it('shows current-season riders once any are listed', () => {
    expect(pickRoster(riders, 2027)).toMatchObject({ season: 2027, isCurrent: true });
    expect(pickRoster(riders, 2027).items.map((r) => r.name)).toEqual(['B', 'C']);
  });
  it('falls back to the latest previous season when nobody is listed for the current one', () => {
    const only2026 = riders.map((r) => ({ ...r, seasons: [2026] }));
    const pick = pickRoster(only2026, 2027);
    expect(pick).toMatchObject({ season: 2026, isCurrent: false });
    expect(pick.items).toHaveLength(3);
  });
  it('returns nothing when there is no data at all', () => {
    expect(pickRoster([], 2027)).toEqual({ season: null, items: [], isCurrent: false });
  });
});

describe('partner fallback', () => {
  const partners = [
    { name: 'Old', seasons: [2026] },
    { name: 'Both', seasons: [2026, 2027] },
    { name: 'New', seasons: [2027] },
  ];
  it('never presents partners as current until the list is confirmed', () => {
    const pick = pickPartners(partners, 2027, false);
    expect(pick).toMatchObject({ season: 2026, isCurrent: false });
    expect(pick.items.map((p) => p.name)).toEqual(['Old', 'Both']);
  });
  it('shows current partners once confirmed', () => {
    const pick = pickPartners(partners, 2027, true);
    expect(pick).toMatchObject({ season: 2027, isCurrent: true });
    expect(pick.items.map((p) => p.name)).toEqual(['Both', 'New']);
  });
  it('falls back to the previous season when confirmed but nobody has the current season yet', () => {
    const pick = pickPartners([{ name: 'Old', seasons: [2026] }], 2027, true);
    expect(pick).toMatchObject({ season: 2026, isCurrent: false });
  });
});

describe('row status', () => {
  it('labels next, live, TBC, cancelled and past rows', () => {
    const next = nextRace(cal2027, '2027-03-01')!;
    const by = (name: string) => cal2027.find((e) => e.name === name)!;
    expect(rowStatus(by('Umag Classic Ladies'), '2027-03-01', next.id)).toBe('next');
    expect(rowStatus(by('Gracia'), '2027-03-01', next.id)).toBe('upcoming');
    expect(rowStatus(by('Scheldeprijs'), '2027-03-01', next.id)).toBe('tbc');
    expect(rowStatus(by('Scheldeprijs'), '2027-05-01', null)).toBe('past');
    expect(rowStatus(by('Cancelled Classic'), '2027-03-01', next.id)).toBe('cancelled');
    expect(rowStatus(by('Training camp'), '2027-02-05', next.id)).toBe('live');
  });
});
