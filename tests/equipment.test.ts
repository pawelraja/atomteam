import { describe, expect, it } from 'vitest';
import { checkGraph } from '../scripts/check-jsonld.mjs';
import { getData } from '../src/lib/data';
import { podiums, visible, wheelPodiums, wheelProducts, wheelsFor } from '../src/lib/equipment';
import { graph } from '../src/lib/jsonld';

const ctx = { origin: 'https://www.atomteam.pl', lang: 'en' as const };
const race = { season: 2026, discipline: 'ROAD' as const, training: false, onTeamCalendar: true };

describe('wheel partnership', () => {
  it('names the wheel partner exactly as partners.json does', () => {
    const { equipment, partners } = getData();
    expect(equipment.wheels.partner).toBe('NO LIMITED');
    expect(partners.find((p) => p.name === 'NO LIMITED')?.url).toBe('https://no-limited.pl/');
  });

  it('only credits the wheels for team races in covered seasons and disciplines', () => {
    expect(wheelsFor(race)).toBe('NO LIMITED');
    expect(wheelsFor({ ...race, onTeamCalendar: false })).toBeNull(); // national-team starts
    expect(wheelsFor({ ...race, training: true })).toBeNull();
    expect(wheelsFor({ ...race, discipline: 'CX' })).toBeNull();
    expect(wheelsFor({ ...race, season: 2025 })).toBeNull();
    expect(wheelsFor({ ...race, equipment: { wheels: false } })).toBeNull();
  });

  it('counts each podium once', () => {
    const row = { eventId: 'E1', stage: 'ITT', category: 'U23', position: 1 };
    expect(podiums([row, row, { ...row, position: 4 }, { ...row, category: 'U19', position: 2 }])).toBe(2);
    expect(wheelPodiums(2026).podiums).toBeGreaterThan(0);
  });

  it('keeps unconfirmed models, quotes and setup out of production', () => {
    const { equipment } = getData();
    expect(visible(equipment.wheels.models).every((m) => !m.verify)).toBe(true);
    expect(visible(equipment.setup).map((s) => s.category)).toEqual(['wheels']);
    // No model is confirmed yet, so no Product is emitted; a confirmed one must validate.
    expect(wheelProducts(ctx)).toEqual([]);
  });

  it('emits valid Product data once a model is confirmed', () => {
    const { equipment } = getData();
    const saved = equipment.wheels.models[0];
    equipment.wheels.models[0] = { ...saved, name: 'Test 50', rimDepth: 50, verify: false };
    try {
      const products = wheelProducts(ctx);
      expect(products).toHaveLength(1);
      const partner = { '@type': ['Organization', 'Brand'], '@id': 'https://www.atomteam.pl/partnerzy/#no-limited', name: 'NO LIMITED', url: 'https://no-limited.pl/' };
      expect(checkGraph(graph([partner, ...products]))).toEqual([]);
    } finally {
      equipment.wheels.models[0] = saved;
    }
  });
});
