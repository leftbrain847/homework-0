import type { Brand, Firm, LocationView, RestaurantLocation } from '@/domain/types';

export const firms: Firm[] = [
  { id: 'pe_a', name: 'Alpha Capital', type: 'pe_firm', website: null },
  { id: 'pe_b', name: 'Beta Partners', type: 'pe_firm', website: null },
  { id: 'hold', name: 'Holdco Group', type: 'holding_company', website: null },
  { id: 'parent', name: 'Parent Foods', type: 'holding_company', website: null },
];
const firmsById = new Map(firms.map((f) => [f.id, f]));
export const getFirm = (id: string) => firmsById.get(id);

export function makeBrand(overrides: Partial<Brand> = {}): Brand {
  return {
    id: 'brand',
    name: 'Test Brand',
    cuisine: 'burgers',
    parent_company: 'hold',
    ownership_chain: [['pe_a'], ['hold']],
    status: 'current',
    stake_type: 'majority',
    confidence: 'confirmed',
    acquired_year: 2019,
    exited_year: null,
    source_url: 'https://example.com/source',
    last_verified: '2026-08-01',
    independent_group: false,
    ...overrides,
  };
}

export function makeLocation(overrides: Partial<RestaurantLocation> = {}): RestaurantLocation {
  return {
    id: 'loc',
    brand_id: 'brand',
    name: 'Test Location',
    address: '1 Sample St',
    lat: 41.88,
    lng: -87.63,
    cuisine: null,
    is_franchised: false,
    ...overrides,
  };
}

export function makeView(overrides: Partial<LocationView> = {}): LocationView {
  return {
    location: makeLocation(),
    brand: null,
    cuisine: 'burgers',
    category: 'independent',
    ...overrides,
  };
}
