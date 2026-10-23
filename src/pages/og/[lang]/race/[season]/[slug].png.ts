// /og/<lang>/race/<season>/<slug>.png: the share image of a race page (name, dates, place).
import type { APIRoute, GetStaticPaths } from 'astro';
import { copy, LANGS, type Lang } from '../../../../../lib/i18n';
import { textCard } from '../../../../../lib/og';
import { raceDates, raceWhere } from '../../../../../lib/pageld';
import { raceName, type RaceEvent } from '../../../../../lib/season';
import { typo } from '../../../../../lib/text';
import { racePages, type RacePageView } from '../../../../../lib/view';

export const getStaticPaths: GetStaticPaths = () =>
  LANGS.flatMap((lang) => racePages().map((page) => ({ params: { lang, season: String(page.season), slug: page.slug }, props: { page } })));

export const GET: APIRoute = async ({ params, props }) => {
  const lang = params.lang as Lang;
  const page = props.page as RacePageView;
  const t = copy(lang);
  const e = page.event as RaceEvent & { start: string; end: string };
  const png = await textCard({
    lang,
    eyebrow: [t.calendar.discipline[e.discipline], e.cls, String(page.season)].filter(Boolean).join(' · '),
    title: typo(lang, raceName(e, lang)),
    lines: [raceDates(e, lang), raceWhere(e, lang)],
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
