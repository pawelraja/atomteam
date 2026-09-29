import type { ImageMetadata } from 'astro';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/{photos,riders}/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

const stem = (name: string) => name.replace(/\.[^.]+$/, '').toLowerCase();

const index = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(files)) {
  const [, dir, file] = path.match(/\/src\/assets\/(photos|riders)\/(.+)$/)!;
  index.set(`${dir}/${stem(file)}`, mod.default);
}

export type ImageDir = 'photos' | 'riders';

/**
 * Finds an image by the file name used in the data files. The extension is ignored, so
 * "hero.jpg" in data also matches a supplied "hero.png" or "hero.webp".
 */
export function findImage(dir: ImageDir, file: string): ImageMetadata | undefined {
  return index.get(`${dir}/${stem(file)}`);
}

/** Partner logos live in /public/partners and are used as-is. */
export function partnerLogoExists(file: string): boolean {
  return existsSync(resolve('public/partners', file));
}

export function brandLogoExists(): boolean {
  return existsSync(resolve('public/brand/logo.svg'));
}

export const ratio = (r: string) => r.replace(':', ' / ');
