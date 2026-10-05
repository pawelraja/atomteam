# GEO audit — Phase 0 (4 October 2026)

Audit of the built site (`npm run build`, 52 pages) as a crawler sees it. I used Playwright with **JavaScript disabled** and a GPTBot user agent against `astro preview`, and also grepped the raw HTML.

## 1. What a no-JS crawler gets

### What already works
- **All main content is in the raw HTML.** That covers the hero, numbers, the 2026 story and gallery captions, the full roster (Continental, Junior and Staff panels), both calendar seasons, the results tables, partners and the media fact sheet.
- Tabbed panels are rendered with `hidden` and revealed by a `<noscript>` style. Calendar months beyond the first few are collapsed by a class that `<noscript>` undoes. Nothing is fetched client-side.
- Every indexable page has a unique `<title>`, a meta description, a canonical, reciprocal `hreflang` links (pl, en, x-default) and Open Graph tags.
- Every `<img>` has `alt`.

### Gaps

| # | Finding | Where | Impact |
|---|---------|-------|--------|
| A1 | **The JSON-LD is the same `SportsTeam` stub on every page.** It has no `athlete`, `coach`, `sponsor`, `memberOf` or `Organization`/`WebSite`. | all pages | Engines can't tie riders, staff or partners to the team. |
| A2 | **Rider pages have no `Person` schema.** They only repeat the team stub. | `/zespol/*`, `/en/team/*` (40 pages) | Rider queries can't be answered from structured data. |
| A3 | **No `SportsEvent` is emitted today.** Events only go out for *confirmed upcoming* races, and the 2027 calendar is still provisional. Past 2026 races and their results are never described as structured data. | `/kalendarz/` | The team's best proof (the 2026 results) is invisible to schema-aware engines. |
| A4 | **No per-race pages.** Races exist only as rows in the calendar list. Results are in tables, not tied to a race URL. | n/a | Nothing to cite or link for "how did MADW do at X". |
| A5 | There is no `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, RSS feed or Markdown page versions. | `public/`, `dist/` | Discovery relies on link-following alone. |
| A6 | **No FAQ and no answer-first summaries.** Pages open with slogans (for example "We are for women's cycling.") rather than a quotable factual sentence. The best factual paragraph, the boilerplate, sits on `/media` only. | home, team, calendar | AI engines quote the first factual sentence they find. |
| A7 | **No equipment page.** No Limited appears only as a logo on `/partnerzy` and the page has no text about wheels. | n/a | Nothing answers "what wheels does the team ride". |
| A8 | **Only one form, the newsletter, and it is inert without JS.** `action` is empty until `NEWSLETTER_ENDPOINT` is set, so it can't be submitted. There is no contact form or junior application form. Contact is `mailto:` only. | all pages | Agents can't complete a task on the site. |
| A9 | **There is no news section**, so there is nothing for `NewsArticle` or RSS. | n/a | — |
| A10 | Calendar status labels ("next", "past") are set at build time. JS corrects them for the visitor's date, but a crawler sees the build-day state. | `/kalendarz/` | Minor. A rebuild on each content change keeps this fresh. |
| A11 | The privacy pages' titles have a double stop ("Privacy policy. — …"), and their description is copied from the home page. They are `noindex`. | `/polityka-prywatnosci/`, `/en/privacy/` | Cosmetic. |
| A12 | Partner links carry `rel="noopener sponsored"`. | `/partnerzy/` | See decision D5. |
| A13 | 37 photo slots on the home page are still placeholders, waiting for team files (`src/assets/README.md`). | home | No image-search or visual signal yet. |

### Not found in this repo
- **"cyclig" typo:** not present. The new site's descriptions come from `copy.*.json` and are spelled correctly. The typo is on the old Wix site.
- **UCI code "MAV" or "ATO":** neither appears anywhere in this repo. The new site never states a UCI code. The conflict is between the **old Wix site (MAV)** and **Wikipedia (ATO)**.
- **`@bunia953` Instagram links:** not present. All 20 riders in `src/data/riders.json` have distinct handles. Those handles come from the seed package and are not yet confirmed by the riders.

## 2. Facts that appear in more than one place

| Fact | Where it lives now | Status |
|------|--------------------|--------|
| Team name "Mat Atom Deweloper Wrocław" | `copy.pl.json` and `copy.en.json` → `team.name`; also typed out inside ~9 PL and ~8 EN strings (meta titles, descriptions, boilerplate, gallery alt text); hardcoded in `src/pages/calendar-[season].ics.ts` and `src/pages/ics/[season]/[id].ics.ts` | **Duplicated.** Move it to `team.json` and use `{team}` in strings. |
| Official name casing | The wordmark reads "MAT ATOM DEWELOPER WROCŁAW", the copy reads "Mat Atom Deweloper Wrocław", and the brief reads "MAT ATOM Deweloper Wrocław" | **[VERIFY]** the UCI-registered form. |
| UCI code | nowhere (old site MAV, Wikipedia ATO) | **[VERIFY]** with the team or the UCI. Keep it in data and don't render it until confirmed. |
| UCI status "UCI Continental" | typed in `copy.*.json`: `meta.description`, `media.facts.licenceValue`, boilerplate, footer, intro | **Duplicated** (~6 per language). Move to `team.json`. |
| Founded 2016 | `site.json` → `foundedYear` (single source, templated) | OK |
| City and country | typed in copy strings and in the `Base.astro` JSON-LD | **Duplicated.** Move to `team.json`. |
| Rider count and category split (20 = 8 U19, 10 U23, 2 Elite) | computed from `riders.json` | OK. Matches the brief. |
| National titles and medals (30 and 58), races (47), countries (13) | computed from `results/2026.json` and `calendar/2026.json` | OK |
| Email `kontakt@atomteam.pl` | `copy.pl.json` and `copy.en.json` → `team.email` | **Duplicated.** Move to `team.json`. |
| Social URLs (Instagram, Facebook, LinkedIn) | `copy.pl.json` and `copy.en.json` → `team.social` | **Duplicated.** Move to `team.json`. |
| Hashtag `#allezatomówki` | both copy files | **Duplicated.** Move to `team.json`. |
| Rider external profiles | `riders.json` → `resultsProfile` (CyclingFlash only) | No ProCyclingStats, FirstCycling or UCI links yet: **[VERIFY]**. |

