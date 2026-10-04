import { afterEach, describe, expect, it, vi } from 'vitest';
import { faqItems } from '../src/lib/faq';
import { newsletterConfig } from '../src/lib/newsletter';
import { dataFile, DATA_FILES, type DataFile } from '../src/lib/opendata';

const parse = (f: DataFile) => JSON.parse(dataFile(f));

describe('public data files', () => {
  it('share one envelope: version, updated, documentation, attribution', () => {
    for (const f of Object.keys(DATA_FILES) as DataFile[]) {
      const d = parse(f);
      expect(d.version).toBe(1);
      expect(d.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(d.documentation.en).toBe('https://www.atomteam.pl/en/developers/');
      expect(d.attribution).toContain('https://www.atomteam.pl/');
    }
  });

  it('match the numbers on the site', () => {
    expect(parse('riders').data).toHaveLength(20);
    expect(parse('team').data.roster).toMatchObject({ season: 2026, riders: 20, U19: 8, U23: 10, Elite: 2 });
    expect(parse('team').data.honours).toMatchObject({ titles: 30, medals: 58 });
    expect(parse('results').data.length).toBeGreaterThan(400);
  });

  it('keep unconfirmed values out and flag unchecked results', () => {
    const team = parse('team').data;
    expect(team.uciCode).toBeNull();
    expect(team.legalName).toBeNull();
    expect(JSON.stringify(parse('races'))).not.toMatch(/VERIFY/);
    const rows = parse('results').data as { checkedByTeam: boolean; source: string }[];
    expect(rows.every((r) => typeof r.checkedByTeam === 'boolean' && r.source.startsWith('http'))).toBe(true);
  });

  it('use ISO country codes next to the UCI ones', () => {
    const nl = (parse('races').data as { country: { uci: string; iso: string } | null }[]).find((r) => r.country?.uci === 'NED');
    expect(nl?.country?.iso).toBe('NL');
  });
});

describe('newsletter provider', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('uses MailerLite when its ids are set', () => {
    vi.stubEnv('MAILERLITE_ACCOUNT_ID', '123');
    vi.stubEnv('MAILERLITE_FORM_ID', '456');
    expect(newsletterConfig()).toMatchObject({ mode: 'mailerlite', action: 'https://assets.mailerlite.com/jsonp/123/forms/456/subscribe', emailField: 'fields[email]' });
  });
  it('rejects ids that are not numbers', () => {
    vi.stubEnv('MAILERLITE_ACCOUNT_ID', 'abc');
    vi.stubEnv('MAILERLITE_FORM_ID', '456');
    expect(() => newsletterConfig()).toThrow(/numbers/);
  });
  it('explains that sign-ups open soon without a provider', () => {
    vi.stubEnv('MAILERLITE_ACCOUNT_ID', '');
    vi.stubEnv('NEWSLETTER_ENDPOINT', '');
    expect(newsletterConfig().mode).toBe('off');
  });
});

describe('agent actions in the FAQ', () => {
  it('turn applications and partnership questions into email links with a subject', () => {
    for (const lang of ['pl', 'en'] as const) {
      const links = Object.fromEntries(faqItems(lang).map((i) => [i.id, i.link?.href]));
      expect(links.junior).toMatch(/^mailto:kontakt@atomteam\.pl\?subject=\S+$/);
      expect(links.sponsor).toMatch(/^mailto:kontakt@atomteam\.pl\?subject=\S+$/);
    }
  });
});
