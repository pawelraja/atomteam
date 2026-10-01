---
description: Build the MADW 2027 website phase by phase from docs/BUILD_PROMPT.md
argument-hint: [phase number, e.g. 1 — or leave empty to start from phase 1]
---

Read `CLAUDE.md`, `docs/BUILD_PROMPT.md`, `docs/design/README.md` and `design-system/README.md`. Then work on phase $ARGUMENTS (phase 1 if empty). Stop at the end of the phase, show screenshots and a short summary, and wait for my go-ahead before the next phase.

1. **Scaffold.**
   - Astro + TypeScript project, `src/styles/tokens.css` from `design-system/tokens.json`, Inter from Google Fonts.
   - Astro i18n routing: PL at `/`, EN at `/en/`.
   - Zod schemas for every file in `data/`, and a `site.json` with the season model.
   - `copy.pl.json` / `copy.en.json` seeded from the wording in the mockups.
   - Unit tests for the season logic and the title/medal counting rules. Expected 2026 results: 30 titles, 58 medals.
2. **Home page, top half.**
   - Status bar, glass header with the PL | EN switch, hero with the credential strip, numbers band, "Nasze podejście" with the pathway diagram and pillars.
   - Match `docs/design/Home-PL.dc.html`, then the EN mirror.
3. **Results and team.**
   - Results band with computed headline figures and the 8 `featured` rows.
   - Team tabs (Continental, Juniors, Staff) with rider cards.
   - Rider profile pages `/zespol/[slug]` and `/en/team/[slug]`.
4. **Calendar.**
   - Home teaser, plus the full `/kalendarz` page with the 2027 provisional list and the 2026 archive.
   - Filters, the TBC state and a `.ics` file that includes confirmed races only.
5. **Partners.**
   - Jersey placement diagram, partner wall with the 2026 fallback wording, "Ride with us in 2027" band with the partnership contact card, and a `/partnerzy` page.
6. **Media centre.**
   - `/media` and `/en/media`: facts list, boilerplate with a copy button, downloads with `ready`/`soon` states, filterable photo library and journalist roster table.
   - The build fails if a `ready` file is missing.
7. **Footer, SEO and polish.**
   - Newsletter form (`NEWSLETTER_ENDPOINT`), sitemap, hreflang, JSON-LD, Open Graph images per language, `CONTENT-CHECKLIST.md`.
8. **Verification.**
   - Lighthouse (mobile), a WCAG 2.2 AA check against the spec's audit rules, keyboard-only walkthrough, all three season phases with incomplete and complete data, and screenshots in PL and EN.
