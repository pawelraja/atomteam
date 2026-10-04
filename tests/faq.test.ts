import { describe, expect, it } from 'vitest';
import { checkGraph } from '../scripts/check-jsonld.mjs';
import { factVars, teamFacts } from '../src/lib/facts';
import { faqItems } from '../src/lib/faq';
import { copy, LANGS } from '../src/lib/i18n';
import { faqPage, graph } from '../src/lib/jsonld';

describe('answer-first facts come from data', () => {
  // The headline figures in CLAUDE.md, computed — never typed.
  it('matches the confirmed 2026 numbers', () => {
    const f = teamFacts();
    expect(f.roster.season).toBe(2026);
    expect(f.roster.split).toMatchObject({ total: 20, U19: 8, U23: 10, Elite: 2 });
    expect(f.honours).toMatchObject({ season: 2026, titles: 30, medals: 58 });
    expect(f.numbers).toMatchObject({ season: 2026, races: 47, countries: 13 });
    expect(f.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('writes numbers with the right Polish plural forms', () => {
    // Polish typography binds numbers to the next word with a no-break space.
    const v = Object.fromEntries(Object.entries(factVars('pl')).map(([k, x]) => [k, String(x).replace(/\u00a0/g, ' ')]));
    expect(v.riders).toBe('20 zawodniczek');
    expect(v.titles).toBe('30 tytułów mistrzyń Polski');
    expect(v.medals).toBe('58 medali mistrzostw Polski');
    expect(v.countries).toBe('13 krajach');
  });
});

describe('FAQ', () => {
  it('has the same questions in both languages, all filled in', () => {
    const ids = LANGS.map((l) => faqItems(l).map((i) => i.id));
    expect(ids[0]).toEqual(ids[1]);
    for (const lang of LANGS) {
      for (const it of faqItems(lang)) {
        expect(`${it.q} ${it.a}`, `${lang}/${it.id}`).not.toMatch(/[{}]|undefined|NaN/);
        expect(it.a.length, `${lang}/${it.id}`).toBeGreaterThan(80);
      }
    }
  });

  it('answers the key questions with checkable dates and numbers', () => {
    const en = Object.fromEntries(faqItems('en').map((i) => [i.id, i.a]));
    expect(en.riders).toMatch(/^As of \d{1,2} \w+ \d{4}, the 2026 roster has 20 riders: 8 U19, 10 U23 and 2 Elite\./);
    expect(en.results).toContain('30 Polish national titles');
    expect(en.equipment).toContain('NO LIMITED carbon wheels');
    expect(en.junior).toContain('kontakt@atomteam.pl');
  });

  it('produces valid FAQPage structured data', () => {
    for (const lang of LANGS) {
      const items = faqItems(lang);
      const node = faqPage({ origin: 'https://www.atomteam.pl', lang }, 'https://www.atomteam.pl/en/faq/', copy(lang).faq.title, items);
      const site = { '@type': 'WebSite', '@id': 'https://www.atomteam.pl/#website', name: 'x', url: 'https://www.atomteam.pl/' };
      const team = { '@type': 'SportsTeam', '@id': 'https://www.atomteam.pl/#team', name: 'x', url: 'https://www.atomteam.pl/' };
      expect(checkGraph(graph([site, team, node]))).toEqual([]);
      expect(node.mainEntity).toHaveLength(items.length);
    }
  });
});
