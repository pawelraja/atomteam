# Build spec — MADW website for the 2027 season (PL + EN)

> Read by Claude Code via CLAUDE.md. Local references: design mockups in `docs/design/`, tokens in `design-system/tokens.json`, seed data in `data/`. Where this spec shows seed JSON inline, the files in `data/` are the fuller, newer version — use those.

Build the new website for **Mat Atom Deweloper Wrocław (MADW)**, a UCI Continental and Junior women's cycling team from Wrocław, Poland (founded 2016), **for the 2027 season**. The current site is https://www.atomteam.pl/ (built on Wix). Keep its visual identity, but make the page much clearer and more focused.

It will launch in the **off-season (autumn/winter 2026)**, while the 2027 roster, race calendar and partner list are still being confirmed. The site must look finished on day one with incomplete 2027 data. It then fills in as the facts are confirmed, **without code changes**: only data files are edited.

The site is **bilingual: Polish first, English second.** Polish is the default at `/`, and English lives at `/en/`. A language switch in the header links each page to its counterpart.

The page serves fans, sponsors and the press. Its jobs, in priority order:

1. **Clarity.** A visitor understands who the team is, what's happening in 2027 and how to partner with it in under 10 seconds.
2. **Sponsors and partners.** The off-season is when partner deals are made. Recognise current partners honestly, and make "Partner with us for 2027" the most visible action on the page.
3. **Pictures.** Race photography carries the page. Use big, full-bleed images and few words.
4. **Race calendar.** Show the 2027 season, including dates still to be confirmed, with the next race always obvious. Keep 2026 as an archive.

## Stack and setup

- If this repo already has a stack, use it. Otherwise use **Astro + TypeScript**, plain CSS with custom properties, and no UI framework. The output is a static build.
- Use `astro:assets` / `<Image>` for responsive AVIF/WebP images with `srcset`, lazy loading below the fold, explicit width and height, and no layout shift.
- Keep all content in data files, validated with Zod schemas at build time. A malformed entry fails the build with a readable message.
  - `src/data/site.json`: season settings (below)
  - `src/data/calendar/2026.json` and `src/data/calendar/2027.json`
  - `src/data/partners.json`
  - `src/data/riders.json`
  - `src/data/staff.json`
  - `src/data/highlights-2026.json`
  - `src/content/copy.pl.json` (source of truth) and `src/content/copy.en.json`
- Use Astro's built-in i18n routing: `defaultLocale: "pl"`, `locales: ["pl","en"]`, `prefixDefaultLocale: false`. That puts PL at `/` and EN at `/en/`. Don't hard-code strings in components.
- Put images in `src/assets/photos/`, `src/assets/riders/` and `public/partners/`. **Do not scrape or hotlink images from the Wix site.** Create clearly labelled placeholders (a neutral `surface-muted` block with the intended filename and aspect ratio) plus a `src/assets/README.md` that lists every image slot the team must supply.

## Season model (the core of this build)

Create `src/data/site.json`:

```json
{
  "currentSeason": 2027,
  "foundedYear": 2016,
  "phase": "preseason",
  "rosterConfirmed": false,
  "calendarConfirmed": false,
  "partnersConfirmed": false,
  "teamPresentation": null,
  "partnerDeckUrl": null
}
```

- `phase` is `"preseason" | "racing" | "offseason"`. It switches hero content and section order:
  - **preseason:** Partners and the "Partner for 2027" block move up to follow the 2026 recap.
  - **racing:** Next race and Calendar lead.
  - **offseason:** the season recap leads.
- `teamPresentation` is `{ "date": "YYYY-MM-DD", "place": "…", "url": "…" } | null`. When set, show a countdown banner under the hero until that date, then remove it automatically.
- Season number is computed: `currentSeason - foundedYear + 1`, giving "Season 12". Don't hard-code it.
- Each `*Confirmed: false` flag changes the wording of its section so nothing on the page claims something that is not yet true (details below).
- The README explains each flag in plain language for non-developers.

## Languages (PL default, EN switch)

- **Every string comes from `copy.pl.json` / `copy.en.json`, and both files have identical keys.** A missing key fails the build, with a message naming the key and the language.
- **Header switch:** a small segmented "PL | EN" control, with the active language as a black pill on the glass header.
  - The inactive option is a real link to the same section in the other language, e.g. `/#kalendarz` ↔ `/en/#calendar`. Keep a map of section anchors per language.
  - Give it `hreflang` and `lang` on the link, `aria-current` on the active option, and a 44px touch target on mobile.
  - Also link "English version" / "Wersja polska" in the footer.
  - **No automatic redirect based on browser language.** Search engines and people sharing links must always get the URL they asked for.
