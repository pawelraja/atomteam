# MADW website — project memory for Claude Code

New website for **Mat Atom Deweloper Wrocław (MADW)**, a UCI Continental women's cycling team with a junior squad (Wrocław, Poland, founded 2016). It is built for the **2027 season** and replaces the current Wix site at https://www.atomteam.pl/.

## Read these first, in this order
1. `docs/BUILD_PROMPT.md` is the full build spec and the source of truth. It covers the stack, season model, pages, i18n, accessibility, data and quality bar.
2. `docs/design/*.dc.html` are the approved mockups: home and media centre, desktop and mobile, PL and EN. Read `docs/design/README.md` for how to read them.
3. `design-system/tokens.json` and `design-system/README.md` hold the brand tokens and usage rules. Use exactly these values.
4. `data/*.json` is the seed content. `data/MADW_Results_2026.xlsx` is the team's editable master of 2026 results, and `results-2026.json` is exported from it.

## Non-negotiables
- **No partner-sales content on the main pages** (decided by the team, 2 Oct 2026; overrides the spec and mockups): no "Zostań partnerem" buttons (the header pill is "Subskrybuj" → newsletter), no partnership offer, deck, partnership contact or "Jedź z nami" band. "Twoja marka w peletonie" (jersey placement) appears **only on /partnerzy**. Partnerships are handled offline; thanking current partners is fine.
- **Pictures first:** full-screen hero, the race-day gallery near the top, full-width photo breaks; keep text short.
- **Polish first.** PL lives at `/`, EN at `/en/`, with a PL | EN switch in the header. There is no automatic redirect by browser language. Every string lives in `copy.pl.json` / `copy.en.json` with identical keys.
- **Static and evergreen.** Seasonal facts live only in `site.json` (status line, flags, season number). Nothing on the page claims unconfirmed facts; the fallbacks are defined in the spec.
- **Proof over adjectives.** Never invent numbers. Compute headline figures from `data/` at build time:
  - 30 distinct Polish national titles and 58 national-championship medals in 2026, using the rules in the spec;
  - 20 riders, 47 calendar races, 13 countries raced.
- **Rows with `verify: true`** are team-unconfirmed. Keep the flag in data and follow the spec on how they are shown.
- **Don't scrape or hotlink anything from the Wix site.** Photos and logos are placeholders until the team supplies files. List every slot in `src/assets/README.md`.
- **WCAG 2.2 AA:**
  - Focus ring: violet `#8c00ff` on light surfaces, pink `#ff66ed` on plum and on the hero, plum `#2b0020` in the glass header.
  - Never use pink text on white.
  - Inputs on plum get a `#908a8e` border.
  - Icon targets are at least 36 px.
  - Place badges differ by shape, not colour alone.
  - Minimum 14 px for any sentence.
  - The full list is in the spec under "Accessibility rules found in the design audit".
- **Facts corrected from the old site:**
  - Sofia Ungerová is **SVK**, not SLO.
  - The Tychy cyclocross is the **4th** edition, not 44th.
  - NXT Classic is class **1.2**.

## Working agreement
- Default stack: Astro + TypeScript, plain CSS custom properties, static output, Zod-validated data. If the repo already has a stack, keep it.
- Work in the phases of `.claude/commands/build-site.md`. After each phase:
  - run the build and tests;
  - take Playwright screenshots at 360, 768, 1280 and 1600 px, PL first, then EN;
  - summarise what changed.
- Ask before deviating from the spec or the mockups. Say what differs and why.
- Commit after each phase with a clear message (once a git repo exists).

## Where things live
- The site reads **`src/data/`** (validated by `src/lib/schemas.ts`). `data/` is the original seed package, kept for reference; `src/data/results/<year>.json` is the export of the results workbook.
- Pages: one-line route files in `src/pages/` render views from `src/views/`; `src/components/Shell.astro` is the frame.
- Pure, unit-tested logic: `src/lib/season.ts`, `src/lib/results.ts` (title and medal rules), `src/lib/showcase.ts`.

## Commands
- `npm run dev` · `npm run build` · `npm run test` · `npm run check` (types + data validation)
- `npm run verify`: tests, type check, build, link/hreflang check on every page, contrast, behaviour checks
- `npm run scenarios`: all three phases with incomplete and complete data, PL + EN, screenshots in `screenshots/scenarios/`
- `npm run lighthouse`: mobile Lighthouse on the main pages against the quality bar
- `npm run screenshots -- --widths 360,768,1280,1600 --full --path /media/` (Git Bash: prefix with `MSYS_NO_PATHCONV=1`)
