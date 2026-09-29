import { getImage } from 'astro:assets';
import { findImage } from './images';

export const HERO_MOBILE_MEDIA = '(max-width: 767px)';
export const HERO_DESKTOP_MEDIA = '(min-width: 768px)';

export interface HeroSource {
  srcset: string;
  src: string;
  width: number;
  height: number;
  sizes: string;
}

async function build(file: string, crop: [number, number], widths: number[]): Promise<HeroSource | null> {
  const img = findImage('photos', file);
  if (!img) return null;
  const usable = widths.filter((w) => w <= img.width);
  if (!usable.length) usable.push(img.width);
  const height = Math.round((Math.max(...usable) * crop[1]) / crop[0]);
  const result = await getImage({
    src: img,
    widths: usable,
    width: Math.max(...usable),
    height,
    fit: 'cover',
    format: 'webp',
    quality: 72,
  });
  return {
    srcset: result.srcSet.attribute,
    src: result.src,
    width: Number(result.attributes.width ?? Math.max(...usable)),
    height: Number(result.attributes.height ?? height),
    sizes: '100vw',
  };
}

/**
 * Hero art direction: hero.jpg is cropped 16:9 for desktop, hero-mobile.jpg 4:5 for phones.
 * If only hero.jpg exists it is centre-cropped to 4:5 for phones as well.
 */
export async function heroSources() {
  const desktop = await build('hero.jpg', [16, 9], [960, 1440, 1920, 2560]);
  const mobile =
    (await build('hero-mobile.jpg', [4, 5], [360, 540, 720, 1080])) ??
    (await build('hero.jpg', [4, 5], [360, 540, 720, 1080]));
  return { desktop, mobile };
}
