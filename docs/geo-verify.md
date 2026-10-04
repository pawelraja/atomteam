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

_Outbound network access was blocked in the build environment, so no external URL could be looked up or checked._
