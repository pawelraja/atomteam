// What the season recap shows. Shared by the recap section and the hero, so the hero never
// links to a recap that isn't on the page.
import { getData } from './data';
import { eventState, recapSeason, seasonStats } from './season';

export function recapContent() {
  const { site, calendars, highlights, today } = getData();
  const season = recapSeason(site);
  const events = calendars.get(season) ?? [];
  // Count only what has actually been raced — a recap never claims races still to come.
  const stats = seasonStats(events.filter((e) => eventState(e, today) === 'past'));
  const cards = (highlights.get(season) ?? []).slice(0, 6);
  const hasStats = Object.values(stats).some((n) => n > 0);
  return { season, stats, cards, hasCalendar: calendars.has(season), hasContent: hasStats || cards.length > 0 };
}