- **Language metadata:** set `<html lang="pl">` / `lang="en"`. Add `<link rel="alternate" hreflang="pl|en|x-default">` on both versions, with x-default pointing to PL. Set `og:locale` to `pl_PL` / `en_GB`, and use one OG image per language.
- **Dates and numbers** use `Intl.DateTimeFormat` with the page's locale. PL shows "9–11 sty" and month headings like "01/ Styczeń"; EN shows "9–11 Jan" and "01/ January". PL uses non-breaking spaces before units and after single-letter words ("w 2027", "i U23"), for example via a small typographic helper.
- **Data that has language:**
  - Race `name` is the official or Polish name, with an optional `name_en` for generic names ("Puchar Polski" → "Polish Cup", "Obóz treningowy" → "Training camp").
  - Discipline labels are translated: Szosa/Road, Tor/Track, Przełaj/CX, TTT, Treningi/Training.
  - Staff `role` is `{ "pl": "…", "en": "…" }`, using feminine Polish forms where they apply ("Dyrektorka sportowa").
  - Highlights have `title` and `text` in both languages.
  - Partner package benefits live in the copy files.
- **Newsletter consent text and the privacy link** exist in both languages. The form sends a `lang` field.
- **Polish copy is the source.** Write it natively; don't translate it from English. Tone: direct, proud, "my" to "Ty/Wy". Headings keep sentence case with a full stop ("Kalendarz wyścigów.", "Jedź z nami w sezonie 2027.").
- **Copy and layout reference:** the design mockups in `docs/design/` (`Home-PL.dc.html`, `Media-PL.dc.html`, `Home-EN.dc.html`, `Media-EN.dc.html`, and the two `*-Mobile.dc.html` files). Use their wording as the starting `copy.pl.json` and `copy.en.json` (the EN copy is written natively, not a literal translation). The v1 page of the canvas is superseded.

## Design system (use exactly these values)

Define them as CSS custom properties in `src/styles/tokens.css`. Support a `[data-theme="dark"]` section variant for the plum bands.

**Colour, light (default):**
- `--surface #ffffff`
- `--surface-alt #f1eef3` (lilac mist)
- `--surface-muted #eeeeee`
- `--ink #000000`
- `--ink-muted #4f4f4f`
- `--ink-subtle #949494` (disabled and borders only)
- `--accent #ff66ed` (brand pink)
- `--accent-strong #8c00ff` (violet)
- `--line #000000`
- `--header-glass rgba(241,238,243,.73)`
- `--ink-on-accent #2b0020`
- `--focus #8c00ff`

**Colour, dark sections:**
- `--surface #2b0020` (plum)
- `--surface-alt #3f273c`
- `--ink #f1eef3`
- `--ink-muted #c0b8be`
- `--accent #ff66ed`
- `--accent-strong #c580ff`
- `--line #605c5f`
- `--focus #ff66ed`

**Brand scales (for tints only):**
- pink: `#fecdf8 #fd9cf2 #ff66ed #7f4e79 #3f273c`
- violet: `#d9aaff #c580ff #8c00ff #5d00aa #2f0055`
- plum: `#ffd0f4 #ffa1e9 #bf79af #800060 #2b0020`

