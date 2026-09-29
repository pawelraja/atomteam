// Section anchors per language, so /#kalendarz and /en/#calendar point at the same section
// and the language switch can land on the section the visitor is reading.
import type { Lang } from './text';
import type { SectionId } from './season';

export type AnchorKey = SectionId | 'top' | 'newsletter';

export const ANCHORS: Record<Lang, Record<AnchorKey, string>> = {
  pl: {
    top: 'start',
    presentation: 'prezentacja',
    glance: 'w-skrocie',
    recap: 'podsumowanie',
    'next-race': 'najblizszy-wyscig',
    story: 'galeria',
    team: 'zespol',
    calendar: 'kalendarz',
    partners: 'partnerzy',
    movement: 'ruch',
    contact: 'kontakt',
    newsletter: 'newsletter',
  },
  en: {
    top: 'top',
    presentation: 'presentation',
    glance: 'at-a-glance',
    recap: 'review',
    'next-race': 'next-race',
    story: 'photos',
    team: 'team',
    calendar: 'calendar',
    partners: 'partners',
    movement: 'movement',
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
