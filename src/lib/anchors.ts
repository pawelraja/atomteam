// Section anchors per language, so /#kalendarz and /en/#calendar point at the same section
// and the language switch can land on the section the visitor is reading.
import type { Lang } from './text';

export type AnchorKey =
  | 'top'
  // home
  | 'numbers'
  | 'approach'
  | 'results'
  | 'team'
  | 'calendar'
  | 'partners'
  | 'for-media'
  | 'gallery'
  // calendar page
  | 'next-race'
  // media page
  | 'facts'
  | 'boilerplate'
  | 'files'
  | 'photos'
  | 'roster'
  // rider page
  | 'profile'
  // media page contact section
  | 'contact'
  | 'newsletter';

export const ANCHORS: Record<Lang, Record<AnchorKey, string>> = {
  pl: {
    top: 'start',
    numbers: 'liczby',
    approach: 'podejscie',
    results: 'wyniki',
    team: 'zespol',
    calendar: 'kalendarz',
    partners: 'partnerzy',
    'for-media': 'dla-mediow',
    gallery: 'galeria',
    'next-race': 'najblizszy-wyscig',
    facts: 'fakty',
    boilerplate: 'notka',
    files: 'pliki',
    photos: 'zdjecia',
    roster: 'sklad',
    profile: 'profil',
    contact: 'kontakt',
    newsletter: 'newsletter',
  },
  en: {
    top: 'top',
    numbers: 'numbers',
    approach: 'approach',
    results: 'results',
    team: 'team',
    calendar: 'calendar',
    partners: 'partners',
    'for-media': 'for-media',
    gallery: 'gallery',
    'next-race': 'next-race',
    facts: 'facts',
    boilerplate: 'boilerplate',
    files: 'files',
    photos: 'photos',
    roster: 'roster',
    profile: 'profile',
    contact: 'contact',
    newsletter: 'newsletter',
  },
};

export function anchor(lang: Lang, key: AnchorKey): string {
  return ANCHORS[lang][key];
}

/** Anchor of one season inside the calendar, e.g. "kalendarz-2026" / "calendar-2026". */
export function seasonAnchor(lang: Lang, season: number): string {
  return `${ANCHORS[lang].calendar}-${season}`;
}
