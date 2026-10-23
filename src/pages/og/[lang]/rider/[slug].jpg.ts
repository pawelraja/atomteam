// /og/<lang>/rider/<slug>.jpg: the share image of a rider profile (name, category, portrait).
import type { APIRoute, GetStaticPaths } from 'astro';
import { copy, LANGS, type Lang } from '../../../../lib/i18n';
import { findOriginal } from '../../../../lib/images';
import { portraitCard } from '../../../../lib/og';
import type { Rider } from '../../../../lib/schemas';
import { profileRiders } from '../../../../lib/view';

export const getStaticPaths: GetStaticPaths = () =>
  LANGS.flatMap((lang) => profileRiders().map(({ rider, slug }) => ({ params: { lang, slug }, props: { rider } })));

export const GET: APIRoute = async ({ params, props }) => {
  const lang = params.lang as Lang;
  const rider = props.rider as Rider;
  const t = copy(lang);
  const countries = t.calendar.countryNames as Record<string, string>;
  const png = await portraitCard(
    {
      lang,
      eyebrow: t.rider.jobTitle,
      title: rider.name,
      lines: [t.rider.category[rider.category], countries[rider.nat] ?? rider.nat],
    },
    findOriginal('riders', rider.photo)?.path ?? null,
  );
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/jpeg' } });
};
