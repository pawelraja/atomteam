import { describe, expect, it } from 'vitest';
import en from '../src/content/copy.en.json';
import pl from '../src/content/copy.pl.json';
import { copy, copyParityProblems } from '../src/lib/i18n';
import { fill, plural, typographyPl } from '../src/lib/text';
import { formatRange, monthLabel } from '../src/lib/season';
import { ANCHORS } from '../src/lib/anchors';

describe('copy files', () => {
  it('have identical keys in PL and EN', () => {
    expect(copyParityProblems({ pl, en })).toEqual([]);
  });

  it('report a missing key with its name and language', () => {
    const broken = structuredClone(en) as Record<string, any>;
    delete broken.hero.title;
    expect(copyParityProblems({ pl, en: broken })).toContain('copy.en.json is missing "hero.title" (present in copy.pl.json)');
  });

  it('have no emoji', () => {
    const emoji = /\p{Emoji_Presentation}/u;
    expect(JSON.stringify(pl)).not.toMatch(emoji);
    expect(JSON.stringify(en)).not.toMatch(emoji);
  });
});

describe('Polish typography', () => {
  it('binds one-letter words and numbers to the next word', () => {
    expect(typographyPl('Skład na 2027 ogłosimy w 2027 i U23')).toBe('Skład na 2027 ogłosimy w 2027 i U23');
    expect(typographyPl('i w domu')).toBe('i w domu');
    expect(typographyPl('20 zawodniczek')).toBe('20 zawodniczek');
  });

  it('is applied to Polish copy but not English', () => {
    expect(copy('pl').glance.since.label).toContain('w {season}');
    expect(copy('en').glance.since.label).not.toContain(' ');
  });

  it('is applied after placeholders are filled', () => {
    expect(fill('{n} dni', { n: 5 }, 'pl')).toBe('5 dni');
  });
});

describe('plurals', () => {
  const riders = copy('pl').glance.riders.value;
  it('use Polish plural categories', () => {
    expect(plural(riders, 1, 'pl')).toBe('1 zawodniczka');
    expect(plural(riders, 3, 'pl')).toBe('3 zawodniczki');
    expect(plural(riders, 20, 'pl')).toBe('20 zawodniczek');
    expect(plural(riders, 22, 'pl')).toBe('22 zawodniczki');
  });
  it('use English plural categories', () => {
    expect(plural(copy('en').glance.riders.value, 1, 'en')).toBe('1 rider');
    expect(plural(copy('en').glance.riders.value, 20, 'en')).toBe('20 riders');
  });
});

describe('dates per locale', () => {
  it('formats Polish and English ranges', () => {
    expect(formatRange('2027-01-09', '2027-01-11', 'pl-PL')).toBe('9–11 sty');
    expect(formatRange('2027-01-09', '2027-01-11', 'en-GB')).toBe('9–11 Jan');
  });
  it('capitalises month headings', () => {
    expect(monthLabel(1, 'pl-PL')).toBe('01/ Styczeń');
    expect(monthLabel(1, 'en-GB')).toBe('01/ January');
  });
});

describe('anchors', () => {
  it('exist for every section in both languages, and are unique', () => {
    expect(Object.keys(ANCHORS.pl).sort()).toEqual(Object.keys(ANCHORS.en).sort());
    for (const lang of ['pl', 'en'] as const) {
      const values = Object.values(ANCHORS[lang]);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});
