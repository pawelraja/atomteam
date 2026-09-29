# Content checklist: 2027 season

Everything the team needs to supply or confirm, where it's edited, and what changes on the site once it's done. The site already looks finished without these. Each item just makes it more complete and more accurate.

How to edit each file: see **README.md → Everyday editing**. Photo sizes and file names: see **`src/assets/README.md`**.

## Before launch (autumn 2026)

| ☐ | Item | Who supplies it | Where it's edited | What it unlocks or changes on the page |
|---|---|---|---|---|
| ☐ | **2026 highlights wording**: check names, medal counts and the Worlds line (all three are marked `verify`) | Press officer | `src/data/highlights-2026.json`: fix the text, then delete `"verify": true` | The highlight cards in "2026 in review" appear. Until then only the automatic numbers show. |
| ☐ | **Calendar `verify` flags**: 5 races with an unclear class (Polish CX Champs, UEC Track Elite Euros, Polish Cup Pruszków, Sportland NÖ Tour, Górskie MP) | Sport director | `src/data/calendar/2026.json` and `2027.json`: correct `class`, delete `"verify": true` | The class badge appears on those rows and they count as UCI races in the recap numbers. |
| ☐ | **2026 partner tiers**: title / main / technical / institutional were inferred from the old site | Team manager | `src/data/partners.json` → `tier` | Order and size of logos in "Thank you to our 2026 partners." |
| ☐ | **Partner logos** (21 SVG files) | Partners / team manager | `public/partners/` (file names in `src/assets/README.md`) | Real logos replace the name placeholders, in the partners section and the footer. |
| ☐ | **Team logo** (SVG) | Team | `public/brand/logo.svg` | Replaces the text wordmark in the header. |
| ☐ | **Race photography**: hero, 7 photo-story images, 3 highlight images, with credits | Team photographers | `src/assets/photos/` + captions in `src/data/gallery.json` | Photos replace grey placeholders. The hero photo is preloaded for speed. |
| ☐ | **Instagram handles**: copied from the old site | Riders | `src/data/riders.json` → `instagram` | Rider cards link to the right profiles. |
| ☐ | **Privacy policy text** | Team / legal | `copy.*.json` → `privacyPage` | Needed before the newsletter goes live. |
| ☐ | **Newsletter provider** | Team | `NEWSLETTER_ENDPOINT` at build time (see README) | Sign-ups are actually collected. |

## During the off-season (winter 2026/27)

| ☐ | Item | Where it's edited | What it unlocks or changes on the page |
|---|---|---|---|
| ☐ | **2027 roster**: returning riders get `2027` in `seasons` | `src/data/riders.json` | As soon as one rider has 2027, the section switches from "Our 2026 riders." to "Team 2027." (still saying "Roster announcement coming soon"). |
| ☐ | **Juniors moving up to U23/Elite** | `riders.json` → `squad` from `"junior"` to `"continental"` | Rider moves from the Junior tab to the Continental tab. |
| ☐ | **New signings**, with `"new": true` | `riders.json`: add a line each | A "New for 2027" pill on their card. |
| ☐ | **Staff changes** | `src/data/staff.json` (`seasons`, `role` in PL and EN) | Staff tab shows the 2027 staff. |
| ☐ | **Roster confirmed** | `site.json` → `"rosterConfirmed": true` | "Roster announcement coming soon" disappears; the top strip shows the rider count (e.g. "20 zawodniczek"). |
| ☐ | **2027 kit photos and rider portraits in the new kit** | `src/assets/riders/` (3:4) and `src/assets/photos/` | Portraits replace placeholders. Update the junior-kit line in `copy.*.json → teamSection.juniorIntro` if the kit changes. |
| ☐ | **Team presentation date and place** | `site.json` → `teamPresentation` | A countdown banner under the hero; it removes itself the day after. |
| ☐ | **2027 partners and tiers**: add `2027` to renewing partners, add new ones | `src/data/partners.json` | Nothing visible yet (by design). |
| ☐ | **Partners confirmed** | `site.json` → `"partnersConfirmed": true` | Heading changes to "Our 2027 partners." and shows the 2027 list; the footer lists 2027 partners. |
| ☐ | **Switch phase when racing starts** | `site.json` → `"phase": "racing"` | Next race and calendar move to the top; hero buttons become "Next race" / "Subscribe". |

## All season (2027)

| ☐ | Item | Where it's edited | What it unlocks or changes on the page |
|---|---|---|---|
| ☐ | **Confirmed race dates**: as each organiser publishes | `src/data/calendar/2027.json`: add `start`/`end`, set `"status":"confirmed"`, remove `month` | Race gets real dates, can become "Next race" with a countdown and "Add to calendar", and joins the `/calendar-2027.ics` feed. |
| ☐ | **Races dropped / added / cancelled** | `2027.json`: delete, add, or `"status":"cancelled"` | Calendar stays honest. Cancelled races are struck through. |
| ☐ | **Calendar mostly confirmed** | `site.json` → `"calendarConfirmed": true` | The "Provisional calendar" note disappears. |
| ☐ | **Results** (optional) | Archive calendar → `result` | Shown under the race in the archive tab. |
| ☐ | **End of season** | `site.json` → `"phase": "offseason"`; add `highlights-2027.json` | The recap leads the page; "Season 2027 complete." shows in the next-race slot. |
