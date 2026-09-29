// /og-pl.png and /og-en.png — 1200×630 share images, rendered at build time.
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { getData } from '../lib/data';
import { copy, fill, LANGS, type Lang } from '../lib/i18n';
import { seasonNumber } from '../lib/season';

export const getStaticPaths: GetStaticPaths = () => LANGS.map((lang) => ({ params: { lang } }));

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as Lang;
  const { site } = getData();
  const t = copy(lang);
  const season = site.currentSeason;
  const eyebrow = fill(t.hero.eyebrow, { season, number: seasonNumber(site) });
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#2b0020"/>
  <rect x="64" y="64" width="${eyebrow.length * 13 + 48}" height="52" rx="26" fill="none" stroke="#ff66ed" stroke-width="2"/>
  <text x="88" y="98" font-family="Inter, Arial, Helvetica, sans-serif" font-size="24" fill="#ff66ed">${esc(eyebrow)}</text>
  <text x="64" y="300" font-family="Inter, Arial, Helvetica, sans-serif" font-size="92" fill="#f1eef3" letter-spacing="-2">${esc(fill(t.meta.ogHeadline, { season }))}</text>
  <text x="64" y="390" font-family="Inter, Arial, Helvetica, sans-serif" font-size="40" fill="#c0b8be">${esc(t.hero.title.replace(/ /g, ' '))}</text>
  <text x="64" y="560" font-family="Inter, Arial, Helvetica, sans-serif" font-size="28" fill="#f1eef3">${esc(t.team.wordmarkA)} <tspan font-weight="700">${esc(t.team.wordmarkB)}</tspan></text>
  <text x="1136" y="560" text-anchor="end" font-family="Inter, Arial, Helvetica, sans-serif" font-size="28" fill="#ff66ed">${esc(t.team.hashtag)}</text>
  <rect x="0" y="622" width="1200" height="8" fill="#ff66ed"/>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
