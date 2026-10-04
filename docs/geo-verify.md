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

## Equipment (`src/data/equipment.json`); ask NO LIMITED, see `docs/no-limited-outreach.md`
- **Brand spelling**: "NO LIMITED" is used everywhere. Confirm it's the brand's preferred form.
- **UCI-approved wheels since 2016** (`wheels.facts`): hidden until NO LIMITED confirms.
- **Wheel models** (`wheels.models`): name, discipline, rim depth and product URL for each model. Placeholders for road, time trial and track (the track entry only if they supply track wheels).
- **Disciplines** (`wheels.disciplinesVerify`): road and time trial are assumed. Once confirmed, race pages and the equipment page show the podiums won on NO LIMITED wheels (96 podium places in 19 races in 2026 on road and TT, as computed).
- **Rider quotes** (`wheels.quotes`): two placeholders. Add each rider's name and her words in both languages.
- **Race setup** (`setup`): which product each partner supplies. Accent: bikes; Vittoria: tyres; Sidi: shoes; MET Helmets: helmets; San Marco: saddles; Jako Sport: clothing; Finish Line: lubricants; Park Tool: tools; NamedSport: nutrition; Škoda Gall ICM: team cars. All hidden until confirmed.
- **Link attributes**: links to no-limited.pl and other partners keep `rel="sponsored"`, as Google requires for paid or sponsored links.

## FAQ and summaries (`src/content/copy.*.json` → `faq`)
- **UCI tier wording** ("level"): the answer says Continental is the third tier of women's road cycling, after Women's WorldTeams and Women's ProTeams (the ProTeam tier started in 2025). Confirm the team is happy with this wording.
- **Bikes**: the question "What bikes and wheels does the team use?" answers only the wheels (NO LIMITED) and lists the technical partners. Add the bike brand and model once confirmed (Accent is a main sponsor, but it isn't confirmed as the race bike).
- **Junior recruitment**: the answer asks applicants to write to kontakt@atomteam.pl with their details. Confirm the process (trials, age limits, a contact person). Phase 6 adds an application form.
- **Sponsorship**: the answer gives only the e-mail, in line with the decision of 2 Oct 2026 (partnerships offline, no sales content).
- `site.json` → `factsAsOf` is `2026-10-04`. Update it when the roster or calendar changes.

## Newsletter and data (phase 6)
- **MailerLite**: set `MAILERLITE_ACCOUNT_ID` and `MAILERLITE_FORM_ID` in Vercel. After deploying, sign up once with a test address to confirm MailerLite accepts the in-page request; I tested against a simulated MailerLite response because outbound access was blocked here. Keep reCAPTCHA off and double opt-in on in the MailerLite form settings.
- **Attribution wording** in `/data/*.json` ("Please name … and link …"): the team decides whether to add a formal licence (e.g. CC BY 4.0).
- **Privacy policy**: the policy page is still the placeholder "published before the newsletter launches". It needs the real text (MailerLite as processor) before the form goes live.

## Crawlers (`src/pages/robots.txt.ts`)
- All search and AI crawlers are allowed, including the training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended). Confirm the team is fine with model training on the site's public content. Opting out of training alone means switching just those four groups to `Disallow: /`, and costs nothing in search.

_Outbound network access was blocked in the build environment, so no external URL could be looked up or checked._
