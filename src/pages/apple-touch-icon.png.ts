// /apple-touch-icon.png: the favicon as a 180×180 PNG for home screens and link previews.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { APIRoute } from 'astro';
import sharp from 'sharp';

export const GET: APIRoute = async () => {
  const svg = readFileSync(resolve('public/favicon.svg'));
  // Full-bleed plum behind the rounded icon: iOS applies its own corner mask.
  const png = await sharp({ create: { width: 180, height: 180, channels: 4, background: '#2b0020' } })
    .composite([{ input: await sharp(svg, { density: 300 }).resize(180, 180).png().toBuffer() }])
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
