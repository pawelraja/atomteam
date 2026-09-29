# Mat Atom Deweloper Wrocław: website

The team website for the 2027 season. It's bilingual: **Polish at `/`** and **English at `/en/`**.

All content lives in data files. Updating the roster, race dates, partners or photos never needs a code change: edit a file, rebuild, publish.

- [Everyday editing](#everyday-editing): what to change, where
- [The season switches in `site.json`](#the-season-switches-in-sitejson)
- [Race calendar](#race-calendar) · [Partners](#partners) · [Riders and staff](#riders-and-staff) · [Season highlights](#season-highlights) · [Photos](#photos) · [Texts](#texts-both-languages)
- [`CONTENT-CHECKLIST.md`](CONTENT-CHECKLIST.md): everything the team still has to supply or confirm
- [For developers](#for-developers)

---

## Everyday editing

| I want to… | Edit this file |
|---|---|
| Switch the site between pre-season, racing and off-season | `src/data/site.json` → `phase` |
| Add or confirm a race | `src/data/calendar/2027.json` |
| Add a result to last season | `src/data/calendar/2026.json` → `result` |
| Announce the roster, add a new signing | `src/data/riders.json` |
| Change staff | `src/data/staff.json` |
| Announce 2027 partners | `src/data/partners.json`, then `partnersConfirmed` in `site.json` |
| Add or approve a highlight | `src/data/highlights-2026.json` |
| Change photo-story captions | `src/data/gallery.json` |
| Add a photo or logo | Save it under the exact file name listed in `src/assets/README.md` |
| Change any wording on the page | `src/content/copy.pl.json` **and** `src/content/copy.en.json` |

**Rules that apply to every file**

- The files are JSON. Keep quotes around text, commas between entries, and **no comma after the last entry**.
- Dates are written `"YYYY-MM-DD"`, for example `"2027-03-14"`.
- Countries use three-letter codes in capitals: `POL`, `BEL`, `NED`, `CZE`, `SLO`, `SVK`, `CRO`, `GER`, `ITA`, `AUT`, `TUR`.
- If something is wrong, the build **stops and says exactly where**, for example:
  `Problem in src/data/calendar/2027.json: entry #12 ("Gracia"), field "start": must be a date written as YYYY-MM-DD`. Nothing broken ever reaches the live site.

## The season switches in `site.json`

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

| Setting | What it means in plain language |
|---|---|
| `currentSeason` | The season the site is about. "Season 12" is worked out from this and `foundedYear`, so never type it anywhere. |
| `foundedYear` | 2016. Leave it alone. |
| `phase` | **`"preseason"`** (autumn/winter): the hero asks partners to sign for 2027, and the 2026 recap and partner blocks come first. **`"racing"`**: the next race and the calendar lead. **`"offseason"`** (after the last race): the season recap leads. |
| `rosterConfirmed` | `false`: the team section says "Roster announcement coming soon" and the strip at the top shows "U19 · U23 · Elite" instead of a rider count. `true`: the section reads "Team 2027." and the rider count appears. |
| `calendarConfirmed` | `false`: a note above the 2027 calendar says it's provisional. `true`: the note disappears. Set this once most dates are fixed. |
| `partnersConfirmed` | `false`: the partners section thanks the **2026** partners ("Thank you to our 2026 partners."). No one is presented as a 2027 partner. `true`: it shows partners with `2027` in their `seasons`, under "Our 2027 partners." |
| `teamPresentation` | `null` means no banner. To show a countdown under the hero, set `{ "date": "2027-01-20", "place": "Wrocław, Hala Stulecia", "url": null }`. The banner disappears by itself the day after. `url` can link to tickets or a stream. |
| `partnerDeckUrl` | `null` means no download button. Put the PDF in `public/partners/` and set `"/partners/deck-2027.pdf"`; the "Download the 2027 partner deck" button appears. |

**Moving to a new season** (for example 2028): run `npm run draft-season -- 2027 2028` to create a draft calendar, add `2028` to returning riders, staff and partners, set `currentSeason` to 2028, `phase` to `"preseason"`, and the three `*Confirmed` flags back to `false`.

## Race calendar

One file per season: `src/data/calendar/2026.json` (archive) and `src/data/calendar/2027.json`. Each line is one race.

**A race whose dates are not published yet ("TBC"):** the month only, no dates. The site shows it under that month with a "Dates TBC" chip. It never appears as the next race or in the calendar download.

```json
{"month":4,"name":"Ronde de Mouscron","location":"Mouscron","country":"BEL","discipline":"ROAD","class":"1.1","status":"tbc"}
```

**When the organiser publishes the dates:** remove `month`, add `start` and `end` (the same day for one-day races) and set `"status":"confirmed"`:

```json
{"start":"2027-04-05","end":"2027-04-05","name":"Ronde de Mouscron","location":"Mouscron","country":"BEL","discipline":"ROAD","class":"1.1","status":"confirmed"}
```

**A cancelled race:** set `"status":"cancelled"`. It stays in the list, struck through, with a "Cancelled" label.

**Races the team won't ride:** delete the line. **New races:** add a line.

| Field | Meaning |
|---|---|
| `name` | The official or Polish name, shown on the Polish page. |
| `name_en` | *(optional)* English name for generic Polish names, e.g. `"Puchar Polski"` → `"Polish Cup"`. Official international names don't need one. |
| `location` / `location_en` | Town (or `null`). `location_en` only when the English spelling differs (`"Lublana"` / `"Ljubljana"`). |
| `discipline` | `ROAD`, `TRACK`, `CX`, `TTT` or `MTB` (labels are translated automatically). |
| `class` | UCI class (`"1.1"`, `"2.Pro"`, `"Nat."`, `"NCh."`, `"ECh."`) or `null`. |
| `type` | *(optional)* `"training"` for camps and training days. They appear under the "Training" filter only. |
| `result` | *(optional, archive)* e.g. `"Stage 2 · 3rd — M. Szczęsna"`. Shown under the race. |
| `verify` | *(optional)* `true` means the class needs checking; the class badge stays hidden and the build lists the race. Remove the line once checked. |
| `id` | *(optional)* Only needed when two races share the same name **and** place. Each race's calendar ID comes from its name and place, so **renaming a race after publishing** creates a new event in subscribers' calendars. If you must rename, first add `"id"` with the old ID (shown in the `.ics` file). |

**Calendar downloads.** `/calendar-2027.ics` (the "Subscribe" button) contains **confirmed races only**. Each race keeps the same ID when its dates change, so subscribed phones and Google Calendars update the event instead of adding a duplicate.

## Partners

`src/data/partners.json`, one line per partner:

```json
{"name":"Budus","url":"https://budus.pl/","tier":"main","logo":"budus.svg","seasons":[2026,2027]}
```

- `tier`: `title`, `main`, `technical` or `institutional`. This sets the size and the group the partner appears in.
- `seasons`: add `2027` when a partner renews; add a new line for a new partner. Nobody is shown as a 2027 partner until `partnersConfirmed` is `true` in `site.json`.
- `logo`: the file name in `public/partners/`. Until the file exists, the name is shown in a neat placeholder box.
- `description` *(optional, `{ "pl": "…", "en": "…" }`)*: the one-line explanation shown next to institutional partners.

> The 2026 tiers were inferred from the old site's layout: **please confirm them with the team manager.**

## Riders and staff

`src/data/riders.json`:

```json
{"name":"Eliza Rabażyńska","nat":"POL","squad":"continental","instagram":"elizaa_rabaa","photo":"eliza-rabazynska.jpg","seasons":[2026,2027]}
```

- **Returning rider:** add `2027` to `seasons`.
- **New signing:** add a line with `"seasons":[2027]` and `"new": true`. She gets a "New for 2027" pill.
- **Junior moving up to U23/Elite:** change `"squad":"junior"` to `"continental"`.
- The team section shows everyone with `2027` in `seasons`. If nobody has 2027 yet, it shows the 2026 roster as "Our 2026 riders."
- `instagram` is the handle only (no `@`, no link), or `null`. `role` *(optional)* is `{ "pl": "Kapitanka", "en": "Captain" }`.

> The Instagram handles were copied from the old website: **please check each one.**

`src/data/staff.json` works the same way. `role` is in both languages and uses feminine forms where they apply: `{"pl":"Dyrektorka sportowa","en":"Sport Director"}`.

## Season highlights

`src/data/highlights-2026.json`: 3 to 6 cards in the "2026 in review" section. The title, text and photo description are in both languages. An entry with `"verify": true` is **hidden** until someone checks the wording and removes that line. The build lists every hidden entry. All three seeded entries currently need checking.

Above the cards, the numbers (races, race days, countries, UCI races) are **counted automatically** from the calendar, so they're always accurate.

## Photos

See **`src/assets/README.md`** for every image slot, with its file name, crop and minimum size. Save a photo under that name and rebuild. The site creates optimised versions automatically. Every photo needs a description (`alt`) in both languages in the data file, for people using screen readers.

## Texts (both languages)

All wording is in `src/content/copy.pl.json` (Polish, the **source**) and `src/content/copy.en.json`.

- Both files must have exactly the same keys. If one is missing, the build stops and names the key and the language.
- `{season}`, `{n}` and similar are filled in automatically; keep them.
- Counting phrases have forms for Polish grammar (`"one"`, `"few"`, `"many"`): `1 zawodniczka`, `3 zawodniczki`, `20 zawodniczek`.
- Polish typography (non-breaking spaces after single-letter words: "w 2027", "i U23") is applied automatically.
- The partnership package benefits are in `partnerCta.packages`. Replace the placeholder note when the offer is final. **No prices on the page.**

## Newsletter

The form isn't connected to a mailing provider yet. When you have one, set the environment variable `NEWSLETTER_ENDPOINT` (a URL that accepts a POST with JSON `{ "email", "consent", "lang" }`) at build time. See `.env.example`. Until then, submitting shows a friendly message pointing to kontakt@atomteam.pl.

---

## For developers

**Stack:** Astro 7 + TypeScript, plain CSS custom properties (`src/styles/tokens.css`), static output, no UI framework. Zod validates all data at build time (`src/lib/schemas.ts`, `src/lib/data.ts`). The season logic is pure and unit-tested (`src/lib/season.ts`, `src/lib/ics.ts`).

```bash
npm install
npm run dev            # http://localhost:4321  (PL) and /en/
npm run build          # static site in dist/
npm run verify         # unit tests + type check + build + bilingual link check + contrast check
npm run scenarios      # renders every phase with incomplete and complete data, PL + EN, and screenshots it
npm run screenshots -- --widths 360,768,1280,1600 --full
```

**How it stays correct between builds.** The date-dependent parts (next race, days to go, past/upcoming rows, the presentation countdown) are rendered at build time and **re-checked in the visitor's browser** against today's date in Europe/Warsaw. Search engines only see the SportsEvent data from the last build. **Rebuild at least daily** during the racing season (e.g. a scheduled deploy), and after every data edit.

**Preview overrides** (for testing only): `MADW_TODAY=2027-04-10` pretends it's that day; `MADW_SITE='{"phase":"racing"}'` overrides `site.json`; `MADW_DATA_DIR=tests/fixtures/complete` swaps in the fake "everything confirmed" data set used by `npm run scenarios`.

**Languages.** Astro i18n routing (`defaultLocale: "pl"`, `prefixDefaultLocale: false`). There's no automatic redirect by browser language. Section anchors per language live in `src/lib/anchors.ts` (`/#kalendarz` ↔ `/en/#calendar`); the header's PL | EN switch follows the section in view. `hreflang` pairs (with `x-default` → PL), `og:locale` and one OG image per language (`/og-pl.png`, `/og-en.png`) are generated.

**Fonts.** Inter 400/700 is self-hosted from the `@fontsource/inter` package (`font-display: swap`, latin + latin-ext). Loading it from `fonts.googleapis.com` cost about 1.9s of first paint on mobile Lighthouse (Performance 87–89); self-hosting brings it to 97–98.

**Quality checks (last run).** Lighthouse mobile, PL / EN: Performance 98 / 97, Accessibility 100, Best Practices 100, SEO 100, LCP 2.1s, CLS ≤ 0.044. All text/background pairs pass WCAG AA (`npm run check:contrast`). No horizontal scroll at 360 / 768 / 1280 / 1600.
