// /races.ics: every confirmed race on the team calendar, all seasons, for calendar apps and agents.
// Subscribing keeps it current: new races appear as soon as their dates are confirmed.
import type { APIRoute } from 'astro';
import { getData } from '../lib/data';
import { toICS } from '../lib/ics';
import { isConfirmedRace, raceLocation } from '../lib/season';
import { TEAM, teamDomain } from '../lib/team';

export const GET: APIRoute = () => {
  const events = [...getData().calendars.values()].flat().filter(isConfirmedRace);
  return new Response(toICS(events, { calendarName: TEAM.name, domain: teamDomain, locationFor: (e) => [raceLocation(e, 'pl'), e.country].filter(Boolean).join(', ') }), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
