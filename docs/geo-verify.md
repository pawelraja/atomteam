# [VERIFY] list — facts the team must confirm

Every item below is in the data with `"verify": true` (or `null`). It is **never shown on the site and never emitted in structured data** until someone confirms it, fills in the value and sets `"verify": false`. This list grows with each GEO phase.

## Team identity (`src/data/team.json`)
| Field | Current state | What to confirm |
|---|---|---|
| `uciCode` | `null` (candidates: ATO, MAV) | The UCI team code. The old site says MAV, Wikipedia says ATO. Check the UCI registration or the federation. |
| `officialName` | "MAT ATOM DEWELOPER WROCŁAW" | The exact registered form and casing. The site displays "Mat Atom Deweloper Wrocław". |
| `uciStatus.category` | "UCI Women's Continental Team" | The 2027 registration category, once the UCI publishes the list. |
| `profiles.wikipediaPl` / `wikipediaEn` | `null` | Article URLs. |
| `profiles.wikidata` | `null` | Item URL (`https://www.wikidata.org/wiki/Q…`). |
| `profiles.procyclingstats` | `null` | Team page URL. |
| `profiles.firstcycling` | `null` | Team page URL. |
| `profiles.uci` | `null` | UCI team page URL. |

## Riders (`src/data/riders.json`)
- `profiles.procyclingstats`, `profiles.firstcycling` and `profiles.uci` are `null` for all 20 riders. Fill in the ones that exist and set `"verify": false` per rider.
- Instagram handles come from the seed package. Every rider has a distinct handle; none points to `@bunia953`. Ask each rider to confirm hers.

## Races (`src/data/calendar/<year>.json`)
- `organizer` is missing for every race. Add `{ "name": "…", "url": "…" }` where known; it goes into the race's structured data.
- Two 2026 results events have no race page because their date or country is unknown: `X10` (UCI Junior Track World Championships, country missing) and `X16` (Polish MTB Marathon Championships, date missing).
- 2026 Polish Road Championships and other entries without a `location` show only the country.

## Partners (`src/data/partners.json`)
- `sameAs` (Wikipedia, LinkedIn, Instagram of each partner) is empty for all partners.
- `kind: "brand"` is set for Accent, Finish Line, Sidi, MET Helmets, Park Tool, Vittoria and San Marco, because their links point to the distributor's brand pages. Confirm whether the partner is the brand or the distributor (Velo).

## Team
- `memberOf` → UCI: the team is presented as registered with the UCI. Add the Polish federation (PZKol) too if the team wants it.

_Outbound network access was blocked in the build environment, so no external URL could be looked up or checked._
