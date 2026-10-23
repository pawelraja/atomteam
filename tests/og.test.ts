import { describe, expect, it } from 'vitest';
import { faqItems } from '../src/lib/faq';
import { LANGS } from '../src/lib/i18n';
import { ogPaths, wrap } from '../src/lib/og';
import { raceListNodes, rosterListNodes } from '../src/lib/pageld';
import { TEAM } from '../src/lib/team';

describe('share images', () => {
  it('wraps a long race name and marks a cut with an ellipsis', () => {
    expect(wrap('Młodzieżowe Mistrzostwa Polski na torze', 24, 3)).toEqual(['Młodzieżowe Mistrzostwa', 'Polski na torze']);
    const cut = wrap('one two three four five six seven eight', 9, 2);
    expect(cut).toHaveLength(2);
    expect(cut[1].endsWith('…')).toBe(true);
  });

  it('gives every rider and race its own address per language', () => {
    expect(ogPaths.rider('pl', 'olga-wankiewicz')).toBe('/og/pl/rider/olga-wankiewicz.jpg');
    expect(ogPaths.race('en', 2026, 'nxt-classic')).toBe('/og/en/race/2026/nxt-classic.png');
  });
});

describe('list structured data', () => {
  it('lists every rider profile on the team page and every race page on the calendar', () => {
    for (const lang of LANGS) {
      const [roster] = rosterListNodes(lang) as { numberOfItems: number; itemListElement: { position: number; url: string }[] }[];
      expect(roster.numberOfItems).toBe(20);
      expect(roster.itemListElement[0].position).toBe(1);
      expect(roster.itemListElement.every((it) => it.url.startsWith(TEAM.website))).toBe(true);
      const [races] = raceListNodes(lang) as { numberOfItems: number }[];
      expect(races.numberOfItems).toBeGreaterThan(50);
    }
  });
});

describe('FAQ: UCI code and roster split', () => {
  it('states the confirmed UCI code and how the two squads add up', () => {
    const level = faqItems('en').find((i) => i.id === 'level')!;
    const riders = faqItems('en').find((i) => i.id === 'riders')!;
    if (!TEAM.uciCode.verify) expect(level.a).toContain(`UCI code is ${TEAM.uciCode.value}`);
    expect(riders.a).toMatch(/registered with the UCI has 12 riders; the other 8 riders form the junior team/);
    for (const lang of LANGS) for (const it of faqItems(lang)) expect(it.a).not.toMatch(/ {2}|\s$/);
  });
});
