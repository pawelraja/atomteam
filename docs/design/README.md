# Design mockups — how to read them

These six files are the approved v2 mockups exported from the design canvas. They are **reference, not production code**. Rebuild the pages as real Astro components from the tokens and data; don't copy this markup wholesale.

| File | Page | Width |
|---|---|---|
| `Home-PL.dc.html` | Home, Polish (default) | desktop 1440 |
| `Home-EN.dc.html` | Home, English | desktop 1440 |
| `Media-PL.dc.html` | Media centre, Polish | desktop 1440 |
| `Media-EN.dc.html` | Media centre, English | desktop 1440 |
| `Home-PL-Mobile.dc.html` | Home, Polish | mobile 390 |
| `Home-EN-Mobile.dc.html` | Home, English | mobile 390 |

## Reading the format
- The page is the markup inside `<x-dc> … </x-dc>`. Styles are inline, and every colour, size and radius matches `design-system/tokens.json`.
- `{{ name }}` is a value filled from `renderVals()` in the `<script type="text/x-dc">` block at the bottom of the file. That block also holds the lists (riders, results, calendar teaser, files, photos) and the tab/filter state.
- `<sc-for list="{{ items }}" as="x">` repeats its content for each item. `<sc-if value="{{ flag }}">` shows its content only when the flag is true.
- `<script src="./support.js">` is the canvas runtime and is not included. The files won't render standalone in a browser, so read them as source.
- Coloured blocks with a filename label (for example `hero.jpg · 16:9`) are photo placeholders. Text in `[brackets]` is a placeholder for the team to fill in.
- The wording is approved copy. Use it to seed `copy.pl.json` and `copy.en.json`.
