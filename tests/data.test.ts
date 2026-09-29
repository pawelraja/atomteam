import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getData, validate } from '../src/lib/data';
import { calendarEntrySchema, riderSchema } from '../src/lib/schemas';

describe('project data files', () => {
  it('all validate', () => {
    const data = getData();
    expect(data.site.currentSeason).toBe(2027);
    expect(data.calendars.get(2026)).toHaveLength(50);
    expect(data.calendars.get(2027)!.every((e) => e.status === 'tbc')).toBe(true);
    expect(data.riders).toHaveLength(20);
  });

  it('hides highlights that still need checking', () => {
    expect(getData().highlights.get(2026)).toEqual([]);
  });
});

describe('readable validation errors', () => {
  it('names the entry, field and fix', () => {
    const bad = [{ name: 'Gracia', location: null, country: 'cz', discipline: 'ROAD', class: null, status: 'confirmed', month: 4 }];
    expect(() => validate(z.array(calendarEntrySchema), bad, 'calendar/2027.json')).toThrow(
      /calendar\/2027\.json[\s\S]*entry #1 \("Gracia"\), field "country": must be a three-letter country code[\s\S]*"confirmed" race needs both "start" and "end"/,
    );
  });

  it('rejects unknown fields (typos)', () => {
    const bad = [{ name: 'A', nat: 'POL', squad: 'continental', photo: 'a.jpg', seasons: [2027], neww: true }];
    expect(() => validate(z.array(riderSchema), bad, 'riders.json')).toThrow(/neww/);
  });
});
