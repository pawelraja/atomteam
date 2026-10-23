// Share images (Open Graph, 1200×630) for rider and race pages, rendered at build time with sharp,
// in the same plum card style as /og-pl.png. Riders get their portrait on the right.
import sharp from 'sharp';
import { copy, type Lang } from './i18n';

export const OG = { width: 1200, height: 630 } as const;

export const ogPaths = {
  rider: (lang: Lang, slug: string) => `/og/${lang}/rider/${slug}.jpg`,
  race: (lang: Lang, season: number, slug: string) => `/og/${lang}/race/${season}/${slug}.png`,
};

const FONT = 'Inter, Arial, Helvetica, sans-serif';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Breaks a title into at most `max` lines of about `width` characters; the last line ends in "…" if cut. */
export function wrap(text: string, width: number, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  kept[max - 1] = kept[max - 1].replace(/[\s,.;:–-]*$/, '') + '…';
  return kept;
}

interface Card {
  lang: Lang;
  eyebrow: string;
  title: string;
  lines: string[];
  /** Width left for the text, e.g. when a portrait takes the right side. */
  textWidth?: number;
}

function cardSvg({ lang, eyebrow, title, lines, textWidth = OG.width - 128 }: Card): string {
  const t = copy(lang);
  // ~0.55 em per character at this size keeps long race names inside the card.
  const size = title.length > 60 ? 56 : 72;
  const titleLines = wrap(title, Math.floor(textWidth / (size * 0.55)), 3);
  const titleTop = 210;
  const lineHeight = size * 1.1;
  const after = titleTop + titleLines.length * lineHeight + 24;
  const pill = Math.min(eyebrow.length * 13 + 48, textWidth);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${OG.width}" height="${OG.height}" viewBox="0 0 ${OG.width} ${OG.height}">
  <rect width="${OG.width}" height="${OG.height}" fill="#2b0020"/>
  <rect x="64" y="64" width="${pill}" height="52" rx="26" fill="none" stroke="#ff66ed" stroke-width="2"/>
  <text x="88" y="98" font-family="${FONT}" font-size="24" fill="#ff66ed">${esc(eyebrow)}</text>
  ${titleLines.map((l, i) => `<text x="64" y="${titleTop + i * lineHeight}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#f1eef3" letter-spacing="-1">${esc(l)}</text>`).join('\n  ')}
  ${lines.map((l, i) => `<text x="64" y="${after + i * 46}" font-family="${FONT}" font-size="32" fill="#c0b8be">${esc(l)}</text>`).join('\n  ')}
  <text x="64" y="560" font-family="${FONT}" font-size="28" fill="#f1eef3"><tspan font-weight="700">${esc(t.team.wordmarkLead)}</tspan> ${esc(t.team.wordmarkA)} <tspan font-weight="700">${esc(t.team.wordmarkB)}</tspan></text>
  <rect x="0" y="622" width="${OG.width}" height="8" fill="#ff66ed"/>
</svg>`;
}

/** A text-only card (race pages): a few flat colours, so a palette PNG stays small. */
export async function textCard(card: Card): Promise<Buffer> {
  return sharp(Buffer.from(cardSvg(card))).png({ palette: true, compressionLevel: 9 }).toBuffer();
}

const PORTRAIT_WIDTH = 440;

/** A JPEG card with the rider's portrait on the right (text only, still JPEG, without a photo). */
export async function portraitCard(card: Card, portrait: string | null): Promise<Buffer> {
  if (!portrait) return sharp(Buffer.from(cardSvg(card))).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  const textWidth = OG.width - PORTRAIT_WIDTH - 128;
  const photo = await sharp(portrait).resize(PORTRAIT_WIDTH, OG.height - 8, { fit: 'cover', position: 'top' }).toBuffer();
  return sharp(Buffer.from(cardSvg({ ...card, textWidth })))
    .composite([{ input: photo, left: OG.width - PORTRAIT_WIDTH, top: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
