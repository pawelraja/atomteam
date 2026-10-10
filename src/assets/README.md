# Image slots

Every picture on the site has a fixed slot. Until a file is supplied, the page shows a grey placeholder with the file name and aspect ratio, so nothing looks broken.

**How to supply a photo:** upload it to the matching folder in the shared Google Drive folder **"MADW Website"** (`hero/`, `photo-story/`, `highlights/`, `riders/`, `partners/`, `brand/`, `media/`, `media-files/`) under the file name below. JPG, PNG or WebP all work; capitals, spaces and Polish letters in the name don't matter. The next build copies it in and makes the small, fast AVIF/WebP versions itself. Use the largest original you have; never upscale.

**Do not** download images from the old Wix site — use originals from the photographers, with permission and a credit.

**Temporary files (October 2026).** Until the high-resolution originals arrive, the team supplied low-resolution copies (max. 1600 px) that are committed to the repo: the hero, gallery photos `photo-01`–`photo-09` and `photo-band-01`, all 25 portraits, the 21 partner logos and `logo.svg` (the hexagon mark, built from a 400 px JPG). Gallery captions describe what each temporary photo shows; credits are still `[autor / credit]`. Still empty: `photo-10`, `photo-11`, `hero-mobile`, the highlight photos and the press library. When an original goes into Drive under the same name, `npm run sync-photos` overwrites the copy. Use the same extension (`.jpg`), or delete the old file, so that two versions of one slot don't exist side by side.

## Hero (`src/assets/photos/`)

| File | Crop | Minimum size | Notes |
|---|---|---|---|
| `hero.jpg` | 16:9 | 2560 × 1440 | Desktop. Keep the lower third calm: the headline sits there on a plum wash. |
| `hero-mobile.jpg` | 4:5 | 1080 × 1350 | Phones. Optional — without it, `hero.jpg` is centre-cropped. |

## Race photos on the home page (`src/assets/photos/`)

Pictures carry the home page. Edit captions, credits ("Fot. …") and alt text in `src/data/gallery.json`; `"use"` says where each photo appears.

**Race-day gallery** (`"use": "story"`, click to enlarge). The first photo runs full width; the other six sit in an even grid of equal 3:4 tiles (the lightbox shows them uncropped), so portrait shots work best:

| File | Crop | Minimum width | Caption |
|---|---|---|---|
| `photo-01.jpg` | 16:9 | 2560 px | Ronde de Mouscron · Mouscron, BEL (the large first photo) |
| `photo-02.jpg` | 3:4 | 1600 px | Umag Classic Ladies · Umag, CRO |
| `photo-03.jpg` | 3:4 | 1600 px | Tour de Pologne Women · POL |
| `photo-04.jpg` | 3:4 | 1600 px | Sowiogórski Tour · POL |
| `photo-05.jpg` | 3:4 | 1600 px | Torowe Mistrzostwa Polski · POL |
| `photo-06.jpg` | 3:4 | 1600 px | Mistrzostwa Polski Drużyn na czas · POL |
| `photo-07.jpg` | 3:4 | 1600 px | Puchar Polski · Lubań, POL |

**Full-width photo** between the chapters (`"use": "band"`): `photo-band-01.jpg`, landscape, at least 2560 px wide, subject near the centre (it is cropped to the screen).

**Photo strip** above the ticker (`"use": "strip"`): four equal portrait frames, photos cropped to fill them:

| File | Shape | Minimum width | Caption |
|---|---|---|---|
| `photo-08.jpg` | portrait | 1200 px | Atak na podjeździe |
| `photo-09.jpg` | portrait | 1200 px | Portret zawodniczki |
| `photo-10.jpg` | portrait | 1200 px | Tor, Pruszków |
| `photo-11.jpg` | portrait | 1200 px | Mechanik przy pracy |

## Season highlights (`src/assets/photos/`)

Shown as cards under the results once their wording is checked (`verify` removed in `highlights-2026.json`).

| File | Crop | Minimum size | Highlight |
|---|---|---|---|
| `highlight-track.jpg` | 4:3 | 1200 × 900 | 9 złotych medali na Młodzieżowych Mistrzostwach Polski na torze. |
| `highlight-mtb.jpg` | 4:3 | 1200 × 900 | Alicja Matuła mistrzynią Polski U23 w maratonie MTB. |
| `highlight-worlds.jpg` | 4:3 | 1200 × 900 | Na starcie w Montrealu. |

## Rider and staff portraits (`src/assets/riders/`)

Portrait 3:4, at least 960 × 1280, ideally in the 2027 kit. File names come from `photo` in `riders.json` / `staff.json`; new riders need a new file with the name you put there.

