import { describe, expect, it } from 'vitest';
import { rssFeed } from '../src/lib/feed';
import { LANGS } from '../src/lib/i18n';
import { equipmentMarkdown, faqMarkdown, llmsFullTxt, llmsTxt, racesMarkdown, teamMarkdown } from '../src/lib/markdown';
import { GET as robots } from '../src/pages/robots.txt';

const docs = (lang: 'pl' | 'en') => ({ team: teamMarkdown(lang), races: racesMarkdown(lang), equipment: equipmentMarkdown(lang), faq: faqMarkdown(lang) });

describe('text versions for AI assistants', () => {
  it('fill every placeholder and never leak unconfirmed values', () => {
    for (const lang of LANGS) {
      for (const [name, md] of Object.entries({ ...docs(lang), llms: llmsTxt(), full: llmsFullTxt() })) {
        expect(md, `${lang}/${name}`).not.toMatch(/\{[A-Za-z_]+\}|undefined|NaN|\[VERIFY/);
        expect(md.startsWith('# '), `${lang}/${name}`).toBe(true);
      }
    }
  });

  it('carry the checkable facts', () => {
    const full = llmsFullTxt();
    expect(full).toContain('20 riders – 8 U19, 10 U23 and 2 Elite');
    expect(full).toContain('30 Polish national titles');
    expect(full).toContain('NO LIMITED carbon wheels');
    expect(full).toContain('Sofia Ungerová');
  });

  it('llms.txt follows the llmstxt.org shape: H1, summary quote, link sections', () => {
    const txt = llmsTxt();
    expect(txt).toMatch(/^# .+\n\n> .+/);
    expect(txt).toMatch(/^## /m);
    expect(txt).toContain('https://www.atomteam.pl/team.md');
  });
});

describe('robots.txt', () => {
  it('names every search and AI crawler with a comment, and the sitemap', async () => {
    const body = await (robots as () => Response)().text();
    for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended']) {
      expect(body).toMatch(new RegExp(`# .+\\nUser-agent: ${bot}\\nAllow: /`));
    }
    expect(body).toContain('Sitemap: https://www.atomteam.pl/sitemap.xml');
  });
});

describe('RSS', () => {
  it('lists race results newest first with valid dates', () => {
    const xml = rssFeed('en');
    const dates = [...xml.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map((m) => Date.parse(m[1]));
    expect(dates.length).toBeGreaterThan(10);
    expect(dates.every((d, i) => !Number.isNaN(d) && (i === 0 || d <= dates[i - 1]))).toBe(true);
  });
});
