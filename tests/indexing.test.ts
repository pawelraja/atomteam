import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import redirects from '../src/data/redirects.json';
import { siteIndexable } from '../src/lib/indexing.mjs';

describe('indexing switches on by itself at launch', () => {
  const vercel = (domain: string, env = 'production') => ({ VERCEL: '1', VERCEL_ENV: env, VERCEL_PROJECT_PRODUCTION_URL: domain });
  it('keeps the temporary vercel.app address out of search', () => {
    expect(siteIndexable(vercel('atomteam.vercel.app'))).toBe(false);
  });
  it('indexes once the team domain is attached (with or without www)', () => {
    expect(siteIndexable(vercel('www.atomteam.pl'))).toBe(true);
    expect(siteIndexable(vercel('atomteam.pl'))).toBe(true);
  });
  it('never indexes preview deployments', () => {
    expect(siteIndexable(vercel('www.atomteam.pl', 'preview'))).toBe(false);
  });
  it('treats local and CI builds as live, and honours the override', () => {
    expect(siteIndexable({})).toBe(true);
    expect(siteIndexable({ SITE_INDEXING: 'off' })).toBe(false);
    expect(siteIndexable({ ...vercel('atomteam.vercel.app'), SITE_INDEXING: 'on' })).toBe(true);
  });
});

describe('deployment settings', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  it('blocks the vercel.app address from search even after launch', () => {
    const rule = config.headers.find((h: { has?: { value: string }[] }) => h.has?.some((x) => x.value.includes('vercel')));
    expect(rule.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
  });
  it('runs the SEO checks on every deploy', () => {
    expect(config.buildCommand).toContain('npm run check:site');
  });
  it('lists old addresses as { from, to } site paths', () => {
    for (const r of redirects as { from: string; to: string }[]) {
      expect(r.from).toMatch(/^\/[^\s]*$/);
      expect(r.to).toMatch(/^\/[^\s]*\/$|^\/[^\s]*#/);
    }
  });
});