I found no inconsistent values inside the repo. Every duplicate holds the same value today. The risk is drift, not an existing error.

## 3. Brief vs. this repo

| Brief says | Repo reality |
|-----------|--------------|
| Tailwind config, "keep brand colours" | No Tailwind. The site uses plain CSS custom properties from `design-system/tokens.json` → `src/styles/tokens.css`. I treat those files as untouchable. |
| `/team/[slug]` | PL `/zespol/[slug]`, EN `/en/team/[slug]` |
| `/races/[slug]`, `races.json` | Races live in `src/data/calendar/<year>.json` and results in `src/data/results/<year>.json`, both exported from the team's Excel workbook. |
| News / `NewsArticle` / RSS | No news section exists. |
| Sponsorship enquiry form, FAQ "how can a company sponsor" | `CLAUDE.md` non-negotiable (team decision, 2 Oct 2026): no partner-sales content on the main pages, partnerships are handled offline, and jersey placement appears only on `/partnerzy`. |
| `/sprzet` + `/equipment` | Fits the existing PL/EN route pattern as `/sprzet/` and `/en/equipment/`. |

## 4. Re-check after phase 5 (no-JS crawl, same method)

- 178 pages, all 200. Every indexable page carries JSON-LD: home, partners and media have the full team; 40 rider pages have `Person`; 122 race pages have `SportsEvent`; the FAQ has `FAQPage`; the equipment page has the full team and the wheel partner.
- A1–A7 and A11 are fixed. robots.txt, sitemap.xml, llms.txt, llms-full.txt, 8 Markdown versions and 2 RSS feeds now exist.
- A8 (forms) is phase 6. A9 (news) is deferred; the race-results RSS stands in for it. A13 (photos) waits for team files.
- The only JS-filled fields left empty without JS belong to the hidden "next race" card. No 2027 race is confirmed yet, so its "coming soon" state is shown instead, with full text.

## 5. Full SEO and GEO audit before launch (5 October 2026)

All 181 built pages checked (no JavaScript, raw HTML), plus the deployment configuration.

| Area | Finding | Fix |
|---|---|---|
| Temporary address | The Vercel address was indexable, with canonicals pointing to www.atomteam.pl, which still serves the old Wix site. That would cause duplicate content and a messy migration. | **Automatic staging mode** (`src/lib/indexing.mjs`): noindex on every page and `Disallow: /` until the production domain is atomteam.pl, then indexable without a code change. `*.vercel.app` keeps `X-Robots-Tag: noindex` permanently. |
| Migration | Old Wix addresses would 404 after the DNS switch and lose their links and rankings. | `src/data/redirects.json` → redirect pages (Google treats them as permanent). The build fails if a target is missing. Fill it from Search Console before the switch (`docs/launch.md`). |
| 404 | None: Vercel's default page, a dead end. | Bilingual 404 with links to the main pages, noindex. |
| Titles | 122 of 180 titles over 65 characters (median 80); search results cut at ~60. | Shorter templates (home without the season; race "…: wyniki / results"). Titles over 60 characters end in "— MADW" instead of the full name. 22 remain long because the official race names are long. |
| Text versions | The Markdown, JSON, llms.txt, RSS and .ics files could rank in search instead of the pages they mirror. | `X-Robots-Tag: noindex` on those files. Crawlers and AI tools can still read them. |
| Verification | No way to verify Search Console or Bing without a code change. | `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` environment variables. |
| Freshness for AI search | Bing (which feeds Copilot and ChatGPT search) only learned about changes by crawling. | IndexNow after each production deploy, only for pages whose data changed. It skips until the domain is live. |
| Deploy safety | SEO checks ran only in `npm run verify`, not on Vercel. | `check:site` is part of the Vercel build: canonical = own URL, exactly one `<h1>`, unique titles and descriptions per language, hreflang pairs, sitemap = indexable pages, robots.txt, llms.txt links, redirect targets, staging noindex. |
| Headers | No basic security headers (a Best Practices signal). | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. |

Checked and already fine: one `<h1>` per page; `og:url` equals canonical; every page has `lang`, a viewport, an OG image, a meta description of 70–160 characters and an RSS alternate; every `<img>` has `alt`; hreflang is reciprocal; JSON-LD is valid on every page; content doesn't depend on JavaScript; Lighthouse mobile is 95–99 / 100 / 100 / 100.

Left for the team: the old URL list (redirects); the Vercel domain settings; Search Console and Bing; everything in `docs/geo-verify.md` and `docs/geo-offsite.md`.
