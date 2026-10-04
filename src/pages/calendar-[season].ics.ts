// /calendar-2027.ics — subscribable season feed. Confirmed races only; stable UIDs.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getData } from '../lib/data';
import { toICS } from '../lib/ics';
import { raceLocation } from '../lib/season';
import { TEAM, teamDomain } from '../lib/team';

export const getStaticPaths: GetStaticPaths = () =>
  [...getData().calendars.keys()].map((season) => ({ params: { season: String(season) } }));

export const GET: APIRoute = ({ params }) => {
  const season = Number(params.season);
  const events = getData().calendars.get(season) ?? [];
  const body = toICS(events, {
    calendarName: `${TEAM.name} ${season}`,
    domain: teamDomain,
    locationFor: (e) => [raceLocation(e, 'pl'), e.country].filter(Boolean).join(', '),
  });
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
