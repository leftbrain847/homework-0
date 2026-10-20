import { CUISINES } from '@/domain/cuisine';
import type { RestaurantLocation } from '@/domain/types';

import type { Repositories } from './repositories';

/** Cities used to scatter synthetic pins. Coordinates only; no real businesses. */
const CENTERS: [number, number][] = [
  [41.88, -87.65],
  [30.27, -97.74],
  [39.74, -104.99],
  [43.66, -79.39],
  [40.73, -73.99],
  [34.05, -118.25],
  [47.61, -122.33],
  [51.51, -0.12],
  [48.86, 2.35],
  [52.52, 13.4],
  [35.68, 139.69],
  [-33.87, 151.21],
];

/** Deterministic PRNG so every run produces the same test data. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Wraps real repositories and replaces locations with `count` synthetic ones
 * spread across the sample brands. For performance testing only.
 */
export function createStressRepositories(base: Repositories, count = 5000): Repositories {
  return {
    ...base,
    locations: {
      list: async () => {
        const brands = await base.brands.list();
        const rand = mulberry32(42);
        const out: RestaurantLocation[] = [];
        for (let i = 0; i < count; i++) {
          const [lat, lng] = CENTERS[i % CENTERS.length]!;
          const brand = rand() < 0.6 ? brands[Math.floor(rand() * brands.length)] : undefined;
          // Sum of uniforms approximates a normal spread around the center.
          const spread = () => (rand() + rand() + rand() - 1.5) * 0.25;
          out.push({
            id: `stress_${String(i).padStart(5, '0')}`,
            brand_id: brand?.id ?? null,
            name: brand ? `${brand.name} #${i}` : `Test Independent #${i}`,
            address: `${i} Synthetic St (stress-test data)`,
            lat: lat + spread(),
            lng: lng + spread(),
            cuisine: brand ? null : CUISINES[Math.floor(rand() * CUISINES.length)]!,
            is_franchised: brand ? rand() < 0.3 : false,
          });
        }
        return out;
      },
    },
  };
}
