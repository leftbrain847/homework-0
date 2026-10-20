import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

import brandsSchema from '../data/schemas/brands.schema.json';
import cuisineSchema from '../data/schemas/cuisine.schema.json';
import firmsSchema from '../data/schemas/firms.schema.json';
import locationsSchema from '../data/schemas/locations.schema.json';
import { makesPeClaim } from '../src/domain/ownership';
import type { Brand, Dataset, Firm, RestaurantLocation } from '../src/domain/types';

export interface ValidationError {
  file: 'firms.json' | 'brands.json' | 'locations.json';
  id?: string;
  message: string;
}

type RawDataset = { firms: unknown; brands: unknown; locations: unknown };

function createAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(cuisineSchema);
  return ajv;
}

/** Validates the three data files. Returns an empty array when the data is valid. */
export function validateDataset(raw: RawDataset, today: Date = new Date()): ValidationError[] {
  const ajv = createAjv();
  const errors: ValidationError[] = [];

  const checks = [
    ['firms.json', firmsSchema, raw.firms],
    ['brands.json', brandsSchema, raw.brands],
    ['locations.json', locationsSchema, raw.locations],
  ] as const;
  for (const [file, schema, data] of checks) {
    const validate = ajv.compile(schema);
    if (!validate(data)) {
      for (const e of validate.errors ?? []) {
        errors.push({
          file,
          message: `schema: ${e.instancePath || '/'} ${e.message ?? ''}`.trim(),
        });
      }
    }
  }
  // Cross-field rules assume the shape is right; stop here if it is not.
  if (errors.length > 0) return errors;

  const { firms, brands, locations } = raw as Dataset;
  errors.push(...duplicateIds('firms.json', firms));
  errors.push(...duplicateIds('brands.json', brands));
  errors.push(...duplicateIds('locations.json', locations));

  const firmsById = new Map<string, Firm>(firms.map((f) => [f.id, f]));
  const brandIds = new Set(brands.map((b) => b.id));
  const getFirm = (id: string) => firmsById.get(id);
  const todayIso = today.toISOString().slice(0, 10);

  for (const brand of brands) errors.push(...checkBrand(brand, firmsById, getFirm, todayIso));
  for (const location of locations) errors.push(...checkLocation(location, brandIds));
  return errors;
}

function duplicateIds(file: ValidationError['file'], items: { id: string }[]): ValidationError[] {
  const seen = new Set<string>();
  const errors: ValidationError[] = [];
  for (const { id } of items) {
    if (seen.has(id)) errors.push({ file, id, message: `duplicate id "${id}"` });
    seen.add(id);
  }
  return errors;
}

function checkBrand(
  brand: Brand,
  firmsById: Map<string, Firm>,
  getFirm: (id: string) => Firm | undefined,
  todayIso: string,
): ValidationError[] {
  const errors: string[] = [];

  for (const id of brand.ownership_chain.flat()) {
    if (!firmsById.has(id)) errors.push(`ownership_chain references unknown firm "${id}"`);
  }
  if (brand.parent_company !== null) {
    if (!firmsById.has(brand.parent_company)) {
      errors.push(`parent_company references unknown firm "${brand.parent_company}"`);
    } else if (
      brand.ownership_chain.length > 0 &&
      !brand.ownership_chain.at(-1)?.includes(brand.parent_company)
    ) {
      errors.push('parent_company must appear in the last level of ownership_chain');
    }
  }
  if (brand.last_verified && brand.last_verified > todayIso) {
    errors.push('last_verified is in the future');
  }

  if (makesPeClaim(brand, getFirm)) {
    if (!brand.source_url) errors.push('PE claim without source_url');
    if (!brand.last_verified) errors.push('PE claim without last_verified');
    if (!brand.status) errors.push('PE claim without status');
    if (!brand.stake_type) errors.push('PE claim without stake_type');
    if (!brand.confidence) errors.push('PE claim without confidence');
    if (!brand.acquired_year) errors.push('PE claim without acquired_year');
    if (brand.independent_group)
      errors.push('independent_group cannot have a PE firm in its chain');
    if (brand.status === 'exited') {
      if (!brand.exited_year) errors.push('exited status requires exited_year');
      else if (brand.acquired_year && brand.exited_year < brand.acquired_year)
        errors.push('exited_year is before acquired_year');
    }
    if (brand.status === 'current' && brand.exited_year !== null)
      errors.push('current status cannot have exited_year');
  } else if (brand.status || brand.stake_type || brand.acquired_year || brand.exited_year) {
    errors.push('ownership fields are set but no PE firm is in ownership_chain');
  }

  return errors.map((message) => ({ file: 'brands.json', id: brand.id, message }));
}

function checkLocation(location: RestaurantLocation, brandIds: Set<string>): ValidationError[] {
  const errors: string[] = [];
  if (location.brand_id === null) {
    if (location.cuisine === null) errors.push('independent location requires cuisine');
    if (location.is_franchised) errors.push('independent location cannot be franchised');
  } else if (!brandIds.has(location.brand_id)) {
    errors.push(`brand_id references unknown brand "${location.brand_id}"`);
  }
  return errors.map((message) => ({ file: 'locations.json', id: location.id, message }));
}
