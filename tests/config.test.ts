import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Vercel rejects the whole deployment when vercel.json is not valid JSON
// (e.g. "\." instead of "\\." in a regex), so check it with the other tests.
describe('vercel.json', () => {
  it('is valid JSON with the expected build settings', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    expect(config.outputDirectory).toBe('dist');
    expect(config.buildCommand).toContain('npm run build');
    for (const h of config.headers) expect(() => new RegExp(h.source)).not.toThrow();
  });

  it('keeps the temporary *.vercel.app address out of search results, and only that address', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const rule = config.headers.find((h: { headers: { key: string }[] }) => h.headers.some((x) => x.key === 'X-Robots-Tag'));
    const host = new RegExp(`^${rule.has[0].value}$`);
    expect(host.test('atomteam.vercel.app')).toBe(true);
    expect(host.test('atomteam-git-feature-pawelraja.vercel.app')).toBe(true);
    expect(host.test('www.atomteam.pl')).toBe(false);
    expect(host.test('atomteam.pl')).toBe(false);
  });
});
