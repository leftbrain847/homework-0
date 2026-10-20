import cuisineSchema from '../../../data/schemas/cuisine.schema.json';
import brands from '../../../data/brands.json';
import firms from '../../../data/firms.json';
import locations from '../../../data/locations.json';
import { CUISINES } from '../cuisine';
import { buildDirectory } from '../directory';
import type { Dataset } from '../types';

const dataset = { firms, brands, locations } as Dataset;

describe('buildDirectory (sample data)', () => {
  const dir = buildDirectory(dataset);

  it('joins every location to its brand', () => {
    expect(dir.views).toHaveLength(locations.length);
    expect(dir.getView('chi_01')?.brand?.id).toBe('harborline_burger');
  });

  it('one brand correction updates every location of that brand', () => {
    const corrected = structuredClone(dataset);
    const brand = corrected.brands.find((b) => b.id === 'harborline_burger')!;
    brand.status = 'exited';
    brand.exited_year = 2026;
    const views = buildDirectory(corrected).views.filter(
      (v) => v.brand?.id === 'harborline_burger',
    );
    expect(views.length).toBeGreaterThan(3);
    expect(new Set(views.map((v) => v.category))).toEqual(new Set(['previously_pe']));
  });

  it('treats a dangling brand_id as unverified', () => {
    const broken = structuredClone(dataset);
    broken.locations[0]!.brand_id = 'missing';
    expect(buildDirectory(broken).views[0]!.category).toBe('unverified');
  });

  it('covers every category in the sample data', () => {
    expect(new Set(dir.views.map((v) => v.category))).toEqual(
      new Set(['pe_backed', 'pe_franchise', 'previously_pe', 'independent', 'chain', 'unverified']),
    );
  });

  it('6j portfolio includes brands owned through a holding company and co-owned brands', () => {
    const quillmere = dir.getPortfolio('quillmere_capital')!;
    expect(quillmere.current.map((e) => e.brand.id)).toEqual(
      expect.arrayContaining(['harborline_burger', 'tidewater_taqueria', 'sunmill_bakery']),
    );
    const harborline = quillmere.current.find((e) => e.brand.id === 'harborline_burger')!;
    expect(harborline.path).toEqual([
      'Quillmere Capital (sample)',
      'Brightplate Restaurant Group (sample)',
      'Harborline Burger Co.',
    ]);
    expect(harborline.locationCount).toBe(7);

    const ostravale = dir.getPortfolio('ostravale_partners')!;
    expect(ostravale.current.map((e) => e.brand.id)).toEqual(['ember_and_rye']);
    expect(ostravale.exited.map((e) => e.brand.id)).toEqual(['lotus_lane']);
  });

  it('portfolio excludes unverified brands', () => {
    const data = structuredClone(dataset);
    data.brands.find((b) => b.id === 'sunmill_bakery')!.source_url = null;
    const ids = buildDirectory(data)
      .getPortfolio('quillmere_capital')!
      .current.map((e) => e.brand.id);
    expect(ids).not.toContain('sunmill_bakery');
  });
});

it('cuisine list matches the JSON schema', () => {
  expect([...CUISINES]).toEqual(cuisineSchema.enum);
});
