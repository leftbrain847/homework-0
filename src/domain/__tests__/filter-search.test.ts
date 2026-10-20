import { makeBrand, makeLocation, makeView } from '@/test-utils/fixtures';
import { applyFilter, countByFilter, matchesFilter } from '../filter';
import { matchesQuery, normalize, search } from '../search';
import type { OwnershipCategory } from '../types';

const categories: OwnershipCategory[] = [
  'pe_backed',
  'pe_franchise',
  'previously_pe',
  'independent',
  'chain',
  'unverified',
];

describe('filters', () => {
  it('"All" includes every category', () => {
    for (const c of categories) expect(matchesFilter(c, 'all')).toBe(true);
  });

  it('exited, chain and unverified appear under All only', () => {
    for (const c of ['previously_pe', 'chain', 'unverified'] as const) {
      expect(matchesFilter(c, 'pe_backed')).toBe(false);
      expect(matchesFilter(c, 'pe_franchise')).toBe(false);
      expect(matchesFilter(c, 'independent')).toBe(false);
    }
  });

  it('PE-backed excludes franchised locations; franchise filter is its own bucket', () => {
    expect(matchesFilter('pe_franchise', 'pe_backed')).toBe(false);
    expect(matchesFilter('pe_franchise', 'pe_franchise')).toBe(true);
  });

  it('counts each bucket', () => {
    const views = categories.map((category) => makeView({ category }));
    expect(countByFilter(views)).toEqual({
      all: 6,
      pe_backed: 1,
      pe_franchise: 1,
      independent: 1,
    });
    expect(applyFilter(views, 'independent')).toHaveLength(1);
  });
});

describe('search', () => {
  const view = makeView({
    location: makeLocation({ name: 'Harborline Burger Co. — West Loop' }),
    brand: makeBrand({ name: 'Harborline Burger Co.' }),
  });
  const indie = makeView({ location: makeLocation({ name: 'Café Ño & Sons' }) });

  it('normalizes accents, case and punctuation', () => {
    expect(normalize('  Café Ño & Sons! ')).toBe('cafe no and sons');
  });

  it('matches word prefixes of restaurant or brand name', () => {
    expect(matchesQuery(view, 'harb bur')).toBe(true);
    expect(matchesQuery(view, 'WEST')).toBe(true);
    expect(matchesQuery(view, 'urger')).toBe(false);
    expect(matchesQuery(indie, 'cafe')).toBe(true);
  });

  it('6m an empty query returns everything', () => {
    expect(search([view, indie], '  ')).toHaveLength(2);
    expect(search([view, indie], 'harborline')).toEqual([view]);
  });

  it('matches the brand name even when the location name differs', () => {
    const v = makeView({
      location: makeLocation({ name: 'Downtown' }),
      brand: makeBrand({ name: 'Sunmill Bakery' }),
    });
    expect(matchesQuery(v, 'sunmill')).toBe(true);
  });
});
