import { classifyLocation, type FirmLookup } from './ownership';
import { buildPortfolio, type Portfolio } from './portfolio';
import type { Brand, Dataset, Firm, LocationView } from './types';

/**
 * In-memory join of the three datasets. Ownership lives only on brands;
 * every location view looks up its brand, so one brand correction updates
 * every pin.
 */
export interface Directory {
  views: LocationView[];
  getView(locationId: string): LocationView | undefined;
  getFirm: FirmLookup;
  getBrand(id: string): Brand | undefined;
  getPortfolio(firmId: string): Portfolio | undefined;
}

export function buildDirectory({ firms, brands, locations }: Dataset): Directory {
  const firmsById = new Map<string, Firm>(firms.map((f) => [f.id, f]));
  const brandsById = new Map<string, Brand>(brands.map((b) => [b.id, b]));
  const getFirm: FirmLookup = (id) => firmsById.get(id);

  const views: LocationView[] = locations.map((location) => {
    const brand = location.brand_id ? (brandsById.get(location.brand_id) ?? null) : null;
    // A dangling brand_id is treated as unverified rather than independent.
    const category =
      location.brand_id && !brand ? 'unverified' : classifyLocation(location, brand, getFirm);
    const cuisine = location.cuisine ?? brand?.cuisine ?? 'american';
    return { location, brand, cuisine, category };
  });
  const viewsById = new Map(views.map((v) => [v.location.id, v]));

  const locationCounts = new Map<string, number>();
  for (const l of locations) {
    if (l.brand_id) locationCounts.set(l.brand_id, (locationCounts.get(l.brand_id) ?? 0) + 1);
  }

  return {
    views,
    getView: (id) => viewsById.get(id),
    getFirm,
    getBrand: (id) => brandsById.get(id),
    getPortfolio: (firmId) => {
      const firm = firmsById.get(firmId);
      return firm ? buildPortfolio(firm, brands, getFirm, locationCounts) : undefined;
    },
  };
}
