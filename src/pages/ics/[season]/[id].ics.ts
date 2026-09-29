// /ics/2027/<race-id>.ics — one confirmed race, for the "Add to calendar" button.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getData } from '../../../lib/data';
import { toICS } from '../../../lib/ics';
import { isConfirmedRace } from '../../../lib/season';

export const getStaticPaths: GetStaticPaths = () =>
  [...getData().calendars].flatMap(([season, events]) =>
    events.filter(isConfirmedRace).map((e) => ({ params: { season: String(season), id: e.id } })),
  );

export const GET: APIRoute = ({ params }) => {
  const events = (getData().calendars.get(Number(params.season)) ?? []).filter((e) => e.id === params.id);
  const body = toICS(events, { calendarName: 'Mat Atom Deweloper Wrocław', domain: 'atomteam.pl' });
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
