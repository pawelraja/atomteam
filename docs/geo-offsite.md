# Off-site GEO checklist

AI engines trust a fact when several independent sources agree on it. The site is now the most complete source. This checklist makes the rest of the web say the same thing and link back. **None of this has been done yet**; it is a to-do list for the team.

Work top to bottom: section 1 must come first, because every other entry copies from it.

---

## 1. The canonical facts (copy these exactly, everywhere)

| Fact | Value | Status |
|---|---|---|
| Name | Mat Atom Deweloper Wrocław | ✔ |
| Registered (UCI) name | MAT ATOM DEWELOPER WROCŁAW | [VERIFY] |
| Short name | MADW | ✔ |
| Other names | Atom Deweloper, Atom Deweloper Wrocław, Atomówki | ✔ |
| UCI team code | ATO or MAV | **[VERIFY] first.** Old site: MAV; Wikipedia: ATO |
| UCI category | UCI Women's Continental Team | [VERIFY] for 2027 |
| Founded | 2016, Wrocław, Poland | ✔ |
| Website | https://www.atomteam.pl/ (EN: https://www.atomteam.pl/en/) | ✔ |
| E-mail | kontakt@atomteam.pl | ✔ |
| Instagram | https://www.instagram.com/atomdeweloper_team/ | ✔ |
| Facebook | https://www.facebook.com/atom.deweloper.team | ✔ |
| LinkedIn | https://www.linkedin.com/company/atomteampl/ | ✔ |
| Wheel partner | NO LIMITED (https://no-limited.pl/) | ✔ (spelling: [VERIFY] with NO LIMITED) |
| One-line description (PL) | Kobieca drużyna kolarska UCI Continental z Wrocławia, założona w 2016 roku, z własną drużyną juniorek. | ✔ |
| One-line description (EN) | UCI Continental women's cycling team from Wrocław, Poland, founded in 2016, with its own junior squad. | ✔ |

When the UCI code is confirmed, set it in `src/data/team.json` (`uciCode.value`, `"verify": false`) the same day you update the sites below.

---

## 2. Wikidata (the backbone for Google, Bing and most AI engines)

Search for an existing item first ("Atom Deweloper", "MADW"). Create one only if none exists.

> **Status, 8 Oct 2026:** the team item exists: [Q30329897](https://www.wikidata.org/wiki/Q30329897). It already has the official website (P856 = `https://www.atomteam.pl/`) and links to both Wikipedia articles. It is in `team.json → profiles` (`verify: false`). Edit that item; don't create a new one.

**Team item.** Add or correct the following, each with a reference to the matching atomteam.pl page (use the "reference URL" property):

- [ ] instance of: a cycling team / women's cycling team item
- [ ] official website (P856): `https://www.atomteam.pl/`
- [ ] inception (P571): 2016
- [ ] headquarters location (P159): Wrocław; country (P17): Poland
- [ ] sport (P641): road cycling (plus track cycling, cyclo-cross)
- [ ] short name (P1813): MADW
- [ ] UCI team code: the confirmed code (search Wikidata properties for "UCI"), only after [VERIFY]
- [ ] logo image (P154): once the SVG logo is on Wikimedia Commons
- [ ] sponsor (P859): Mat Atom Deweloper, NO LIMITED, and the other main partners, with a start-time qualifier of 2026
- [ ] Instagram username (P2003), Facebook ID (P2013), LinkedIn company ID (P4264)
- [ ] the ProCyclingStats, FirstCycling and UCI team identifiers, if those properties exist (search by name)

**Rider items** (for riders who are notable enough to have one, or already do):
- [ ] member of sports team (P54): the team item, with start time 2026 (and end time when she leaves, e.g. Sofia Ungerová → Movistar Team in 2027)
- [ ] country of citizenship (P27); sex or gender (P21)
- [ ] ProCyclingStats cyclist ID (P1663) and the FirstCycling ID, where they exist
- [ ] described at URL: her profile page, e.g. `https://www.atomteam.pl/en/team/sofia-ungerova/`

Then copy the new IDs into the site: `team.json → profiles.wikidata`, and each rider's `profiles` in `riders.json`, setting `"verify": false`.

---

## 3. Wikipedia (PL and EN)

**Conflict of interest:** people paid by or close to the team must not edit the article directly. Disclose the connection on the article's talk page and post an edit request with the sources. Independent editors then apply it. This keeps the article (and the team's reputation) safe.

Requests to make:
- [ ] Infobox: UCI code (after [VERIFY]), website `https://www.atomteam.pl/`, UCI category, founded 2016, sponsors including NO LIMITED.
- [ ] 2026 roster (20 riders: 8 U19, 10 U23, 2 Elite) and 2027 changes once announced.
- [ ] 2026 results: 30 Polish national titles and 58 national-championship medals. Cite independent media (naszosie.pl reports, PZKol results) first and atomteam.pl race pages second.
- [ ] External links: the website, and the English page for en.wikipedia.

Then add the article URLs to `team.json → profiles.wikipediaPl / wikipediaEn`. (Done 8 Oct 2026: both articles exist as "MAT Atom Deweloper Wrocław". The EN infobox listed no website then, so that edit request is still open.)

---

## 4. Cycling databases and directories

Each one needs the same name, code and website. Contact the site's editors where you can't edit yourself.

| Site | What to check or request | Done |
|---|---|---|
| UCI (team registration / UCI team page) | Name, code and category exactly as in section 1; website link | [ ] |
| ProCyclingStats | Team page: name, code, website, 2026 roster; rider pages link to the team | [ ] |
| FirstCycling | Same as above | [ ] |
| CyclingFlash | The site already links each rider's CyclingFlash profile. Check the team page and the website link | [ ] |
| PZKol (Polish Cycling Federation) | Club listing: name, website, contact | [ ] |
| Google Business Profile | Name, category (sports club), Wrocław address or service area, website, photos, hours "by appointment" | [ ] |
| Google Search Console | Verify the domain, submit `https://www.atomteam.pl/sitemap.xml`, check "Pages" and "Enhancements" monthly | [ ] |
| Bing Webmaster Tools | Import from Search Console, submit the sitemap (Bing also feeds Copilot and ChatGPT search) | [ ] |

When a database page is confirmed, add its URL to `team.json → profiles` (and to the riders' `profiles`) and set `"verify": false`. It then appears in the site's structured data as `sameAs`.

---

## 5. Links from Polish cycling media and partners

Ask for links to a **specific page**, not just the home page. Pages that work well:
- race reports → the race page, e.g. `https://www.atomteam.pl/wyscigi/2026/szosowe-mistrzostwa-polski/`
- rider news or transfers → the rider page, e.g. `https://www.atomteam.pl/zespol/sofia-ungerova/`
- equipment or partner news → `https://www.atomteam.pl/sprzet/`
- general → `https://www.atomteam.pl/pytania/` (FAQ) or the home page

| Who | Ask | Done |
|---|---|---|
| naszosie.pl | Link the team name in race reports and transfer news to the race or rider page | [ ] |
| bikeworld.pl | Same | [ ] |
| Other Polish cycling outlets and regional sports media in Wrocław | Same | [ ] |
| NO LIMITED | Link to `/sprzet/` and add the JSON-LD snippet (`docs/no-limited-outreach.md`) | [ ] |
| Mat Atom Deweloper (title sponsor) | A "we sponsor" page or news item linking the home page | [ ] |
| Other main and technical partners (Budus, Accent/Velo, Vittoria, Sidi…) | A mention with a link on their sponsorship or athletes page | [ ] |
| City of Wrocław, Klub Pro / Fundacja Lotto | Their club listings link the website | [ ] |
| Riders | Each rider's Instagram bio links her profile page | [ ] |

Short request template (PL):

> Dzień dobry, prowadzimy nową stronę drużyny Mat Atom Deweloper Wrocław. Każdy wyścig i każda zawodniczka mają tam własną stronę z wynikami i źródłami, np. [link]. Jeśli piszecie o drużynie, będziemy wdzięczni za link do odpowiedniej strony – pomaga to czytelnikom i wyszukiwarkom trafić do aktualnych danych. Dziękujemy! – [imię], kontakt@atomteam.pl

---

## 6. Monthly test: what do AI engines say?

Once a month (first Monday), ask each engine the questions below in a **fresh, logged-out or private session**, in Polish and in English. Log every answer in `docs/geo-tracking.csv`.

**Engines:** ChatGPT (search on), Claude (web search on), Perplexity, Gemini, Google Search (AI Overview), Microsoft Copilot.

**Questions** (these mirror the site's FAQ, plus two control questions):
1. Who is Mat Atom Deweloper Wrocław? / Czym jest drużyna Mat Atom Deweloper Wrocław?
2. Is Mat Atom Deweloper Wrocław a professional team? What UCI level is it?
3. Who rides for Mat Atom Deweloper Wrocław in 2026?
4. What did Mat Atom Deweloper Wrocław win in 2026?
5. Where can I watch Mat Atom Deweloper Wrocław race this season?
6. What bikes and wheels does Mat Atom Deweloper Wrocław use?
7. How can a young rider join the Mat Atom Deweloper Wrocław junior team?
8. How can a company sponsor Mat Atom Deweloper Wrocław?
9. *(control)* What is the UCI code of Mat Atom Deweloper Wrocław?
10. *(control)* Best Polish women's cycling teams 2026. Is MADW mentioned?

**Log per answer:** date, engine, language, question number, correct (yes / partly / no), wrong facts quoted, atomteam.pl cited (yes/no, which URL), other sources cited.

**Track monthly:**
- *Citation rate*: the share of answers citing atomteam.pl. Target: over 50% within six months.
- *Accuracy*: the share of answers with no wrong facts. Watch the UCI code, rider count and wheel brand.
- *Competing sources*: which sites are cited instead. Those are the next outreach targets in section 5.
- If an engine repeats a wrong fact, find where it comes from (usually the old Wix site, an old Wikipedia revision or a database) and fix it there.

**Also monthly:** Search Console → Performance (queries containing the team name), and check that `/llms.txt`, `/sitemap.xml` and the data files still load.

---

## 7. Suggested order
1. Confirm the UCI code and registered name (section 1), and set them in `team.json`.
2. Search Console and Bing Webmaster Tools: submit the sitemap.
3. Wikidata team item; rider items for riders who are notable.
4. ProCyclingStats, FirstCycling, UCI page; add the URLs to `team.json`.
5. Wikipedia edit requests (PL, then EN).
6. NO LIMITED and partner links; media requests.
7. Start the monthly test and keep it going.
