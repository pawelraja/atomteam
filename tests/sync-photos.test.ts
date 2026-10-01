import { describe, expect, it } from 'vitest';
import { expectedSlots, planFile, slugStem } from '../scripts/sync-photos.mjs';

describe('Drive photo sync', () => {
  const slots = expectedSlots();

  it('knows every slot from the data files', () => {
    expect(slots.hero).toEqual(['hero.jpg', 'hero-mobile.jpg']);
    expect(slots.riders).toContain('eliza-rabazynska.jpg');
    expect(slots.partners).toContain('budus.svg');
    expect(slots['photo-story']).toHaveLength(4);
  });

  it('matches names regardless of case, spaces and Polish letters', () => {
    expect(slugStem('Eliza Rabażyńska.JPG')).toBe('eliza-rabazynska');
    expect(planFile('riders', 'Eliza Rabażyńska.JPG', slots.riders)).toEqual({ target: 'eliza-rabazynska.jpg', warning: null });
    expect(planFile('riders', 'Paweł Bentkowski.png', slots.riders)).toEqual({ target: 'pawel-bentkowski.png', warning: null });
  });

  it('keeps the photo format the team uploaded', () => {
    expect(planFile('hero', 'HERO.webp', slots.hero).target).toBe('hero.webp');
  });

  it('warns about names no slot uses, but still copies them', () => {
    const plan = planFile('photo-story', 'IMG_4432.jpg', slots['photo-story']);
    expect(plan.target).toBe('img-4432.jpg');
    expect(plan.warning).toMatch(/no slot/);
  });

  it('insists on the exact logo format named in partners.json', () => {
    expect(planFile('partners', 'Budus.svg', slots.partners)).toEqual({ target: 'budus.svg', warning: null });
    const png = planFile('partners', 'Budus.png', slots.partners);
    expect(png.target).toBeNull();
    expect(png.warning).toMatch(/expects "budus.svg"/);
  });

  it('skips files the site cannot use', () => {
    expect(planFile('riders', 'notes.docx', slots.riders).target).toBeNull();
    expect(planFile('partners', 'deck-2027.pdf', slots.partners).target).toBe('deck-2027.pdf');
  });
});

describe('Drive sync for the media centre', () => {
  const slots = expectedSlots();
  it('knows the press photos and the downloads from media.json', () => {
    expect(slots.media).toContain('media-race-01.jpg');
    expect(slots['media-files']).toEqual(expect.arrayContaining(['madw-logotypy.zip', 'madw-informacja-pl.pdf', 'madw-team-information-en.pdf']));
  });
  it('copies downloads under the exact name media.json uses', () => {
    expect(planFile('media-files', 'MADW Logotypy.zip', slots['media-files'])).toEqual({ target: 'madw-logotypy.zip', warning: null });
    expect(planFile('media-files', 'notes.docx', slots['media-files']).target).toBeNull();
  });
});
