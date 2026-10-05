# Going live on www.atomteam.pl

The site runs on a temporary Vercel address until launch. Most of the switch to the real domain is automatic. A few steps are done once by hand.

## What happens automatically

| Before launch (Vercel address) | After launch (www.atomteam.pl) |
|---|---|
| Every page says `noindex, nofollow`; `robots.txt` disallows all crawling | Pages are indexable; `robots.txt` welcomes search and AI crawlers and lists the sitemap |
| `*.vercel.app` sends `X-Robots-Tag: noindex` | Same, permanently, so the Vercel address never competes with the real one |
| IndexNow submissions skip (the domain still serves the old site) | After each production deploy, pages whose data changed are submitted to IndexNow (Bing, Copilot, ChatGPT search) |

Canonical URLs, hreflang, the sitemap, structured data and `llms.txt` always use `https://www.atomteam.pl`, so nothing has to be rewritten at launch.

The switch is decided at build time (`src/lib/indexing.mjs`). A Vercel production build is indexable once the project's production domain is atomteam.pl, with or without `www.`. After the domain is attached, the next deploy flips it: the nightly rebuild does it within a day, or redeploy by hand. To force a state, set `SITE_INDEXING=on` or `off` in Vercel.

Every Vercel build also runs `npm run check:site`. A broken canonical, a missing `<h1>`, a dead link, a sitemap gap or a redirect to a missing page stops the deploy.

## One-time steps (about 30 minutes)

**1. Before switching DNS: map the old addresses.**
Export the old site's indexed URLs: Google Search Console → Pages → indexed pages → Export, or the old Wix `sitemap.xml`. For every address whose path differs on the new site, add a line to `src/data/redirects.json`:

```json
[
  { "from": "/kontakt", "to": "/media/" },
  { "from": "/o-nas", "to": "/" },
  { "from": "/sponsorzy", "to": "/partnerzy/" }
]
```

These are examples only. Use the real list. Paths the new site shares (`/kalendarz`, `/partnerzy`, `/zespol`, `/media`) need no line. The build fails if a target page doesn't exist.

**2. Vercel → Project → Settings → Domains.**
- Add `www.atomteam.pl` as the **primary** domain. The canonical URLs use `www`.
- Add `atomteam.pl` and set it to **redirect to www.atomteam.pl** (308).
- Point DNS as Vercel instructs, then redeploy, or wait for the nightly rebuild.

**3. Check (5 minutes).**
- `https://www.atomteam.pl/robots.txt` lists the crawlers and the `Sitemap:` line, not "Disallow: /".
- View the home page source: there is no `noindex` in the head.
- `https://www.atomteam.pl/sitemap.xml` and `https://www.atomteam.pl/llms.txt` load.
- An old address from step 1 lands on its new page.
- Paste two or three URLs (home, a rider, a race) into https://search.google.com/test/rich-results and https://validator.schema.org/.

**4. Search engines.**
- Google Search Console: add the domain property (DNS TXT record), or set `GOOGLE_SITE_VERIFICATION` in Vercel to the code from the HTML-tag method and redeploy. Submit `https://www.atomteam.pl/sitemap.xml`. Use URL Inspection on the home page to request indexing.
- Bing Webmaster Tools: import from Search Console (or set `BING_SITE_VERIFICATION`), and submit the sitemap.
- If Search Console still lists the old Wix URLs: keep them in `redirects.json` and they drop out over a few weeks.

**5. Then** work through `docs/geo-offsite.md` and start the monthly test.