| File | Person |
|---|---|
| `eliza-rabazynska.jpg` | Eliza Rabażyńska (Continental) |
| `sofia-ungerova.jpg` | Sofia Ungerová (Continental) |
| `olga-wankiewicz.jpg` | Olga Wankiewicz (Continental) |
| `tamara-szalinska.jpg` | Tamara Szalińska (Continental) |
| `maja-tracka.jpg` | Maja Tracka (Continental) |
| `urszula-sipko.jpg` | Urszula Sipko (Continental) |
| `alicja-matula.jpg` | Alicja Matuła (Continental) |
| `gabriela-kaczmarczyk.jpg` | Gabriela Kaczmarczyk (Continental) |
| `daria-debicka.jpg` | Daria Dębicka (Continental) |
| `martyna-szczesna.jpg` | Martyna Szczęsna (Continental) |
| `anna-gaborska.jpg` | Anna Gaborska (Continental) |
| `nadia-hartman.jpg` | Nadia Hartman (Continental) |
| `linda-sitkova.jpg` | Linda Sitková (Junior) |
| `kinga-slomka.jpg` | Kinga Słomka (Junior) |
| `julia-pospiech.jpg` | Julia Pośpiech (Junior) |
| `julia-kolakowska.jpg` | Julia Kołakowska (Junior) |
| `aniela-augustyniak.jpg` | Aniela Augustyniak (Junior) |
| `agata-sekta.jpg` | Agata Sekta (Junior) |
| `zofia-glinka.jpg` | Zofia Glinka (Junior) |
| `natalia-gacek.jpg` | Natalia Gacek (Junior) |
| `paulina-brzezna-bentkowska.jpg` | Paulina Brzeźna-Bentkowska (staff) |
| `pawel-bentkowski.jpg` | Paweł Bentkowski (staff) |
| `katarzyna-wilkos.jpg` | Katarzyna Wilkos (staff) |
| `marcin-zarebski.jpg` | Marcin Zarębski (staff) |
| `szymon-galczynski.jpg` | Szymon Gałczyński (staff) |

## Press photo library (`src/assets/media/`, Drive `media/`)

Full-resolution originals for journalists: **at least 3000 px on the long side** (the build stops on a smaller file). Captions, categories and photographer credits are in `src/data/media.json` → `photos`. Journalists download the original as it is, so export a high-quality JPG.

| File | Category | Caption |
|---|---|---|
| `media-race-01.jpg` | Races | Ronde de Mouscron, Belgium, 2026 |
| `media-race-02.jpg` | Races | Tour de Pologne Women, 2026 |
| `media-track-01.jpg` | Track | Polish Track Championships, 2026 |
| `media-portrait-01.jpg` | Portraits | Rider portrait in team kit |
| `media-team-01.jpg` | Team | Team photo, 2026 season |
| `media-team-02.jpg` | Team | Staff and riders at a training camp |

## Downloads for journalists (`public/media/`, Drive `media-files/`)

Named exactly as in `src/data/media.json` → `files`. After uploading, set that entry's `"status"` to `"ready"`.

| File | What it is |
|---|---|
| `madw-logotypy.zip` | Team logos: colour, black, white; SVG and PNG |
| `madw-informacja-pl.pdf` / `madw-team-information-en.pdf` | Team information, Polish and English |
| `madw-zdjecia-sezonu.zip` | Season photo selection with credits |
| `madw-portrety.zip` | Rider portraits, 3:4 and 1:1 |
| `madw-stroje.zip` | Kit product photos |
| `madw-ksiega-znaku.pdf` | Brand guide |

## Partner logos (`public/partners/`)

SVG preferred (PNG/WebP accepted if the file name in `partners.json` says so). Full colour, trimmed tight to the artwork with no extra margins — the site sizes every logo to the same optical height.

| File | Partner |
|---|---|
| `mat-atom-deweloper.svg` | Mat Atom Deweloper |
| `miasto-wroclaw.svg` | Miasto Wrocław |
| `budus.svg` | Budus |
| `accent.svg` | Accent |
| `no-limited.svg` | NO LIMITED |
| `klub-pro.svg` | Klub Pro — Ministerstwo Sportu i Turystyki / Fundacja Lotto |
| `finish-line.svg` | Finish Line |
| `sidi.svg` | Sidi |
| `met-helmets.svg` | MET Helmets |
| `skoda-gall-icm.svg` | Škoda Gall ICM |
| `park-tool.svg` | Park Tool |
| `quest-sport.svg` | Quest Sport |
| `dolakakol.svg` | Dolakakol |
| `inpeak.svg` | Inpeak |
| `vittoria.svg` | Vittoria |
| `san-marco.svg` | San Marco |
| `jako-sport.svg` | Jako Sport |
| `mpwik-wroclaw.svg` | MPWiK Wrocław |
| `weron.svg` | Weron |
| `namedsport.svg` | NamedSport |
| `connex.svg` | Connex |

## Team logo (`public/brand/`)

| File | Notes |
|---|---|
| `logo.svg` | The team's round logo mark, shown at 40 × 40 px next to the text wordmark in the header (it replaces the dashed "LOGO" circle). Square artwork, dark on transparent (it sits on the light glass header). |
