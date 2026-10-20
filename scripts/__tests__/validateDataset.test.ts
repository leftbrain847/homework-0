import brands from '../../data/brands.json';
import firms from '../../data/firms.json';
import locations from '../../data/locations.json';
import { validateDataset } from '../validateDataset';

type Data = { firms: any[]; brands: any[]; locations: any[] };
const TODAY = new Date('2026-10-20T12:00:00Z');

function fresh(): Data {
  return structuredClone({ firms, brands, locations }) as Data;
}
function messages(data: Data): string[] {
  return validateDataset(data, TODAY).map((e) => e.message);
}
const brand = (data: Data, id: string) => data.brands.find((b) => b.id === id);

describe('validateDataset', () => {
  it('accepts the shipped sample data', () => {
    expect(validateDataset(fresh(), TODAY)).toEqual([]);
  });

  it('fails on schema violations', () => {
    const data = fresh();
    data.locations[0].lat = 123;
    data.brands[0].status = 'sold';
    const result = messages(data);
    expect(result.some((m) => m.startsWith('schema: /0/lat'))).toBe(true);
    expect(result.some((m) => m.startsWith('schema: /0/status'))).toBe(true);
  });

  it('fails on unknown cuisine', () => {
    const data = fresh();
    data.brands[0].cuisine = 'sushi';
    expect(messages(data).some((m) => m.includes('/0/cuisine'))).toBe(true);
  });

  it('fails on a PE claim without source_url', () => {
    const data = fresh();
    brand(data, 'harborline_burger').source_url = null;
    expect(messages(data)).toContain('PE claim without source_url');
  });

  it('fails on a PE claim without last_verified', () => {
    const data = fresh();
    brand(data, 'harborline_burger').last_verified = null;
    expect(messages(data)).toContain('PE claim without last_verified');
  });

  it('fails on a PE claim missing status, stake, confidence, or year', () => {
    const data = fresh();
    Object.assign(brand(data, 'pastaio_fresco'), {
      status: null,
      stake_type: null,
      confidence: null,
      acquired_year: null,
    });
    expect(messages(data)).toEqual(
      expect.arrayContaining([
        'PE claim without status',
        'PE claim without stake_type',
        'PE claim without confidence',
        'PE claim without acquired_year',
      ]),
    );
  });

  it('treats a PE firm at any chain level as a PE claim', () => {
    const data = fresh();
    const greenbowl = brand(data, 'greenbowl');
    greenbowl.ownership_chain = [['maplewick_foods'], ['quillmere_capital']];
    expect(messages(data)).toContain('PE claim without source_url');
  });

  it('fails on broken firm references in the chain and parent_company', () => {
    const data = fresh();
    brand(data, 'harborline_burger').ownership_chain = [['no_such_firm'], ['brightplate_group']];
    brand(data, 'copper_kettle').parent_company = 'ghost_co';
    const result = messages(data);
    expect(result).toContain('ownership_chain references unknown firm "no_such_firm"');
    expect(result).toContain('parent_company references unknown firm "ghost_co"');
  });

  it('fails on broken brand references from locations', () => {
    const data = fresh();
    data.locations[0].brand_id = 'no_such_brand';
    expect(messages(data)).toContain('brand_id references unknown brand "no_such_brand"');
  });

  it('fails on duplicate ids in every file', () => {
    const data = fresh();
    data.firms.push({ ...data.firms[0] });
    data.brands.push({ ...data.brands[0] });
    data.locations.push({ ...data.locations[0] });
    const errors = validateDataset(data, TODAY).filter((e) => e.message.startsWith('duplicate'));
    expect(errors.map((e) => e.file).sort()).toEqual([
      'brands.json',
      'firms.json',
      'locations.json',
    ]);
  });

  it('requires exited_year for exited brands and forbids it for current ones', () => {
    const data = fresh();
    brand(data, 'lotus_lane').exited_year = null;
    brand(data, 'harborline_burger').exited_year = 2024;
    const result = messages(data);
    expect(result).toContain('exited status requires exited_year');
    expect(result).toContain('current status cannot have exited_year');
  });

  it('rejects an independent group with a PE firm in its chain', () => {
    const data = fresh();
    Object.assign(brand(data, 'harborline_burger'), { independent_group: true });
    expect(messages(data)).toContain('independent_group cannot have a PE firm in its chain');
  });

  it('rejects franchised or cuisine-less independents', () => {
    const data = fresh();
    const indie = data.locations.find((l) => l.brand_id === null);
    indie.is_franchised = true;
    indie.cuisine = null;
    expect(messages(data)).toEqual(
      expect.arrayContaining([
        'independent location requires cuisine',
        'independent location cannot be franchised',
      ]),
    );
  });

  it('rejects a last_verified date in the future', () => {
    const data = fresh();
    brand(data, 'harborline_burger').last_verified = '2027-01-01';
    expect(messages(data)).toContain('last_verified is in the future');
  });
});
