A bold, sporty system for a women's pro-cycling team: black type on white, a hot pink action colour, violet emphasis, and deep plum sections. Shapes are soft (pills, 30–40px corners) and shadows are hard offsets, never blurred.

## Content fundamentals

- Voice is proud, energetic and inclusive: short declarative lines ("We are for women's cycling. Since 2016."), then a warmer paragraph.
- Address fans as "you", speak as "we". Sentence case for headings, ending with a full stop: "Meet the riders.", "Meet the staff."
- Uppercase is reserved for emphasis on a single term inside a sentence: "Let us introduce our CONTINENTAL TEAM."
- Hashtags run as a repeating ticker in large `h2` type (e.g. `#allezatomówki`).
- Captions pair a name with a slash-prefixed tag: "Maja Tracka /POL", "Paweł Bentkowski / Team Manager".
- No emoji.

## Visual foundations

**Colour.** `ink` on `surface` for all running copy. `accent` (pink) is the action colour: primary buttons, links, outline buttons, highlighted headline words. `accent-strong` (violet) is for bold emphasis lines. Alternate plain white sections with `surface-alt` (lilac mist) bands and with deep plum sections (switch to the Dark theme: `plum-500` ground, `lilac-mist` type, `accent` headlines).

**Contrast rules.** `accent` text on white is 2.5:1 and fails — on light grounds use it only for fills, borders and decorative display type; for readable pink-family text use `accent-strong`. On plum, `accent` text passes (7.5:1). The site's white label on pink buttons (`on-accent`) also fails; prefer `ink-on-accent` for new work.

**Type.** One family, Inter (Google Fonts), almost always at regular weight; bold appears only in `h6` leads and inline emphasis. Headlines are large and light: `h2` 42px/50.4px is the workhorse. Running copy is small: `body-small` 14px/19.6px.

**Shape.** Buttons are full pills (`radius-pill`). Cards use `radius-card` (30px); the floating header and feature media use `radius-lg` (40px).

**Depth.** No blur shadows. Cards sit on a hard 5px downward offset: `shadow-card` (pink, 35%) or `shadow-feature` (violet, 70%).

**Header.** A floating 64px pill bar in `header-glass` over hero photography, wordmark left, icons and a pink hamburger right.

**Imagery.** Full-bleed race and team photography; portrait rider photos cropped 3:4 inside cards.

**Focus.** 2px solid `focus` ring, 2px offset.

## Iconography

The site uses a single Instagram glyph and a pink three-line hamburger; there is no icon set. Use simple single-ink line icons in `ink` or `accent`.

## Logo

No logo files are included. Add the team's official marks under `assets/Logos/` if you hold the rights to use them; until then set the name in plain type.
