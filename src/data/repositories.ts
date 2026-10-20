import type { Brand, Dataset, Firm, RestaurantLocation } from '@/domain/types';

/**
 * Data access boundary. UI code depends only on these interfaces, so the
 * bundled JSON can be replaced by an API or database without touching screens.
 * Methods are async so a network implementation fits the same shape.
 */
export interface FirmRepository {
  list(): Promise<Firm[]>;
}

export interface BrandRepository {
  list(): Promise<Brand[]>;
}

export interface LocationRepository {
  /**
   * All locations. A server-backed implementation would add a bounding-box
   * query here; the map already renders only what is in view.
   */
  list(): Promise<RestaurantLocation[]>;
}

export interface Repositories {
  firms: FirmRepository;
  brands: BrandRepository;
  locations: LocationRepository;
}

export async function loadDataset(repos: Repositories): Promise<Dataset> {
  const [firms, brands, locations] = await Promise.all([
    repos.firms.list(),
    repos.brands.list(),
    repos.locations.list(),
  ]);
  return { firms, brands, locations };
}
