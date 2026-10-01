import type { ImageMetadata } from 'astro';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/{photos,riders,media}/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

const stem = (name: string) => name.replace(/\.[^.]+$/, '').toLowerCase();

const index = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(files)) {
  const [, dir, file] = path.match(/\/src\/assets\/(photos|riders|media)\/(.+)$/)!;
  index.set(`${dir}/${stem(file)}`, mod.default);
}

export type ImageDir = 'photos' | 'riders' | 'media';

/** Press-library originals must be at least this long on the long side. */
export const MEDIA_MIN_LONG_SIDE = 3000;

/**
 * Finds an image by the file name used in the data files. The extension is ignored, so
 * "hero.jpg" in data also matches a supplied "hero.png" or "hero.webp".
 */
export function findImage(dir: ImageDir, file: string): ImageMetadata | undefined {
  return index.get(`${dir}/${stem(file)}`);
}

/** The original file behind an image slot (for direct downloads), or undefined if not supplied. */
export function findOriginal(dir: ImageDir, file: string): { path: string; name: string; width: number; height: number } | undefined {
  const img = findImage(dir, file);
  if (!img) return undefined;
  const hit = Object.keys(files).find((p) => p.startsWith(`/src/assets/${dir}/`) && stem(p.split('/').pop()!) === stem(file))!;
  const name = hit.split('/').pop()!;
  return { path: resolve(`src/assets/${dir}`, name), name: name.toLowerCase(), width: img.width, height: img.height };
}

/** Fails the build when a press-library photo is too small to be useful in print. */
export function assertPressQuality(file: string) {
  const o = findOriginal('media', file);
  if (o && Math.max(o.width, o.height) < MEDIA_MIN_LONG_SIDE) {
    throw new Error(
      `Problem with src/assets/media/${o.name}: it is ${o.width} × ${o.height} px. Press photos must be at least ${MEDIA_MIN_LONG_SIDE} px on the long side.\n` +
        "  Upload the photographer's original instead of a resized copy.",
    );
  }
  return o;
}

/** Partner logos live in /public/partners and are used as-is. */
export function partnerLogoExists(file: string): boolean {
  return existsSync(resolve('public/partners', file));
}

export function brandLogoExists(): boolean {
  return existsSync(resolve('public/brand/logo.svg'));
}

export const ratio = (r: string) => r.replace(':', ' / ');
