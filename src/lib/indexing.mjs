// Should this build be indexed by search engines and AI crawlers? Decided automatically:
//   - On Vercel, only a production build whose production domain is the team's own domain
//     (team.json → website, with or without "www.") is indexable. While the site lives on a
//     *.vercel.app address, every page says noindex and robots.txt disallows crawling, so the
//     temporary address never competes with the real one. Attaching www.atomteam.pl and
//     redeploying (the nightly rebuild does it) switches indexing on — no code change.
//   - Outside Vercel (local builds, CI) the build behaves like the live site.
//   - SITE_INDEXING=on|off overrides both.
import team from '../data/team.json' with { type: 'json' };

const bare = (host) => host.toLowerCase().replace(/^www\./, '').replace(/\/.*$/, '');

/** @param {Record<string, string | undefined>} env */
export function siteIndexable(env = process.env) {
  if (env.SITE_INDEXING === 'on') return true;
  if (env.SITE_INDEXING === 'off') return false;
  if (!env.VERCEL) return true;
  if (env.VERCEL_ENV !== 'production') return false;
  return bare(env.VERCEL_PROJECT_PRODUCTION_URL ?? '') === bare(new URL(team.website).host);
}
