# Mat Atom Deweloper Wrocław: website

The team website for the 2027 season. It's bilingual: **Polish at `/`** and **English at `/en/`**.

All content lives in data files. Updating the roster, race dates, results, partners or photos never needs a code change: edit a file, rebuild, publish.

- [Pages](#pages) · [Everyday editing](#everyday-editing): what to change, where
- [The season switches in `site.json`](#the-season-switches-in-sitejson)
- [Race calendar](#race-calendar) · [Results](#results) · [Partners](#partners) · [Riders and staff](#riders-and-staff) · [Media centre](#media-centre) · [Photos](#photos) · [Texts](#texts-both-languages)
- [Photos from Google Drive](#photos-from-google-drive) · [Publishing (Vercel)](#publishing-vercel)
- [`CONTENT-CHECKLIST.md`](CONTENT-CHECKLIST.md): everything the team still has to supply or confirm
- [For developers](#for-developers)

The approved brief and designs are in the repository too: `docs/BUILD_PROMPT.md` (the full spec), `docs/design/` (the mockups), `design-system/` (brand tokens) and `data/` (the original seed package, including the results workbook `MADW_Results_2026.xlsx`). `CLAUDE.md` is the short project memory for Claude Code.

---

## Pages

| Polish | English | What's on it |
|---|---|---|
| `/` | `/en/` | Home: full-screen photo, numbers, race-day gallery, approach, a full-width photo, results, team, calendar teaser, thanks to partners, media teaser, photo strip |
| `/zespol/` | `/en/team/` | All riders and staff, and the U19 → U23 → Elite pathway |
| `/zespol/<name>/` | `/en/team/<name>/` | One profile per rider: facts, bio, portrait download, results |
| `/kalendarz/` | `/en/calendar/` | Next race, full calendar with filters, archive of past seasons, `.ics` subscription |
| `/partnerzy/` | `/en/partners/` | Thanks to the partners, by tier, and "Twoja marka w peletonie" (jersey placement) |
| `/media/` | `/en/media/` | Media centre: facts, boilerplate, downloads, photo library, roster, press contact |

The **status bar** above the header is the only place on the site with seasonal news. Everything else is either evergreen or counted from data.

Partnerships are handled offline, so the main pages have **no content for prospective partners**: no offer, deck, contact card or "partner with us" buttons. The header pill is **"Subskrybuj"** and jumps to the newsletter form. The only partner-facing section, "Twoja marka w peletonie" (where a partner's logo goes on the kit), is on the partners page. Partners are thanked on the home page and the partners page.

## Everyday editing

| I want to… | Edit this file |
|---|---|
| Change the line in the status bar | `src/data/site.json` → `statusLine`, `statusLink` |
| Add or confirm a race | `src/data/calendar/2027.json` |
| Add results | `src/data/results/2027.json` (exported from the results workbook) |
| Announce the roster, add a new signing | `src/data/riders.json`, then `rosterConfirmed` in `site.json` |
| Change staff | `src/data/staff.json` |
| Announce 2027 partners | `src/data/partners.json`, then `partnersConfirmed` in `site.json` |
| Name the press contact | `src/data/site.json` → `pressContact` |
| Change gallery captions and credits | `src/data/gallery.json` |
| Publish a download for journalists | Drive `media-files/`, then `"status": "ready"` in `src/data/media.json` |
| Add a photo or logo | Upload it to the shared Drive folder "MADW Website", named as listed in `src/assets/README.md` |
| Change any wording on the page | `src/content/copy.pl.json` **and** `src/content/copy.en.json` |

**Rules that apply to every file**

- The files are JSON. Keep quotes around text, commas between entries, and **no comma after the last entry**.
- Dates are written `"YYYY-MM-DD"`, for example `"2027-03-14"`.
- Countries use three-letter codes in capitals: `POL`, `BEL`, `NED`, `CZE`, `SLO`, `SVK`, `CRO`, `GER`, `ITA`, `AUT`, `TUR`.
- If something is wrong, the build **stops and says exactly where**, for example:
  `Problem in src/data/calendar/2027.json: entry #12 ("Gracia Orlová"), field "start": must be a date written as YYYY-MM-DD`. Nothing broken ever reaches the live site.

## Team facts in `team.json`

`src/data/team.json` is the **only** place for the team's identity: name, alternate names, UCI code and status, founding year, city, country, squads, categories, disciplines, website, e-mail, hashtag, social accounts and external profiles (Wikipedia, Wikidata, ProCyclingStats, FirstCycling, UCI). Pages, structured data, calendar files and the copy texts all read it. Change the e-mail here and it changes everywhere.

- Anything not yet confirmed has `"verify": true`. It stays in the file but is **never shown or sent to search engines**. When the team confirms it, fill in the value and set `"verify": false`.
- `uciCode` is `null` until confirmed. The old site said `MAV`, Wikipedia says `ATO`; check the UCI registration.
- Profile links: put the full address in `"url"` and set `"verify": false`.

## The season switches in `site.json`

```json
{
  "currentSeason": 2027,
  "phase": "preseason",
  "rosterConfirmed": false,
  "calendarConfirmed": false,
  "partnersConfirmed": false,
  "teamPresentation": null,
  "statusLine": { "pl": "Sezon 2027 · Kalendarz wstępny online · Skład ogłosimy wkrótce", "en": "Season 2027 · Provisional calendar online · Roster announced soon" },
  "statusLink": { "label": { "pl": "Kalendarz 2027", "en": "2027 calendar" }, "href": "calendar" },
  "pressContact": { "name": null, "role": null, "phone": null, "email": null, "photo": null, "responseTime": null }
}
```

| Setting | What it means in plain language |
|---|---|
| `factsAsOf` | The date the roster and headline facts were last checked, e.g. `"2026-10-04"`. Summaries and the FAQ say "As of 4 October 2026, …". **Update it whenever you change the roster or confirm the calendar.** |
| `currentSeason` | The season the site is about. "Season 12" is worked out from this and `founded` in `team.json`, so never type it anywhere. |
| `phase` | Which season the home page **looks back on**. `"preseason"` and `"racing"`: the numbers and results show the **previous** season (2026). `"offseason"` (after the last race): they show the season just finished, as soon as it has results. The page order itself never changes. |
| `rosterConfirmed` | `false`: the team shows "We will announce the 2027 roster at the team presentation", and the pathway, the media fact sheet and the press roster keep using the complete 2026 roster. `true`: everything switches to riders with `2027` in `seasons`. |
| `calendarConfirmed` | `false`: the calendar is labelled "provisional". `true`: the label disappears. Set it once most dates are fixed. |
| `partnersConfirmed` | `false`: the partners are thanked as **2026** partners ("Thank you to our 2026 partners."). No one is presented as a 2027 partner. `true`: partners with `2027` in their `seasons` are shown under "Our 2027 partners." |
| `teamPresentation` | `null` means no countdown. Set `{ "date": "2027-01-20", "place": "Wrocław, Hala Stulecia", "url": null }` and the status bar shows the presentation with "in 12 days" until the day itself, then goes back to the status line on its own. `url` can link to tickets or a stream. |
| `statusLine` | The one line in the plum bar above the header, in both languages. The part before the first `·` is set in bold. Phones show the first two parts. `null` hides the bar. |
| `statusLink` | The link at the right of the status bar. `href` is a page (`home`, `team`, `calendar`, `partners`, `media`) or a full address. `null` for no link. |
| `pressContact` | The named press contact in the media centre. Nothing is ever shown as a placeholder: until a **name** and an **e-mail or phone** are filled in, the card offers only `kontakt@atomteam.pl`. `role` is `{ "pl": "…", "en": "…" }`; `photo` is a file in `src/assets/riders/`; `responseTime` is e.g. `{ "pl": "w ciągu 1 dnia roboczego", "en": "within 1 working day" }`. |

**Moving to a new season** (for example 2028): run `npm run draft-season -- 2027 2028` to create a draft calendar, add `2028` to returning riders, staff and partners, set `currentSeason` to 2028, `phase` to `"preseason"`, the three `*Confirmed` flags back to `false`, and update `statusLine`.

## Race calendar

One file per season: `src/data/calendar/2026.json` (archive) and `src/data/calendar/2027.json`. Each line is one race.

**A race whose dates are not published yet ("TBC"):** the month only, no dates. The site shows it under that month with a "date TBC" chip. It never appears as the next race or in the calendar download.

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
| `id` | The event id from the results workbook (`"E14"`). Results refer to it. In 2027, give a race its id when you add its first result. Each race's calendar ID also comes from it, so **don't change an id once results or subscribers use it**. Without `id`, the ID is made from the name and place. |
| `name` | The official or Polish name, shown on the Polish page. |
| `name_en` | *(optional)* English name for generic Polish names, e.g. `"Puchar Polski (szosa)"` → `"Polish Cup (road)"`. |
| `short` | *(optional)* Short name for running text, e.g. `"Scheldeprijs"`. |
| `location` / `location_en` | Town (or `null`). `location_en` only when the English spelling differs (`"Lublana"` / `"Ljubljana"`). |
| `discipline` | `ROAD`, `TRACK`, `CX`, `TTT` or `MTB` (labels are translated automatically). |
| `class` | UCI class (`"1.1"`, `"2.Pro"`, `"Nat."`, `"NCh."`, `"ECh."`) or `null`. |
| `nationalChampionship` | *(optional)* `true` for national championships. Their podiums count as titles and medals. |
| `onTeamCalendar` | *(optional)* `false` for races riders did outside the published calendar (with the national team, for example). They are not listed in the calendar, but their results count. They may have no date. |
| `type` | *(optional)* `"training"` for camps and training days. They appear under the "Training" filter only. |
| `result` | *(optional, archive)* e.g. `"Stage 2 · 3rd — M. Szczęsna"`. Shown under the race. |
| `note` | *(optional)* An internal note, never shown. |
| `verify` | *(optional)* `true` means the class needs checking; the class badge stays hidden and the build lists the race. |

**Calendar downloads.** `/calendar-2027.ics` (the "Subscribe" button) contains **confirmed races only**. Each race keeps the same ID when its dates change, so subscribed phones and Google Calendars update the event instead of adding a duplicate.

### Race pages

Every race with dates gets its own page: `/wyscigi/2026/nxt-classic/` (EN `/en/races/2026/nxt-classic/`). That covers every past race, including races ridden outside the team calendar, and upcoming races once they are `confirmed`. Training blocks and TBC races don't get a page. Each page opens with a one-sentence summary (date, place, the team's best result), then the facts and every classified place with its source. Calendar rows and results tables link to these pages.

- The address is made from the Polish name. Races with the same name (the Polish Cup rounds) get the place added. To choose the address yourself, add `"slug": "puchar-polski-lubartow"`.
- *(optional)* `"organizer": { "name": "…", "url": "https://…" }` names who runs the race. It goes into the structured data.

## Equipment and the wheel partner (`equipment.json`)

The equipment page (`/sprzet/`, `/en/equipment/`) is generated from `src/data/equipment.json`.

- `wheels.partner` names the wheel partner exactly as in `partners.json` (`"NO LIMITED"`). Change the spelling there and it changes everywhere.
- `wheels.seasons` and `wheels.disciplines` say when and where the team raced on these wheels. Race pages then mention the wheels once, next to the podium count ("Podium places: 3, all on NO LIMITED wheels."), and the equipment page totals the podiums. This stays off until `disciplinesVerify` is set to `false`. A race can override it: `"equipment": { "wheels": false }` in the calendar entry (e.g. a start with the national team).
- `wheels.facts`, `wheels.models` (name, discipline, rim depth in mm, product URL) and `wheels.quotes` (rider and text in both languages) appear once `"verify": false`. Each confirmed model also becomes a `Product` in the structured data, made and branded by the partner.
- `setup` lists the rest of the race setup by category (`bikes`, `tyres`, `shoes`…) and partner. Each item appears once confirmed.
- **Preview for checking:** `MADW_SHOW_VERIFY=1 npm run build && npm run preview` shows every unconfirmed item in place, marked "[VERIFY] to be confirmed". The build refuses this setting on Vercel production.
- `docs/no-limited-outreach.md` is the note to NO LIMITED asking for a link back, with a JSON-LD snippet for their site.

## Answer-first summaries and the FAQ

Search and AI engines quote the first factual sentences on a page. So the home hero, the team, calendar and partners intros, rider profiles and race pages each open with a short summary that stands on its own. The summaries are templates in the copy files (`hero.summary`, `teamPage.lead`, `calendarPage.lead`, `partnersPage.lead`, `rider.summary`, `race.summary*`), filled with numbers computed from the data (`src/lib/facts.ts`). They update themselves when the data changes.

The FAQ (`/pytania/`, `/en/faq/`) lives in `faq.items` in both copy files: `id`, `q` (question), `a` (answer) and an optional `link` (`href` is a page name such as `team` or `calendar`). Answers can use `{asOf}`, `{riders}`, `{u19}`, `{titles}`, `{races}`, `{countries}`, `{wheels}`, `{EMAIL}` and the other values in `factVars()` in `src/lib/facts.ts`. Keep both languages in the same order. The page carries `FAQPage` structured data automatically.

## Structured data (for search and AI engines)

Every page carries schema.org JSON-LD, generated from the data files. Nothing is typed by hand.

| Page | Structured data |
|---|---|
| Home, partners, media | `SportsTeam` (athletes, coaches, staff, sponsors with their tier, the UCI, profiles) + `WebSite` + one `Organization`/`Brand` per partner + `SportsEvent` for confirmed upcoming races |
| Rider profile | `Person` (nationality, team membership, Instagram and results profiles) + breadcrumbs |
| Race page | `SportsEvent` (dates, place with ISO country, status, sport, the team and its riders as competitors, organiser if known, results summary) + breadcrumbs |
| Calendar | `SportsEvent` for confirmed upcoming races |
| Equipment | full `SportsTeam` + the wheel partner as `Organization` + `Brand` + one `Product` per confirmed wheel model + breadcrumbs |
| FAQ | `FAQPage` with every question and answer + breadcrumbs |

**The build fails if any structured data is invalid** (`scripts/check-jsonld.mjs`, which also runs as `npm run check:jsonld`). It checks types, properties, required fields, dates, absolute URLs, ISO country codes and references, and makes sure no unconfirmed value leaks out. After each deploy, spot-check a few pages at https://validator.schema.org/ and https://search.google.com/test/rich-results.

Partners: `"kind": "brand"` marks a product brand (Sidi, Vittoria…). `"sameAs": ["https://…"]` adds the company's other confirmed addresses (Wikipedia, LinkedIn).

## Results

`src/data/results/2026.json` holds the 481 sourced results of 2026, one row per rider per classification. It is exported from the team's master workbook `data/MADW_Results_2026.xlsx` (the "Results" sheet). Use `data/MADW_Results_2027_template.xlsx` for 2027, and save its export as `src/data/results/2027.json`.

```json
{"eventId":"E33","date":"2026-06-25","stage":"ITT","category":"U23","rider":"Maja Tracka","position":1,"status":"Classified","note":"Polish U23 time trial champion","source":"https://…","featured":true,"verify":true}
```

- `rider` must be written exactly as in `riders.json`, and `eventId` must exist in the same year's calendar. Otherwise the build stops and names the problem.
- **The headline figures are counted, never typed.** National titles and national-championship medals follow the workbook's own rules: only Polish national championships count (`nationalChampionship: true`, held in Poland); a pairs, team time trial or team pursuit title counts **once**, however many riders share it; and the race days of the criterium final are not titles (the series classification is). For 2026 that gives **30 titles and 58 medals**.
- `featured: true` puts a row in the "Selected results" table on the home page (the 8 rows chosen in the workbook). The table orders them by itself: UCI races, then European championships, then Polish races.
- `verify: true` means the team hasn't signed the row off yet (the "Checked by team" column in the workbook). Every row carries its source link, so the rows are shown; the build lists how many are still unchecked. Sign them off in the workbook and export again.
- Rider profile pages list each rider's top-10 places with the source of each.

## Partners

`src/data/partners.json`, one line per partner:

```json
{"name":"Budus","url":"https://budus.pl/","tier":"main","logo":"budus.svg","seasons":[2026,2027]}
```

- `tier`: `title`, `main`, `technical` or `institutional`. This sets the size and the group the partner appears in.
- `seasons`: add `2027` when a partner renews; add a new line for a new partner. Nobody is shown as a 2027 partner until `partnersConfirmed` is `true` in `site.json`.
- `logo`: the file name in `public/partners/`. Until the file exists, the name is shown in plain type. On the home page, technical partners appear as one line of names until **all** their logos exist, then as a logo row.
- `label` *(optional)*: a shorter display name in both languages, e.g. `{ "pl": "Klub Pro · MSiT", "en": "Club Pro · Ministry of Sport" }`.
- `description` *(optional)*: the one-line explanation shown next to institutional partners on the partners page.

> The 2026 tiers were inferred from the old site's layout: **please confirm them with the team manager.**

## Riders and staff

`src/data/riders.json`:

```json
{"name":"Eliza Rabażyńska","nat":"POL","squad":"continental","category":"U23","instagram":"elizaa_rabaa","photo":"eliza-rabazynska.jpg","resultsProfile":"https://cyclingflash.com/profile/eliza-rabazynska","seasons":[2026,2027]}
```

- **Returning rider:** add `2027` to `seasons`. **New signing:** add a line with `"seasons":[2027]` and `"new": true` (she gets a "New for 2027" pill).
- `category`: `"U19"`, `"U23"` or `"Elite"`. It drives the pathway counts and the numbers. **Check it every season**: juniors move up to U23, U23 riders to Elite.
- `squad`: `"continental"` or `"junior"`.
- `instagram` is the handle only (no `@`, no link), or `null`.
- `profiles`: her ProCyclingStats, FirstCycling and UCI pages, `null` until known. Links appear (on the page and in structured data) only once `"verify"` is set to `false`.
- *(optional)* `bio`: `{ "pl": "…", "en": "…" }`, two or three sentences for her profile page. `role`: `{ "pl": "Kapitanka", "en": "Captain" }`. `resultsProfile`: link to her full results elsewhere. `slug`: the address of her profile, made from her name when left out.
- Each rider gets a profile page at `/zespol/<name>/`.

`src/data/staff.json` works the same way. `function` (`"coach"`, `"director"`, `"manager"`, `"mechanic"`, `"medical"`, `"other"`) tells search engines who coaches the team. `role` is in both languages and uses feminine forms where they apply: `{"pl":"Dyrektorka sportowa","en":"Sport director"}`. Staff whose role includes "dyrektor"/"menedżer" are listed under "Management" in the media centre.

## Media centre

`src/data/media.json` lists the downloads and the press photo library.

```json
{"id":"logos","name":{"pl":"Logotypy drużyny","en":"Team logos"},"description":{"pl":"…","en":"…"},"file":"madw-logotypy.zip","format":"ZIP · SVG, PNG","status":"soon"}
```

- `status: "soon"` shows a dashed "Coming soon" label, never a broken link. Set `"ready"` once the file is in `public/media/` (via Drive `media-files/`). The **build fails** if a `ready` file is missing, so a broken download can't go live. Sizes are measured automatically.
- `file` can be one file, or `{ "pl": "…", "en": "…" }` for language versions (the team information PDF).
- `photos`: each entry has `file` (in `src/assets/media/`), `category` (`race`, `track`, `portrait`, `team`), `caption` in both languages and `credit` (the photographer). Originals must be **at least 3000 px on the long side**; the build stops on a smaller file. Journalists download the original from `/media/foto/<file>`.
- Rider portraits are downloadable from each profile and from the media roster (`/media/portrety/<file>`).
- The boilerplate ("About the team") is in the copy files (`mediaPage.boilerplateText`). Its year and rider count are filled in from data.

## Photos

**Pictures carry the site.** `src/data/gallery.json` lists the race photos and where each one appears (`"use"`): `"story"` for the big race-day gallery near the top of the home page (up to 9, the first one large; click to enlarge), `"band"` for the full-width photo between chapters, and `"strip"` for the four photos above the #allezatomówki ticker. Each has a caption (`race`, `place`), an `alt` text in both languages and the photographer's `credit`.

Upload photos to the shared Google Drive folder (see [Photos from Google Drive](#photos-from-google-drive)). **`src/assets/README.md`** lists every image slot, with its file name, crop and minimum size. The site creates optimised versions automatically. Every photo needs a description (`alt`) or caption in both languages in the data file, for people using screen readers.

## Texts (both languages)

All wording is in `src/content/copy.pl.json` (Polish, the **source**) and `src/content/copy.en.json`. The starting wording comes from the approved mockups in `docs/design/`.

- Both files must have exactly the same keys. If one is missing, the build stops and names the key and the language.
- `{season}`, `{n}` and similar are filled in automatically; keep them.
- Never type the team name, "UCI Continental" or the e-mail address. Write `{TEAM}`, `{UCI_STATUS}` or `{EMAIL}` and they are filled in from `team.json`. A test fails if the name is typed out.
- Counting phrases have forms for Polish grammar (`"one"`, `"few"`, `"many"`): `1 zawodniczka`, `3 zawodniczki`, `20 zawodniczek`. Some have exact forms too: `"5": "Pięcioosobowy sztab, jeden plan."`
- Polish typography (non-breaking spaces after single-letter words: "w 2027", "i U23") is applied automatically.
- `results.stages` translates the stage names used in the workbook ("Stage 2" → "2. etap"). A new stage name shows in English until you add it there.

## Photos from Google Drive

Photos, logos and downloads are managed in the shared Google Drive folder **"MADW Website"**. Every build (on Vercel, and nightly) copies them into the site first, so uploading to Drive is all the team does. They go live with the next build: the nightly one, or straight away with a manual redeploy.

```
MADW Website/
  hero/          hero.jpg (16:9), hero-mobile.jpg (4:5)
  photo-story/   photo-01.jpg … photo-11.jpg, photo-band-01.jpg (gallery, photo break, strip)
  highlights/    highlight-*.jpg
  riders/        one portrait per rider and staff member
  partners/      partner logos (.svg) and the partner deck (.pdf)
  brand/         logo.svg
  media/         press-library originals (≥ 3000 px), named as in media.json
  media-files/   downloads for journalists (.zip, .pdf), named as in media.json
```

- **File names** follow `src/assets/README.md`. Capitals, spaces and Polish letters don't matter: `Eliza Rabażyńska.JPG` is found as `eliza-rabazynska.jpg`.
- A file whose name matches no slot is reported in the build log (Vercel → Deployments → the build → "sync-photos") so typos are easy to spot.
- Photos are **not** stored in git. Drive is the only place to add, replace or remove them.

### One-off setup (about 20 minutes)

1. **Google Cloud:** at console.cloud.google.com, create a project (e.g. "madw-website"), enable the **Google Drive API**, then *IAM & Admin → Service accounts → Create*. Open it → *Keys → Add key → JSON* and download the key file. Keep it private.
2. **Drive:** share the "MADW Website" folder with the service account's email (`…@….iam.gserviceaccount.com`) as **Viewer**. For a Shared Drive, add it as a member. Copy the folder id: the part after `/folders/` in its URL.
3. **Vercel:** Project → *Settings → Environment Variables*, for Production and Preview:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` = the whole content of the key file
   - `DRIVE_FOLDER_ID` = the folder id

   Redeploy once to check the log says "… file(s) copied".
4. **Local preview (optional):** copy `.env.example` to `.env`, fill in the same two values, run `npm run sync-photos`.

## Publishing (Vercel)

The site is hosted on Vercel, connected to the GitHub repository `pawelraja/atomteam`.

1. In Vercel: *Add New → Project → Import* `pawelraja/atomteam`. Vercel reads `vercel.json` (Astro, build `npm run sync-photos && npm run build`, output `dist`), so nothing else needs configuring. Add the two environment variables above.
2. *Settings → Domains*: add `atomteam.pl` and `www.atomteam.pl` and follow the DNS instructions (switch DNS away from Wix only when you're ready to go live).
3. **Every merge to `main` publishes the site.** Every pull request gets its own preview link, handy for checking a data change before it goes live.
4. **Nightly rebuild:** *Settings → Git → Deploy Hooks* → create a hook named "nightly" on branch `main`. Copy its URL into GitHub → repository *Settings → Secrets and variables → Actions* as `VERCEL_DEPLOY_HOOK`. The workflow `.github/workflows/nightly-rebuild.yml` then rebuilds every night. Run it by hand from the *Actions* tab any time.
5. **Checks on every pull request:** `.github/workflows/checks.yml` runs `npm run verify`, so a broken data edit is caught before it can be merged.

## Newsletter

The form (in the footer of every page) isn't connected to a mailing provider yet. When you have one, set the environment variable `NEWSLETTER_ENDPOINT` (a URL that accepts a POST with JSON `{ "email", "consent", "lang" }`) at build time. See `.env.example`. Until then, submitting shows a friendly message pointing to kontakt@atomteam.pl.

---

## For developers

**Stack:** Astro 7 + TypeScript, plain CSS custom properties (`src/styles/tokens.css`, values from `design-system/tokens.json`), static output, no UI framework. Zod validates all data at build time (`src/lib/schemas.ts`, `src/lib/data.ts`). The logic is pure and unit-tested: `src/lib/season.ts` (calendar, season model), `src/lib/results.ts` (title and medal rules, result labels), `src/lib/showcase.ts` (numbers, pathway, teaser, status bar), `src/lib/ics.ts`.

**Layout:** route files in `src/pages/` are one line each and render a view from `src/views/` in the right language; `src/components/Shell.astro` is the page frame (status bar, header, footer). `src/lib/routes.ts` maps pages between languages; `src/lib/anchors.ts` maps section anchors (`/#kalendarz` ↔ `/en/#calendar`).

```bash
npm install
npm run dev            # http://localhost:4321  (PL) and /en/
npm run build          # static site in dist/
npm run verify         # unit tests + type check + build + link check (every page) + contrast + behaviour checks
npm run scenarios      # every phase with incomplete and complete data, PL + EN: link check, "no unconfirmed claims" check, screenshots
npm run lighthouse     # Lighthouse mobile on the main pages; fails below 90 / 100 / 95 / 95
npm run screenshots -- --widths 360,768,1280,1600 --full --path /media/
```

On Windows Git Bash, prefix commands that pass a path like `/media/` with `MSYS_NO_PATHCONV=1`.

**How it stays correct between builds.** The date-dependent parts (next race, days to go, past/upcoming rows, the presentation countdown) are rendered at build time and **re-checked in the visitor's browser** against today's date in Europe/Warsaw. Search engines only see the SportsEvent data from the last build. The nightly rebuild keeps everything else (the calendar teaser's months, for example) current.

**Preview overrides** (for testing only): `MADW_TODAY=2027-04-10` pretends it's that day; `MADW_SITE='{"phase":"racing"}'` overrides `site.json`; `MADW_DATA_DIR=tests/fixtures/complete` swaps in the fake "everything confirmed" data set used by `npm run scenarios` (regenerate it with `node scripts/make-fixtures.mjs`).

**Languages.** Astro i18n routing (`defaultLocale: "pl"`, `prefixDefaultLocale: false`), no automatic redirect by browser language. Every page has a counterpart; the header's PL | EN switch links to it and follows the section in view. `hreflang` pairs (with `x-default` → PL), `og:locale` and one OG image per language are generated, and `npm run check:site` verifies them on every page.

**Fonts.** Inter 400/700 is self-hosted from `@fontsource/inter` (`font-display: swap`, latin + latin-ext). Loading it from `fonts.googleapis.com` cost about 1.9s of first paint on mobile Lighthouse.

**Quality checks (last run, 1 Oct 2026).** Lighthouse mobile: Performance 94–100, Accessibility 100, Best Practices 100, SEO 100 on `/`, `/en/`, `/zespol/`, `/kalendarz/`, `/partnerzy/`, `/media/` and a rider profile; home LCP 2.3–2.4s. All text/background pairs pass WCAG AA (`npm run check:contrast`). No horizontal scroll at 360 / 768 / 1280 / 1600 on any page.
