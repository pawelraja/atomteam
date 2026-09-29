# Race calendars

One file per season. `2026.json` is the archive; `2027.json` is the current season.

`2027.json` began as a **draft generated from 2026** (`npm run draft-season -- 2026 2027`): every 2026 race except training, in the same month, with `"status": "tbc"` and **no dates**. No 2027 date was invented.

As the season takes shape:

- **When an organiser publishes dates:** replace `"month": 4` with `"start": "2027-04-05", "end": "2027-04-05"` (same day for one-day races) and set `"status": "confirmed"`.
- **Races the team won't ride:** delete the line.
- **New races:** add a line (with dates if known, otherwise `month` + `"status": "tbc"`).
- **Cancelled races:** set `"status": "cancelled"` (the line stays, struck through).

Only `confirmed` races become "Next race", get an "Add to calendar" button, and appear in `/calendar-2027.ics`. Full field reference: `README.md` → Race calendar.
