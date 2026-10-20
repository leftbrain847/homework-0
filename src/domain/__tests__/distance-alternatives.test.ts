import { makeLocation, makeView } from '@/test-utils/fixtures';
import { canShowAlternatives, findAlternatives } from '../alternatives';
import { distanceKm, formatDistance, unitForLocale } from '../distance';
import type { Cuisine, OwnershipCategory } from '../types';

describe('distance', () => {
  it('computes haversine distance', () => {
    // Chicago Loop to O'Hare, roughly 25 km
    expect(
      distanceKm({ lat: 41.8781, lng: -87.6298 }, { lat: 41.9742, lng: -87.9073 }),
    ).toBeCloseTo(25.4, 0);
    expect(distanceKm({ lat: 1, lng: 1 }, { lat: 1, lng: 1 })).toBe(0);
  });

  it('picks units by locale region', () => {
    expect(unitForLocale('en-US')).toBe('mi');
    expect(unitForLocale('en_GB')).toBe('mi');
    expect(unitForLocale('en-CA')).toBe('km');
    expect(unitForLocale('fr')).toBe('km');
  });

  it('formats distances', () => {
    expect(formatDistance(1.609344, 'mi')).toBe('1.0 mi');
    expect(formatDistance(12.4, 'km')).toBe('12 km');
    expect(formatDistance(0.05, 'km')).toBe('< 0.1 km');
  });
});

describe('alternatives', () => {
  let n = 0;
  const at = (lat: number, cuisine: Cuisine, category: OwnershipCategory = 'independent') =>
    makeView({
      location: makeLocation({ id: `l${n++}`, lat, lng: -87.63, brand_id: null }),
      cuisine,
      category,
    });

  const origin = at(41.88, 'burgers', 'pe_backed');

  it('returns same-cuisine independents sorted by distance from the restaurant', () => {
    const far = at(41.9, 'burgers');
    const near = at(41.885, 'burgers');
    const other = at(41.881, 'italian');
    const pe = at(41.881, 'burgers', 'pe_backed');
    const result = findAlternatives(origin, [origin, far, near, other, pe]);
    expect(result.match).toBe('same_cuisine');
    expect(result.items.map((a) => a.view)).toEqual([near, far]);
  });

  it('6l falls back to any cuisine when no same-cuisine match is nearby', () => {
    const italian = at(41.881, 'italian');
    const result = findAlternatives(origin, [origin, italian]);
    expect(result).toEqual({
      match: 'any_cuisine',
      items: [expect.objectContaining({ view: italian })],
    });
  });

  it('respects radius and limit', () => {
    const outside = at(42.5, 'burgers');
    expect(findAlternatives(origin, [outside]).match).toBe('none');
    const many = Array.from({ length: 8 }, (_, i) => at(41.88 + i * 0.001, 'burgers'));
    expect(findAlternatives(origin, many).items).toHaveLength(5);
  });

  it('is offered from PE-backed and PE-franchise locations only', () => {
    expect(canShowAlternatives(makeView({ category: 'pe_backed' }))).toBe(true);
    expect(canShowAlternatives(makeView({ category: 'pe_franchise' }))).toBe(true);
    for (const c of ['previously_pe', 'independent', 'chain', 'unverified'] as const) {
      expect(canShowAlternatives(makeView({ category: c }))).toBe(false);
    }
  });
});
