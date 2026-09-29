import { addDays, isConfirmedRace, type RaceEvent } from './season';

const escape = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** RFC 5545 line folding: max 75 octets per line, continuation lines start with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines lose one octet to the space
    if (size + n > limit) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join('\r\n ');
}

const compact = (iso: string) => iso.replace(/-/g, '');

export interface IcsOptions {
  calendarName: string;
  domain: string;
  /** Used for DTSTAMP; pass a fixed value in tests. */
  now?: Date;
  locationFor?: (e: RaceEvent) => string;
}

export function uid(e: RaceEvent, domain: string) {
  return `${e.season}-${e.id}@${domain}`;
}

/**
 * Builds an iCalendar file. Only confirmed, dated races are included — TBC, cancelled and
 * training entries are skipped. UIDs are stable per race so subscribed calendars update in place.
 */
export function toICS(events: RaceEvent[], opts: IcsOptions): string {
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const where = opts.locationFor ?? ((e) => [e.location, e.country].filter(Boolean).join(', '));
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${opts.domain}//Race calendar//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escape(opts.calendarName)}`,
    'X-WR-TIMEZONE:Europe/Warsaw',
  ];
  for (const e of events.filter(isConfirmedRace)) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid(e, opts.domain)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.start)}`,
      // DTEND is exclusive for all-day events.
      `DTEND;VALUE=DATE:${compact(addDays(e.end, 1))}`,
      `SUMMARY:${escape(e.name)}`,
      `LOCATION:${escape(where(e))}`,
      `DESCRIPTION:${escape([e.discipline, e.cls].filter(Boolean).join(' · '))}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
