// /sitemap.xml: every indexable page in both languages, with hreflang alternates (pl, en,
// x-default → pl) and lastmod from the last change to the data the page is built from.
import type { APIRoute } from 'astro';
import { DEFAULT_LANG, LANGS } from '../lib/i18n';
import { sitePages } from '../lib/sitepages';
import { TEAM } from '../lib/team';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = () => {
  const abs = (p: string) => esc(new URL(p, TEAM.website).href);
  const urls = sitePages().flatMap((page) =>
    LANGS.map((lang) => {
      const alternates = [
        ...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(page.paths[l])}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(page.paths[DEFAULT_LANG])}"/>`,
      ];
      return `  <url>\n    <loc>${abs(page.paths[lang])}</loc>\n    <lastmod>${page.lastmod}</lastmod>\n${alternates.join('\n')}\n  </url>`;
    }),
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
