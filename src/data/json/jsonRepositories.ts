import type { Brand, Firm, RestaurantLocation } from '@/domain/types';

import brands from '../../../data/brands.json';
import firms from '../../../data/firms.json';
import locations from '../../../data/locations.json';
import type { Repositories } from '../repositories';

// The JSON files are checked against data/schemas by `npm run validate:data`
// in CI, which is what makes these casts safe.
export function createJsonRepositories(): Repositories {
  return {
    firms: { list: async () => firms as Firm[] },
    brands: { list: async () => brands as Brand[] },
    locations: { list: async () => locations as RestaurantLocation[] },
  };
}