**Contrast rules (mandatory):**
- Pink `#ff66ed` on white is only 2.5:1. Never use it for body text on light grounds. Use it for fills, borders, underlines and display-size decorative words (42px+).
- For readable text in the pink family on light grounds, use `--accent-strong`.
- On plum, pink text is fine (7.5:1).
- Labels on pink buttons use `--ink-on-accent` (#2b0020), not white.
- All text must meet WCAG AA.

**Type:**
- Font is **Inter** (Google Fonts, 400 and 700, `font-display: swap`). Headlines are large and *regular weight*; bold is only for short lead lines.
- Scale (px / line-height):
  - display 72/1.1 (use `clamp()` down to 44 on mobile)
  - h2 42/1.2 (clamp to 32)
  - h3 28/1.5
  - lead 22/1.4 bold
  - body-large 18/1.4
  - body 16/1.4
  - body-small 14/1.4
  - caption 12/1.4
- Headings use sentence case and end with a full stop ("Meet the riders.", "Race calendar."). Use uppercase only for a single emphasised term ("our CONTINENTAL TEAM").

**Shape and depth:**
- Radii: 6 / 16 / **30 (cards)** / **40 (header pill, feature media)** / **100px (buttons, pills)**.
- No blurred shadows. Cards sit on a hard offset: `0 5px 0 0 rgba(255,102,237,.35)`. Feature media use `0 5px 0 0 rgba(140,0,255,.7)`.
- Spacing base: 4 / 8 / 16 / 24 / 32 / 64 / 96 / 128. Sections breathe (96–128px vertical on desktop).

**Components to build:**
- Pill button: primary = pink fill; secondary = 1px pink outline with violet label, filling pink on hover.
- Floating pill header: 64px tall, `--header-glass` with backdrop blur, 40px radius, inset 16px from the viewport edges.
- Rider card: 3:4 photo, 30px radius, pink offset shadow, name plus a "/POL" nationality tag.
- Hashtag ticker: `#allezatomówki` repeating in h2 size. Respect `prefers-reduced-motion`.
- Focus ring: 2px solid `--focus`, offset 2px.

**Voice:** proud, energetic, inclusive, "we" to "you", short declarative lines. No emoji in UI copy.

**Avoid:** gradients, glassy cards everywhere, stock icons, emoji, and long paragraphs over images.

## Page structure (single page, anchored sections)

1. **Header (sticky pill).**
   - Wordmark text "MAT ATOM DEWELOPER **WROCŁAW**", with a placeholder slot for the official logo SVG.
   - Anchors: Zespół · Kalendarz · Partnerzy · Kontakt (EN: Team · Calendar · Partners · Contact).
   - Right side: the PL | EN switch, Instagram / Facebook / LinkedIn icons, and a pink "Zostań partnerem" / "Partner with us" pill.
   - Mobile: the language link sits next to the hamburger.
   - Mobile: a pink hamburger opens a full-screen plum menu.
2. **Hero.**
   - One full-bleed photo (placeholder `hero.jpg`, 16:9 desktop and 4:5 mobile crop) with a subtle bottom scrim.
   - Eyebrow: "Season 2027 · Season 12" (computed).
   - H1: "We are for women's cycling." Sub: "UCI Continental & Junior team from Wrocław. Since 2016."
   - Buttons depend on `phase`:
     - preseason: primary "Partner for 2027", secondary "See the 2027 calendar".
     - racing: primary "Next race", secondary "Partner with us".
3. **Team presentation banner** (only when `teamPresentation` is set): date, place and days to go.
4. **At a glance strip** (on `surface-alt`). Four big facts:
   - Since 2016 · Season 12
   - Rider count from the 2027 roster. If the roster is not confirmed, show "U19 · U23 · Elite" instead of a number.
   - UCI Continental + Junior
   - Club Pro programme (Ministry of Sport and Tourism)
5. **2026 in review.**
   - A short, proud recap for sponsors and fans: 3–6 highlight cards from `highlights-2026.json` (photo, headline, one line).
   - Add a "Full 2026 calendar" link to the archive tab.
   - Hide any entry with `"verify": true` from the page until the team clears the flag. Log hidden entries at build time.
6. **Next race.**
   - Show the soonest race in the current season whose status is `confirmed` and whose `end >= today`.
   - Card: date range, race name, location, country, discipline chip, UCI class, days-to-go counter and an "Add to calendar" (.ics) link.
   - If there is no confirmed race yet, show "2027 calendar coming soon." with a newsletter prompt, plus the months of the first TBC races ("Season opens in March").
   - If the season is over, show "Season 2027 complete."
7. **Photo story.**
   - An asymmetric editorial gallery of 6–9 photos: mixed 3:4, 4:3 and 16:9, 30–40px radii, and the violet offset shadow on one feature image.
   - Captions include race, place and photographer credit.
   - Opens in an accessible lightbox (keyboard, Esc, focus trap, alt text required).
8. **Team 2027.**
   - Tabs: "Continental team" / "Junior team" / "Staff". Rider cards in a responsive grid (2 / 3 / 4 columns).
   - Show riders whose `seasons` include `currentSeason`.
   - Riders with `"new": true` get a small "New for 2027" pill (violet text on lilac).
   - Cards link to the rider's Instagram and show only name, nationality and role.
   - When `rosterConfirmed` is false, the section title is "Team 2027." with the line "Roster announcement coming soon." If no rider has 2027 in `seasons` yet, show the 2026 roster under the title "Our 2026 riders."
   - Junior tab intro: "White jersey with pink sleeves? That's our Junior team." Put this in copy data, since the 2027 kit may change.
9. **Race calendar** (the core feature, on a dark plum band).
   - Season switcher: **2027** (default) | 2026 (archive).
   - Filter chips: All · Road · Track · CX · TTT · Training. Month jump list: Jan–Oct.
   - Show/hide past races, with past hidden by default.
   - Group rows by month, using the site's style for month labels ("03/ March").
   - Each row shows date(s), race name, location + country, discipline chip, UCI class badge and status:
     - `confirmed`: full dates.
     - `tbc`: the month only, with a "Dates TBC" chip.
     - `cancelled`: struck through, with a label.
   - Highlight the next confirmed race.
   - 2026 archive rows may show an optional `result` string ("Stage 2 · 3rd — M. Szczęsna").
   - When `calendarConfirmed` is false, show a note above the 2027 list: "Provisional calendar — dates are confirmed as race organisers publish them."
   - Mobile: rows collapse to two lines. No horizontal scroll.
   - Build-time `/calendar-2027.ics` with **confirmed races only**. Use stable UIDs, so a subscribed calendar updates instead of creating duplicates.
   - Semantic markup: a `<table>` on desktop or an `<ol>` of `<article>`s. It must be screen-reader friendly.
10. **Partners** (on `surface`). Give this real hierarchy:
    - Title sponsor (a large logo with a one-line thank-you) → Main sponsors (a large logo row) → Technical partners (a logo grid) → Institutional support (City of Wrocław, Club Pro / Ministry of Sport and Tourism / Fundacja Lotto, with one explanatory sentence).
    - Each partner has a `seasons` array. Show partners for `currentSeason` under the heading "Our 2027 partners."
    - Until `partnersConfirmed` is true, show the 2026 partners under **"Thank you to our 2026 partners."** Never present a 2026 partner as a 2027 partner.
    - Logos come from `public/partners/*.svg`, shown at equal optical size, in full colour, linked with `rel="noopener sponsored"`.
11. **Partner for 2027.** This is the key conversion block: a plum band placed right after Partners.
    - H2: "Ride with us in 2027."
    - Three value points: visibility at UCI races across Europe, youth development through Club Pro, and a women's sport community.
    - Three package cards (Title / Main / Technical). Each has a placeholder benefits list for the team to fill in `copy.en.json`: jersey and kit placement, team vehicle, social content, events and hospitality. **No prices.**
    - A "Download the 2027 partner deck (PDF)" button, shown only when `partnerDeckUrl` is set.
    - A `mailto:kontakt@atomteam.pl?subject=Partnership%202027` button.
12. **Movement / mission.** One short paragraph ("We're not just a cycling team — we're a movement…") plus the `#allezatomówki` ticker.
13. **Contact and newsletter.**
    - Show `kontakt@atomteam.pl` and the social links.
    - Newsletter form: email plus a consent checkbox. Label: "Get the 2027 calendar first." The form is **not wired**; expose a `NEWSLETTER_ENDPOINT` env variable and show success and error states.
14. **Footer** (plum): © year · current partners mini-row · privacy link placeholder.

## Showcase direction (v2 — overrides the page structure above where they differ)

For most of the year this site is static. It must work as a **testimony to how professionally the team is run**, not as a news feed. Design rules:

- **Evergreen first.** Nothing on the home page may look stale in March or in November. Seasonal facts live in exactly two places:
  - a **status bar** above the header, one line from `site.json` (`statusLine`, `statusLink`), e.g. "Sezon 2027 · Kalendarz wstępny online · Skład ogłosimy wkrótce";
  - the **season number**, which is computed.
- **Sports-editorial type.** Use Inter at large sizes with tight tracking:
  - hero H1 112px, line-height 0.95, letter-spacing -0.035em;
  - chapter titles 64px / -0.03em;
  - big numbers 96px / -0.04em with `tabular-nums`.
  - Uppercase eyebrows are 13px with 0.08em tracking, violet on light and pink on plum. Keep everything else quiet.
- **Proof over adjectives.** Every claim is a fact from data: counts, UCI classes, results, staff roles. There are no invented stats; data files carry `verify` flags until the team confirms.
- **Multi-page, shallow:**
  - `/` (home)
  - `/zespol` with rider profiles `/zespol/[slug]`
  - `/kalendarz` (full calendar + archive)
  - `/partnerzy`
  - `/media`
  - EN mirrors under `/en/`: `/en/team`, `/en/calendar`, `/en/partners`, `/en/media`.
  - The home page links into each, and the nav shows all five.

### Home page, in order
1. **Status bar** (plum, 40px): the status line plus a link to partnerships.
2. **Hero:**
   - full-bleed photo;
   - eyebrow "Kobieca drużyna kolarska z Wrocławia";
   - H1 "Jesteśmy dla kobiecego kolarstwa.";
   - one-sentence mission;
   - buttons "Poznaj zespół" (outline) and "Zostań partnerem 2027" (pink).
   - Along the bottom of the hero is a **credential strip** (a `<dl>`): Licencja UCI Continental · Juniorki U19 · Siedziba Wrocław /POL · Założona 2016 · Program Klub Pro · MSiT.
3. **Numbers** (4 big figures from data):
   - riders last season, with the split by category;
   - races in last season's calendar;
   - countries raced;
   - disciplines.
   - All four are computed at build time from `calendar/<year>.json` and `riders.json`.
4. **Nasze podejście:**
   - H2 "Jedna drużyna od juniorki do elity.";
   - a **pathway diagram** U19 → U23 → Elita, with rider counts per stage from `riders.json` (add a `category` field);
   - three pillars with top rules: Sztab (roles from `staff.json`), Klub Pro, Wyścigi UCI (the season's 1.Pro / 2.Pro races, pulled from the calendar).
5. **Wyniki (plum):**
   - two headline figures (national titles and national-championship medals) computed from a new `results/<year>.json`;
   - a semantic results table: place badge (1st = pink fill, 2nd = light outline, 3rd = dashed outline, so they differ in more than colour), rider, event.
   - Seed from `data/results-2026.json` (exported from `data/MADW_Results_2026.xlsx`; every row has a source link; the 8 rows with `featured: true` are the table rows). The 2026 headline figures are **30 Polish national titles** (distinct; a pairs/team title counts once) and **58 national-championship medals**. Compute both at build time with the same rules as the workbook, never hard-code them.
   - The results table shows 8 curated rows (`featured: true` in `results/2026.json`), e.g. Ungerová's Gracia Orlová stage win, Wankiewicz 2nd at POREČ Classic and 9th overall at Tour de Pologne Women, Poland's U23 team pursuit bronze at the European Championships, Tracka's U23 time-trial title, Glinka's U19 road title and Szczęsna's Sowiogórski Tour and mountain titles.
   - Rows stay `verify: true` until the team signs them off in the workbook's "Checked by team" column.
6. **Zespół:**
   - Continental / Juniorki / Sztab tabs;
   - 6-column portrait cards with a nationality chip, role and "Profil zawodniczki →".
7. **Kalendarz (teaser):** the first four months of the current season in columns, TBC chips, and a "Pełny kalendarz" link.
8. **Twoja marka w peletonie** (lilac):
   - a numbered **jersey placement diagram** (inline SVG: 1 front, 2 sleeves, 3 side panel / shorts) with a matching numbered list, plus a "+ Poza strojem" row (team vehicles, social, press materials, events).
   - Caption: "Przykładowe rozmieszczenie. Ostateczne pola ustala zespół." The field positions come from `copy.*.json`.
9. **Partner wall:**
   - an asymmetric grid: the title sponsor as a large tile, main sponsors and institutional partners as smaller tiles, technical partners as one text line (or a logo row once SVGs exist);
   - heading "Dziękujemy partnerom sezonu 2026." until `partnersConfirmed`.
10. **CTA band (plum):**
    - "Jedź z nami w sezonie 2027." at 72px;
    - buttons "Umów rozmowę" (mailto) and "Oferta partnerska PDF" (shown as "wkrótce" until `partnerDeckUrl` is set);
    - a **named partnership contact card** from `site.json` (`partnerContact`: name, role, phone, email, photo).
11. **Dla mediów teaser:** four tiles (logos, race photos, rider portraits, team information PDF) linking to `/media`.
12. **Photo strip:** four full-bleed images at mixed widths, then the `#allezatomówki` ticker.
13. **Footer (plum):**
    - newsletter form;
    - team boilerplate;
    - sitemap columns: Drużyna, Współpraca, Obserwuj;
    - language link and legal.

### Strefa mediów (`/media`) — media access is a first-class feature
- **No login and no forms for downloads.** Every file is a direct link with its format and size shown. Files live in `public/media/`, listed in `src/data/media.json` (`name`, `description`, `format`, `size` computed at build, `status: "ready" | "soon"`). "soon" items render as a dashed "Wkrótce" state, never as a broken link.
- **Page-local nav:** Fakty · Pliki · Zdjęcia · Skład · Kontakt.
- **Fakty w skrócie:** a `<dl>` of full name, licence, founded, roster split, management, disciplines and programme, all from data.
- **Notka o drużynie** (boilerplate):
  - PL/EN toggle;
  - word count;
  - a "Kopiuj tekst" button that uses `navigator.clipboard` and confirms with "Skopiowano", falling back to selecting the text.
- **Pliki do pobrania:**
  - logos (SVG/PNG ZIP);
  - team information PDF (PL/EN);
  - season photo selection (ZIP);
  - rider portraits;
  - kit photos;
  - brand guide PDF.
- **Zdjęcia:**
  - filterable library (Wyścigi, Tor, Portrety, Zespół);
  - each photo has a caption, the photographer credit and a hi-res download;
  - thumbnails are responsive, and originals are at least 3000px on the long side.
- **Skład:**
  - a journalist-friendly table: rider, nationality, squad, Instagram handle, materials;
  - it switches to the new roster automatically when `rosterConfirmed` is true.
- **Wywiady i akredytacje:**
  - a named press contact (`site.json` → `pressContact`) and the promised response time;
  - usage rules: editorial use only, photo credit format "Fot. [autor] / MADW", logos not altered, commercial use by agreement.
- **SEO:** `SportsTeam` JSON-LD with `sameAs` social links.

### Rider profile pages (`/zespol/[slug]`)
- A portrait, name, nationality and category.
- Short bio (PL/EN), Instagram, and results from `results/*.json`.
- Downloadable portrait (JPG).
- Static and generated from data; journalists land here from search.

### Also update
- `site.json` gains `statusLine`, `statusLink`, `partnerContact` and `pressContact`. Unset contact fields render as a hidden card, not placeholders.
- `CONTENT-CHECKLIST.md` gains:
  - media files;
  - photographer credits;
  - press and partnership contact details;
  - rider bios;
  - confirmation of every results entry.
- Quality bar:
  - every download link resolves at build time (fail the build on a missing file for any `ready` item);
  - the media page passes Lighthouse too;
  - the results table has proper `<th scope>` headers.

## Seed data

**`src/data/partners.json`.** These are the 2026 partners from the current site. Give each one `"seasons":[2026]`. Tiers are inferred from the current site layout; confirm them with the team manager. Logo files are to be supplied by the team.

```json
[
  {"name":"Mat Atom Deweloper","url":"https://www.atomdeweloper.pl/","tier":"title"},
  {"name":"Miasto Wrocław","url":"http://bip.um.wroc.pl/","tier":"institutional"},
  {"name":"Budus","url":"https://budus.pl/","tier":"main"},
  {"name":"Accent","url":"https://velo.pl/marki/accent","tier":"main"},
  {"name":"No Limited","url":"https://no-limited.pl/","tier":"main"},
  {"name":"Klub Pro — Ministerstwo Sportu i Turystyki / Fundacja Lotto","url":"https://www.fundacjalotto.pl/klub-pro/","tier":"institutional"},
  {"name":"Finish Line","url":"https://velo.pl/marki/finish-line","tier":"technical"},
  {"name":"Sidi","url":"https://velo.pl/marki/sidi","tier":"technical"},
  {"name":"MET Helmets","url":"https://velo.pl/marki/met","tier":"technical"},
  {"name":"Škoda Gall ICM","url":"https://gall-icm.skoda.pl/","tier":"technical"},
  {"name":"Park Tool","url":"https://velo.pl/marki/park-tool","tier":"technical"},
  {"name":"Quest Sport","url":"https://questsport.cc/","tier":"technical"},
  {"name":"Dolakakol","url":"https://www.facebook.com/dolakakol/","tier":"technical"},
  {"name":"Inpeak","url":"https://inpeak.pl/","tier":"technical"},
  {"name":"Vittoria","url":"https://velo.pl/marki/vittoria","tier":"technical"},
  {"name":"San Marco","url":"https://velo.pl/marki/san-marco","tier":"technical"},
  {"name":"Jako Sport","url":"https://jakosport.pl/","tier":"technical"},
  {"name":"MPWiK Wrocław","url":"https://www.mpwik.wroc.pl/","tier":"technical"},
  {"name":"Weron","url":"https://weron.pl/","tier":"technical"},
  {"name":"NamedSport","url":"https://weron.pl/2_namedsport","tier":"technical"},
  {"name":"Connex","url":"https://velo.pl/marki/connex","tier":"technical"}
]
```

**`src/data/calendar/2026.json`** is the archive, transcribed from the current site. Add `"status":"confirmed"` to every entry. Countries use IOC-style codes. `class: null` means the site gave none. Entries marked `"verify": true` have an unclear class and should be checked.

```json
[
  {"start":"2026-01-04","end":"2026-01-04","name":"4th Cyclocross im. Z. Hanusika","location":"Tychy","country":"POL","discipline":"CX","class":null},
  {"start":"2026-01-09","end":"2026-01-11","name":"Przełajowe Mistrzostwa Polski","location":"Ełk","country":"POL","discipline":"CX","class":"NCh.","verify":true},
  {"start":"2026-02-01","end":"2026-02-05","name":"UEC Track Elite European Championships","location":"Konya","country":"TUR","discipline":"TRACK","class":"ECh.","verify":true},
  {"start":"2026-02-03","end":"2026-02-03","name":"Training consultation","location":"Pruszków","country":"POL","discipline":"TRACK","class":null,"type":"training"},
  {"start":"2026-02-07","end":"2026-02-22","name":"Training camp","location":null,"country":"CRO","discipline":"ROAD","class":null,"type":"training"},
  {"start":"2026-02-21","end":"2026-02-22","name":"Polish Cup","location":"Pruszków","country":"POL","discipline":"TRACK","class":"Nat.","verify":true},
  {"start":"2026-03-04","end":"2026-03-04","name":"Umag Classic Ladies","location":"Umag","country":"CRO","discipline":"ROAD","class":"1.2"},
  {"start":"2026-03-07","end":"2026-03-19","name":"Training camp","location":null,"country":"CRO","discipline":"ROAD","class":null,"type":"training"},
  {"start":"2026-03-08","end":"2026-03-08","name":"Poreč Classic Ladies","location":"Poreč","country":"CRO","discipline":"ROAD","class":"1.2"},
  {"start":"2026-03-22","end":"2026-03-22","name":"Midwest Cycling Classic","location":null,"country":"BEL","discipline":"ROAD","class":"1.1"},
  {"start":"2026-03-28","end":"2026-03-28","name":"Trofeo Cinelli – VC Hlohovec","location":null,"country":"CZE","discipline":"ROAD","class":null},
  {"start":"2026-04-04","end":"2026-04-04","name":"NXT Classic","location":null,"country":"NED","discipline":"ROAD","class":"1.1"},
  {"start":"2026-04-06","end":"2026-04-06","name":"Ronde de Mouscron","location":"Mouscron","country":"BEL","discipline":"ROAD","class":"1.1"},
  {"start":"2026-04-08","end":"2026-04-08","name":"Scheldeprijs Vrouwen Elite","location":null,"country":"BEL","discipline":"ROAD","class":"1.Pro"},
  {"start":"2026-04-12","end":"2026-04-12","name":"Ślężański Mnich","location":null,"country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-04-17","end":"2026-04-17","name":"De Brabantse Pijl","location":null,"country":"BEL","discipline":"ROAD","class":"1.Pro"},
  {"start":"2026-04-18","end":"2026-04-19","name":"Polish Cup","location":"Lubartów","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-04-24","end":"2026-04-26","name":"EPZ Omloop van Borsele","location":null,"country":"NED","discipline":"ROAD","class":"2.Ncup"},
  {"start":"2026-04-25","end":"2026-04-26","name":"Polish Cup","location":"Lubań","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-04-30","end":"2026-05-03","name":"Gracia","location":null,"country":"CZE","discipline":"ROAD","class":"2.2"},
  {"start":"2026-05-03","end":"2026-05-03","name":"Criterion","location":"Lubawa","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-05-09","end":"2026-05-10","name":"Polish Cup","location":"Zamość","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-05-10","end":"2026-05-10","name":"In Flanders Fields","location":null,"country":"BEL","discipline":"ROAD","class":"1.1"},
  {"start":"2026-05-10","end":"2026-05-10","name":"Trofee Maarten Wynants","location":null,"country":"BEL","discipline":"ROAD","class":"1.1"},
  {"start":"2026-05-14","end":"2026-05-17","name":"Tour de Feminin","location":null,"country":"CZE","discipline":"ROAD","class":"2.2"},
  {"start":"2026-05-22","end":"2026-05-25","name":"Sportland Niederösterreich Women Tour","location":null,"country":"AUT","discipline":"ROAD","class":"Nat.","verify":true},
  {"start":"2026-05-23","end":"2026-05-24","name":"Polish Cup","location":"Zielona Góra","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-05-30","end":"2026-05-31","name":"Polish Cup","location":"Darłowo","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-06-07","end":"2026-06-07","name":"Dwars door de Westhoek","location":null,"country":"BEL","discipline":"ROAD","class":"1.1"},
  {"start":"2026-06-13","end":"2026-06-14","name":"Polish Cup","location":"Koziegłowy","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-06-20","end":"2026-06-21","name":"Polish Cup","location":"Chrzypsko Wielkie","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-06-21","end":"2026-06-21","name":"Lotto Thüringen Women Cycling Challenge","location":null,"country":"GER","discipline":"ROAD","class":"1.Pro"},
  {"start":"2026-06-25","end":"2026-06-29","name":"Polish Road Championships","location":null,"country":"POL","discipline":"ROAD","class":"NCh."},
  {"start":"2026-07-07","end":"2026-07-12","name":"UEC Track Juniors/U23 European Championships","location":null,"country":"GER","discipline":"TRACK","class":"ECh."},
  {"start":"2026-07-11","end":"2026-07-11","name":"Groupama Ladies Race Slovakia","location":null,"country":"SVK","discipline":"ROAD","class":"1.2"},
  {"start":"2026-07-24","end":"2026-07-26","name":"Tour de Pologne Women","location":null,"country":"POL","discipline":"ROAD","class":"2.Pro"},
  {"start":"2026-07-24","end":"2026-07-26","name":"Watersley Ladies Challenge","location":null,"country":"NED","discipline":"ROAD","class":"2.Ncup"},
  {"start":"2026-07-31","end":"2026-07-31","name":"Criterion","location":"Grudziądz","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-08-01","end":"2026-08-01","name":"Kryterium Uliczne – Nagroda Gruczna","location":"Gruczno","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-08-04","end":"2026-08-07","name":"Torowe Mistrzostwa Polski","location":null,"country":"POL","discipline":"TRACK","class":"NCh."},
  {"start":"2026-08-14","end":"2026-08-16","name":"Sowiogórski Tour","location":null,"country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-08-18","end":"2026-08-18","name":"Egmont Cycling Race Women","location":null,"country":"BEL","discipline":"ROAD","class":"1.1"},
  {"start":"2026-08-27","end":"2026-08-30","name":"Premondiale Giro Toscana Int. Femminile","location":null,"country":"ITA","discipline":"ROAD","class":"2.2"},
  {"start":"2026-08-29","end":"2026-08-30","name":"Górskie Szosowe Mistrzostwa Polski","location":null,"country":"POL","discipline":"ROAD","class":"2.2","verify":true},
  {"start":"2026-09-06","end":"2026-09-06","name":"55. Ogólnopolskie Kryterium Kolarskie","location":"Wieluń","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-09-12","end":"2026-09-13","name":"Mistrzostwa Polski Dwójek i Drużyn na czas","location":null,"country":"POL","discipline":"TTT","class":"NCh."},
  {"start":"2026-09-19","end":"2026-09-19","name":"Puchar Starosty Strzelińskiego","location":"Strzelin","country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-09-20","end":"2026-09-20","name":"Memoriał im. Stanisława Szozdy","location":null,"country":"POL","discipline":"ROAD","class":"Nat."},
  {"start":"2026-10-03","end":"2026-10-07","name":"UEC Road European Championships","location":"Ljubljana","country":"SLO","discipline":"ROAD","class":"ECh."},
  {"start":"2026-10-23","end":"2026-10-25","name":"Polish Track Junior/U23 Championships","location":null,"country":"POL","discipline":"TRACK","class":"NCh."}
]
```

**`src/data/calendar/2027.json`.** Don't invent 2027 dates. Generate a draft by script: for every non-training 2026 race, create `{ "month": <same month>, "name", "location", "country", "discipline", "class", "status": "tbc" }` with no `start`/`end`. Add a `README` note that each entry gets real `start`/`end` dates and `"status":"confirmed"` when the organiser publishes them. Races the team won't ride are deleted, and new races are added.

**`src/data/riders.json`.** Each rider has `name`, `nat`, `squad` ("continental" | "junior"), `instagram`, `photo`, `seasons` and an optional `new`. Seed the 2026 roster with `"seasons":[2026]` and take the Instagram handles from the current site. The team adds `2027` to returning riders and adds new signings with `"new": true`.
- Continental: Eliza Rabażyńska POL, Sofia Ungerová SVK, Olga Wankiewicz POL, Tamara Szalińska POL, Maja Tracka POL, Urszula Sipko POL, Alicja Matuła POL, Gabriela Kaczmarczyk POL, Daria Dębicka POL, Martyna Szczęsna POL, Anna Gaborska POL, Nadia Hartman POL.
- Junior: Linda Sitková CZE, Kinga Słomka POL, Julia Pośpiech POL, Julia Kołakowska POL, Aniela Augustyniak POL, Agata Sekta POL, Zofia Glinka POL, Natalia Gacek POL.

**`src/data/staff.json`.** Give each staff member `seasons: [2026]`, same rules as riders.
- Paulina Brzeźna-Bentkowska — Sport Director, Coach
- Paweł Bentkowski — Team Manager, Sport Director
- Katarzyna Wilkos — Sport Director
- Marcin Zarębski — Mechanic
- Szymon Gałczyński — Doctor

**`src/data/highlights-2026.json`.** Taken from the team's Instagram posts. Every entry is `"verify": true` until the team checks the wording.
- Youth Polish Track Championships (non-Olympic events): Julia Pośpiech 4× gold (junior), Martyna Szczęsna 4× gold, Gabriela Kaczmarczyk gold + bronze, Eliza Rabażyńska 2× silver.
- Polish MTB Marathon Championships: Alicja Matuła U23 champion and elite silver; Julia Kołakowska junior bronze.
- 2026 UCI Road World Championships, Montréal: team riders raced for their national teams (names to be confirmed).

## Content checklist

Also generate `CONTENT-CHECKLIST.md`: a plain-language list of everything the team must supply or confirm before and during the 2027 season. Show where each item is edited and what it blocks on the page.
- 2027 roster, including juniors moving up to U23
- New signings
- Staff changes
- 2027 kit photos and rider portraits in the new kit
- Confirmed race dates
- 2027 partners and tiers
- Partner logos (SVG)
- Partner deck PDF
- Team presentation date
- 2026 highlights wording
- The `verify` flags in the calendar

## Accessibility rules found in the design audit (WCAG 2.2 AA)
- **Focus ring per surface:** violet `#8c00ff` on light surfaces, pink `#ff66ed` on plum and on the hero, plum `#2b0020` inside the glass header. Always 2px, offset 2px. (Violet on the hero measures 2.3:1 and fails.)
- **Form fields on plum:** 1px border `#908a8e` (5.5:1) and placeholder text `#c0b8be`. The `#605c5f` border fails (2.8:1).
- **Graphic lines that carry meaning** (pathway line, stage circles) use violet `#8c00ff`, not pink: pink on white is 2.5:1.
- **Hero text over photos:** add a plum scrim so white text stays at least 4.5:1 over the lightest part of the actual image. Test with the real photo, not the placeholder.
- **Target size:** every icon-only link or button has at least a 36×36 px hit area (2.5.8 needs 24).
- **Download links** get an accessible name with the file, e.g. "Pobierz: Logotypy drużyny (SVG, PNG, ZIP, 4 MB)", not a bare "Pobierz".
- **Places are never shown by colour alone:** result badges are filled for 1st, a solid outline for 2nd, a dashed outline for 3rd and plain text from 4th.
- **The `#allezatomówki` ticker** is decorative (`aria-hidden`), so its low contrast is allowed. Never use pink text on white for anything people have to read.
- **Minimum text size** is 14px for any sentence. 12–13px is only for labels and metadata.
- **"Skopiowano" confirmation** is announced through `aria-live="polite"`.

## Quality bar (verify before you finish)

- Lighthouse on mobile: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO ≥ 95. The hero image is preloaded; LCP < 2.5s.
- Check contrast on every text/background pair in both light and plum sections.
- The whole page is keyboard-navigable and has a skip link. Tabs, filters, the season switcher and the lightbox follow WAI-ARIA patterns. `prefers-reduced-motion` stops the ticker.
- **Both languages:** no key is missing, every link on `/en/` stays in English, the switch lands on the matching section, `hreflang` pairs are reciprocal, and Polish strings don't overflow buttons or chips (they run about 20% longer).
- Responsive at 360, 768, 1280 and 1600 widths with no horizontal scroll. Use Playwright to take screenshots at those widths and review them yourself.
- **Render the page in all three phases with incomplete data** (roster, calendar and partners unconfirmed) and with complete data. Take screenshots of each, in PL and EN. No section may look empty or broken, and none may claim unconfirmed facts.
- Unit-test the calendar and season logic:
  - next confirmed race
  - TBC entries (never in `.ics`, never "next race")
  - multi-day ranges across months
  - past/upcoming state
  - the season-complete state
  - partner and roster fallback to 2026
  - season number
  - the team-presentation countdown expiry
- SEO: title, meta description, Open Graph image ("Season 2027"), `SportsTeam` JSON-LD, and `SportsEvent` JSON-LD for **confirmed** upcoming races only.
- A README that explains how to edit the calendar, partners, riders, highlights, photos and `site.json` without touching code.

Start by scaffolding the project, tokens and the season model with its tests. Then build the sections in order, and show me screenshots (PL first, then EN) after the hero, calendar, and partners + "Partner for 2027" sections.
