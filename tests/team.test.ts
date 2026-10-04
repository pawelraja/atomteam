import { describe, expect, it } from 'vitest';
import en from '../src/content/copy.en.json';
import pl from '../src/content/copy.pl.json';
import riders from '../src/data/riders.json';
import { copy } from '../src/lib/i18n';
import { legalName, TEAM, teamSameAs, uciCode } from '../src/lib/team';

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) strings(v, out);
  return out;
}

describe('team.json is the single source of team facts', () => {
  it('copy files never type the team name, UCI status or e-mail (they use {TEAM}, {UCI_STATUS}, {EMAIL})', () => {
    for (const [lang, dict] of Object.entries({ pl, en })) {
      const offenders = strings(dict).filter(
        (s) => s.includes(TEAM.name) || s.includes(TEAM.uciStatus.label) || s.includes(TEAM.contact.email) || Object.values(TEAM.social).some((u) => s.includes(u)),
      );
      expect(offenders, `copy.${lang}.json`).toEqual([]);
    }
  });

  it('fills the tokens from team.json in both languages', () => {
    for (const lang of ['pl', 'en'] as const) {
      const t = copy(lang);
      expect(strings(t).filter((s) => /\{[A-Z_]+\}/.test(s))).toEqual([]);
      expect(t.team.name).toBe(TEAM.name);
      expect(t.team.email).toBe(TEAM.contact.email);
      expect(t.meta.title).toContain(TEAM.name);
    }
  });

  it('never exposes unconfirmed facts', () => {
    if (TEAM.uciCode.verify) expect(uciCode()).toBeNull();
    if (TEAM.officialName.verify) expect(legalName()).toBeNull();
    const unconfirmed = Object.values(TEAM.profiles).filter((p) => p.verify && p.url).map((p) => p.url);
    for (const u of unconfirmed) expect(teamSameAs()).not.toContain(u);
  });

  it('gives every rider their own Instagram handle', () => {
    const handles = riders.map((r) => r.instagram).filter(Boolean);
    expect(new Set(handles).size).toBe(handles.length);
  });
});
