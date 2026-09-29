# Image slots

Every picture on the site has a fixed slot. Until a file is supplied, the page shows a grey placeholder with the file name and aspect ratio, so nothing looks broken.

**How to supply a photo:** save it under the exact file name below. JPG, PNG or WebP all work (the extension is ignored, the name is not). The site makes the small, fast AVIF/WebP versions itself. Use the largest original you have; never upscale.

**Do not** download images from the old Wix site — use originals from the photographers, with permission and a credit.

## Hero (`src/assets/photos/`)

| File | Crop | Minimum size | Notes |
|---|---|---|---|
| `hero.jpg` | 16:9 | 2560 × 1440 | Desktop. Keep the lower third calm: the headline sits there on a plum wash. |
| `hero-mobile.jpg` | 4:5 | 1080 × 1350 | Phones. Optional — without it, `hero.jpg` is centre-cropped. |

## Photo story (`src/assets/photos/`)

Edit captions, credits and alt text in `src/data/gallery.json`.

| File | Crop | Minimum width | Caption |
|---|---|---|---|
| `photo-01.jpg` | 16:9 | 2400 px | Ronde de Mouscron · Mouscron, BEL (feature image) |
| `photo-02.jpg` | 3:4 | 1600 px | Umag Classic Ladies · Umag, CRO |
| `photo-03.jpg` | 4:3 | 1600 px | Tour de Pologne Women · POL |
| `photo-04.jpg` | 3:4 | 1600 px | Sowiogórski Tour · POL |
| `photo-05.jpg` | 4:3 | 1600 px | Torowe Mistrzostwa Polski · POL |
| `photo-06.jpg` | 16:9 | 2400 px | Mistrzostwa Polski Drużyn na czas · POL |
| `photo-07.jpg` | 3:4 | 1600 px | Puchar Polski · Lubań, POL |

## Season highlights (`src/assets/photos/`)

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

## Partner logos (`public/partners/`)

SVG preferred (PNG/WebP accepted if the file name in `partners.json` says so). Full colour, trimmed tight to the artwork with no extra margins — the site sizes every logo to the same optical height.

| File | Partner |
|---|---|
| `mat-atom-deweloper.svg` | Mat Atom Deweloper |
| `miasto-wroclaw.svg` | Miasto Wrocław |
| `budus.svg` | Budus |
| `accent.svg` | Accent |
| `no-limited.svg` | No Limited |
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
| `logo.svg` | Official wordmark for the header. When present it replaces the text wordmark automatically. Dark artwork (it sits on the light header). |

## Partner deck

Put the PDF in `public/partners/` (e.g. `deck-2027.pdf`) and set `"partnerDeckUrl": "/partners/deck-2027.pdf"` in `src/data/site.json`. The download button appears only then.
