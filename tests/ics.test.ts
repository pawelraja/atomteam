import { describe, expect, it } from 'vitest';
import { toICS } from '../src/lib/ics';
import { normalizeCalendar } from '../src/lib/season';

const events = normalizeCalendar(2027, [
  { name: 'Gracia', location: null, country: 'CZE', discipline: 'ROAD', class: '2.2', status: 'confirmed', start: '2027-04-29', end: '2027-05-02' },
  { name: 'Umag Classic Ladies', location: 'Umag', country: 'CRO', discipline: 'ROAD', class: '1.2', status: 'confirmed', start: '2027-03-03', end: '2027-03-03' },
  { name: 'Scheldeprijs', location: null, country: 'BEL', discipline: 'ROAD', class: '1.Pro', status: 'tbc', month: 4 },
  { name: 'Cancelled', location: null, country: 'POL', discipline: 'ROAD', class: null, status: 'cancelled', start: '2027-03-10', end: '2027-03-10' },
  { name: 'Training camp', location: null, country: 'CRO', discipline: 'ROAD', class: null, status: 'confirmed', type: 'training', start: '2027-02-01', end: '2027-02-10' },
]);

const opts = { calendarName: 'MADW 2027', domain: 'atomteam.pl', now: new Date('2026-11-01T10:00:00Z') };

describe('toICS', () => {
  const ics = toICS(events, opts);

  it('includes confirmed races only', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).not.toContain('Scheldeprijs');
    expect(ics).not.toContain('Cancelled');
    expect(ics).not.toContain('Training camp');
  });

  it('uses all-day dates with an exclusive end, across months', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20270429');
    expect(ics).toContain('DTEND;VALUE=DATE:20270503');
    expect(ics).toContain('DTSTART;VALUE=DATE:20270303\r\nDTEND;VALUE=DATE:20270304');
  });

  it('uses stable UIDs that do not depend on dates', () => {
    expect(ics).toContain('UID:2027-gracia-cze@atomteam.pl');
    const moved = normalizeCalendar(2027, [
      { name: 'Gracia', location: null, country: 'CZE', discipline: 'ROAD', class: '2.2', status: 'confirmed', start: '2027-05-06', end: '2027-05-09' },
    ]);
    expect(toICS(moved, opts)).toContain('UID:2027-gracia-cze@atomteam.pl');
  });

  it('is a valid envelope with CRLF line endings and escaped text', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('LOCATION:Umag\\, CRO');
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });

  it('folds long lines with multi-byte characters', () => {
    const long = normalizeCalendar(2027, [
      { name: 'Mistrzostwa Polski Dwójek i Drużyn na czas — Górskie Szosowe Mistrzostwa Polski Żółć', location: 'Łódź', country: 'POL', discipline: 'TTT', class: 'NCh.', status: 'confirmed', start: '2027-09-11', end: '2027-09-12' },
    ]);
    const out = toICS(long, opts);
    const lines = out.split('\r\n');
    expect(lines.every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    // Unfolding restores the original text.
    expect(out.replace(/\r\n /g, '')).toContain('SUMMARY:Mistrzostwa Polski Dwójek i Drużyn na czas — Górskie Szosowe Mistrzostwa Polski Żółć');
  });

  it('produces an empty but valid calendar when nothing is confirmed', () => {
    const empty = toICS(events.filter((e) => e.status === 'tbc'), opts);
    expect(empty).not.toContain('BEGIN:VEVENT');
    expect(empty).toContain('END:VCALENDAR');
  });
});
