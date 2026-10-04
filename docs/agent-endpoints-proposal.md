# Proposal: an MCP server (and later NLWeb) for MADW data

**Status: proposal only, not built.** Phase 6 shipped static files that any agent can already read: `/data/*.json`, `/races.ics`, `/llms.txt`, the Markdown pages and the RSS feeds. This note covers the next step if the team wants assistants to *call* the team's data as tools.

## Recommendation

Build a **read-only MCP server** as one Vercel serverless function at `https://www.atomteam.pl/mcp`, using the Streamable HTTP transport. It answers from the same `/data/*.json` files the site publishes, so it can never disagree with the pages. No database, no login, no write tools.

Leave NLWeb for later (see below).

## Tools

| Tool | Input | Returns |
|---|---|---|
| `team_facts` | none | Name, UCI status, founding year, city, roster split, titles, wheel partner, contact, `asOf` date |
| `next_race` | optional `discipline` | The next confirmed race (or "calendar provisional" with the first month), with dates, place, class and its `.ics` link |
| `list_races` | `season`, optional `discipline`, `status` | Races with dates, status, place, class and page URL |
| `get_race` | `season` + `slug`, or `id` | One race: facts, the team's classified places with sources, the one-sentence summary |
| `list_riders` | optional `category` (`U19`, `U23`, `Elite`), `season` | Riders with category, nationality, Instagram and profile URL |
| `get_rider` | `slug` | Profile, best result, top-10 results with sources |
| `get_results` | any of `season`, `rider`, `race`, `maxPlace` | Result rows, each with `checkedByTeam` and `source` |
| `faq` | optional `question` | The FAQ answers (PL or EN), dated |
| `how_to_contact` | `topic`: `press`, `junior`, `partnership`, `general` | The right address and subject line. The team handles partnerships offline, so this only gives the e-mail |

Every response carries `source` (the page URL) and `updated`, so assistants cite the site.

## Effort and cost
- About one or two days of work: one TypeScript function using the official MCP SDK, plus tests that compare its answers with the published JSON.
- Hosting: within Vercel's free or Pro tier at the team's traffic. Responses are cacheable for an hour.
- To list it, add the endpoint to `/llms.txt` and `/en/developers/`, and optionally to public MCP registries.

## Risks
- Wider audience: anyone's assistant can query it. That's fine, because the data is already public, and it's read-only.
- Abuse: add a per-IP rate limit (Vercel's firewall) and response caching.
- Drift: avoided by reading only the published JSON.

## NLWeb (later)
NLWeb exposes a site as a natural-language `/ask` endpoint built on schema.org data. It needs an embedding index and an LLM per query, which means running costs and more moving parts. The site's JSON-LD (Phase 2) is already the input it would use. Revisit once the MCP server shows real use.
