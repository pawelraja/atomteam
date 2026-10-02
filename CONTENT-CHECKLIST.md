# Content checklist: 2027 season

Everything the team needs to supply or confirm, where it's edited, and what changes on the site once it's done. The site already looks finished without these: nothing is shown as a placeholder sentence, and nothing claims a fact that isn't confirmed. Each item makes it more complete and more accurate.

How to edit each file: see **README.md → Everyday editing**. Photo sizes and file names: see **`src/assets/README.md`**.

## Before launch (autumn 2026)

| ☐ | Item | Who supplies it | Where it's edited | What it unlocks or changes on the page |
|---|---|---|---|---|
| ☐ | **Sign off every 2026 result** (481 rows, all `verify: true`), starting with the 8 `featured` rows shown on the home page | Sport directors | Workbook `data/MADW_Results_2026.xlsx` → "Checked by team", then export to `src/data/results/2026.json` | The build stops listing unchecked rows. The headline figures (30 titles, 58 medals) and the table already come from these rows, so check them first. |
| ☐ | **Assumed race mappings in the workbook**: E22 Zamość = Suchowola round, E48 Memoriał Szozdy = criterium final in Prudnik, E44 mountain titles decided within the Sowiogórski Tour | Sport director | `src/data/calendar/2026.json` (`location`, `note`) and the workbook | Correct place names in the 2026 archive and in result labels. |
| ☐ | **Rider categories**: U19 / U23 / Elite for each rider | Sport director | `src/data/riders.json` → `category` | The numbers ("8 × U19, 10 × U23, 2 × Elite"), the pathway counts and the media fact sheet. |
| ☐ | **Instagram handles**: copied from the old site | Riders | `src/data/riders.json` → `instagram` | Profile pages and the press roster link to the right accounts. |
| ☐ | **2026 partner tiers**: title / main / technical / institutional were inferred from the old site | Team manager | `src/data/partners.json` → `tier` | Size and place of each partner on the partner wall and partners page. |
| ☐ | **Partner logos** (21 SVG files) | Partners / team manager | Drive `partners/` (names in `src/assets/README.md`) | Logos replace the names on the partner wall and partners page. Technical partners switch from a line of names to a logo row once **all** their logos are in. |
| ☐ | **Team logo mark** (SVG) | Team | Drive `brand/logo.svg` | Replaces the dashed "LOGO" circle in the header. |
| ☐ | **Race photography with photographer credits**: the hero, 7 gallery photos, 1 full-width photo and 4 strip photos (12 in `gallery.json`) | Team photographers | Drive `hero/`, `photo-story/`; captions and credits in `src/data/gallery.json` | The home page is built around these photos; until they arrive it shows labelled grey placeholders. Every caption shows "Fot. [author]". |
| ☐ | **Status line** | Press officer | `src/data/site.json` → `statusLine` | The one seasonal line above the header. |
| ☐ | **Press contact** and the promised **response time** | Press officer | `site.json` → `pressContact` (incl. `responseTime`) | The media centre's "Interviews and accreditation" card names a person and says how fast you reply. |
| ☐ | **Media files**: logo ZIP, team information PDF (PL and EN), season photo ZIP, brand guide PDF | Press officer | Drive `media-files/` (names in `src/data/media.json`), then `"status": "ready"` | Each row in "Downloads" gets a button with its size. The build fails if a `ready` file is missing. |
| ☐ | **Press photo library**: originals ≥ 3000 px, with captions and credits | Team photographers | Drive `media/`; captions and `credit` in `src/data/media.json` → `photos` | Thumbnails and "Download JPG" in the media centre. Smaller originals stop the build. |
| ☐ | **2026 highlights wording** (optional, 3 cards) | Press officer | `src/data/highlights-2026.json`: fix, then delete `"verify": true` | Highlight cards appear under the results. |
| ☐ | **Privacy policy text** | Team / legal | `copy.*.json` → `privacyPage` | Needed before the newsletter goes live. |
| ☐ | **Newsletter provider** | Team | `NEWSLETTER_ENDPOINT` at build time (see README) | Sign-ups are actually collected. |

## During the off-season (winter 2026/27)

| ☐ | Item | Where it's edited | What it unlocks or changes on the page |
|---|---|---|---|
| ☐ | **2027 roster**: returning riders get `2027` in `seasons` | `src/data/riders.json` | The team tabs switch to the 2027 riders, still saying the full roster comes at the presentation. |
| ☐ | **Juniors moving up to U23 / Elite**, U23 riders moving to Elite | `riders.json` → `squad` and `category` | Riders move tabs; the pathway counts follow. |
| ☐ | **New signings**, with `"new": true` | `riders.json`: add a line each (with `category`, `photo`) | A "New for 2027" pill on their card, and a profile page. |
| ☐ | **Rider bios** (2–3 sentences, PL and EN) | `riders.json` → `bio` | Shown on each profile page, where journalists land from search. |
| ☐ | **Staff changes** | `src/data/staff.json` (`seasons`, `role` in PL and EN) | Staff tab, the staff pillar ("Pięcioosobowy sztab…") and the media fact sheet. |
| ☐ | **Team presentation date and place** | `site.json` → `teamPresentation` | A countdown in the status bar; it goes away by itself the day after. |
| ☐ | **Roster confirmed** | `site.json` → `"rosterConfirmed": true` | The roster note disappears; pathway, media fact sheet, boilerplate and press roster switch to 2027. |
| ☐ | **2027 kit photos and rider portraits in the new kit** | Drive `riders/` (3:4); `media.json` → portraits and kit files | Portraits on cards, profiles and downloads. Update `teamSection.juniorIntro` in the copy files if the junior kit changes. |
| ☐ | **2027 partners and tiers**: add `2027` to renewing partners, add new ones | `src/data/partners.json` | Nothing visible yet (by design). |
| ☐ | **Partners confirmed** | `site.json` → `"partnersConfirmed": true` | "Thank you to our 2026 partners." becomes "Our 2027 partners." |

## All season (2027)

| ☐ | Item | Where it's edited | What it unlocks or changes on the page |
|---|---|---|---|
| ☐ | **Confirmed race dates**: as each organiser publishes | `src/data/calendar/2027.json`: add `start`/`end`, set `"status":"confirmed"`, remove `month` | The race gets real dates, can become the "Next race" with a countdown and "Add to calendar", and joins the `/calendar-2027.ics` feed. |
| ☐ | **Edition numbers** in race names (the draft drops them, e.g. "Przełaj im. Z. Hanusika") | `2027.json` → `name` | Correct names ("5. Przełaj…"). |
| ☐ | **Races dropped / added / cancelled** | `2027.json`: delete, add, or `"status":"cancelled"` | The calendar stays honest. Cancelled races are struck through. |
| ☐ | **Calendar mostly confirmed** | `site.json` → `"calendarConfirmed": true` | The "provisional" labels disappear. |
| ☐ | **2027 results**, signed off in the 2027 workbook | `data/MADW_Results_2027_template.xlsx` → `src/data/results/2027.json`; give each raced event its `id` in `2027.json` | Profiles show 2027 results. After the season (`"phase": "offseason"`), the home page numbers and results switch to 2027. |
| ☐ | **Calendar `verify` flags** | `calendar/*.json`: correct `class`, delete `"verify": true` | The class badge appears. |
| ☐ | **End of season** | `site.json` → `"phase": "offseason"`, new `statusLine` | The home page looks back on 2027; "Season 2027 complete." on the calendar page. |
