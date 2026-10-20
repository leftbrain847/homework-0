import { firms, getFirm, makeBrand, makeLocation } from '@/test-utils/fixtures';
import {
  classifyBrand,
  classifyLocation,
  isStale,
  joinNames,
  monthsSince,
  ownershipChainSegments,
  ownershipFacts,
  ownershipHeadline,
  sourceInfo,
} from '../ownership';
import type { Brand } from '../types';

const NOW = new Date(2026, 9, 20); // 20 Oct 2026, local time

function headline(brand: Brand | null, franchised = false) {
  const category = classifyLocation(makeLocation({ is_franchised: franchised }), brand, getFirm);
  return { category, text: ownershipHeadline(category, brand, getFirm, franchised) };
}

const nonPe = (overrides: Partial<Brand> = {}) =>
  makeBrand({
    ownership_chain: [['parent']],
    parent_company: 'parent',
    status: null,
    stake_type: null,
    confidence: null,
    acquired_year: null,
    ...overrides,
  });

describe('classification and headline', () => {
  it('majority PE: "Owned by [Firm] since [year]"', () => {
    expect(headline(makeBrand())).toEqual({
      category: 'pe_backed',
      text: 'Owned by Alpha Capital since 2019',
    });
  });

  it('6a minority stake: PE-backed, worded as a minority stake', () => {
    expect(headline(makeBrand({ stake_type: 'minority', acquired_year: 2021 }))).toEqual({
      category: 'pe_backed',
      text: 'Minority stake held by Alpha Capital since 2021',
    });
  });

  it('6b exited brand: previously PE-owned, with years, never the PE pin', () => {
    const brand = makeBrand({ status: 'exited', acquired_year: 2015, exited_year: 2022 });
    expect(headline(brand)).toEqual({
      category: 'previously_pe',
      text: 'Previously owned by Alpha Capital, 2015–2022',
    });
  });

  it('6c local independent group counts as independent', () => {
    const brand = nonPe({
      name: 'Hollis',
      ownership_chain: [],
      parent_company: null,
      source_url: null,
      last_verified: null,
      independent_group: true,
    });
    expect(headline(brand)).toEqual({
      category: 'independent',
      text: 'Part of Hollis, a local independent group',
    });
  });

  it('6d sourced non-PE chain is a chain, naming the parent', () => {
    expect(headline(nonPe({ name: 'Kettle' }))).toEqual({
      category: 'chain',
      text: 'Part of Kettle, owned by Parent Foods',
    });
  });

  it('6e franchise of a PE brand: "Franchisor is PE-owned", never "this restaurant"', () => {
    const result = headline(makeBrand(), true);
    expect(result.category).toBe('pe_franchise');
    expect(result.text).toBe(
      'Franchised location. Franchisor is PE-owned (Alpha Capital since 2019)',
    );
    expect(result.text).not.toMatch(/this restaurant/i);
  });

  it('6e franchise of a minority-stake brand mentions a minority investor', () => {
    expect(headline(makeBrand({ stake_type: 'minority' }), true).text).toBe(
      'Franchised location. Franchisor has a minority PE investor (Alpha Capital since 2019)',
    );
  });

  it('6f franchise of an exited brand is previously PE-owned, not a franchise pin', () => {
    const brand = makeBrand({ status: 'exited', acquired_year: 2015, exited_year: 2022 });
    expect(headline(brand, true)).toEqual({
      category: 'previously_pe',
      text: 'Franchised location. Franchisor was previously PE-owned (Alpha Capital, 2015–2022)',
    });
  });

  it('6g PE claim with no source is "Ownership unverified", no firm named', () => {
    for (const missing of [{ source_url: null }, { last_verified: null }]) {
      const brand = makeBrand(missing);
      const result = headline(brand);
      expect(result).toEqual({ category: 'unverified', text: 'Ownership unverified' });
      expect(ownershipChainSegments(result.category, brand, getFirm)).toEqual([]);
      expect(ownershipFacts(result.category, brand)).toEqual([]);
      expect(sourceInfo(result.category, brand, NOW)).toBeNull();
    }
  });

  it('6g unsourced franchise is unverified too', () => {
    expect(headline(makeBrand({ source_url: null }), true).category).toBe('unverified');
  });

  it('non-PE brand with no source is unverified, not a chain', () => {
    expect(headline(nonPe({ source_url: null })).category).toBe('unverified');
  });

  it('unverified with no brand record never reads as independent', () => {
    expect(ownershipHeadline('unverified', null, getFirm)).toBe('Ownership unverified');
  });

  it('no brand is independent', () => {
    expect(headline(null)).toEqual({ category: 'independent', text: 'Independent restaurant' });
  });

  it('6i reported confidence stays PE-backed and is labelled', () => {
    const brand = makeBrand({ confidence: 'reported' });
    expect(classifyBrand(brand, getFirm)).toBe('pe_backed');
    expect(ownershipFacts('pe_backed', brand)).toContainEqual({
      label: 'Confidence',
      value: 'Reported (not independently confirmed)',
    });
  });

  it('6j PE firm above a holding company still classifies as PE-backed', () => {
    const brand = makeBrand({ ownership_chain: [['pe_a'], ['hold']] });
    expect(classifyBrand(brand, getFirm)).toBe('pe_backed');
  });

  it('6o co-owners are joined: "Owned by A and B since 2020"', () => {
    const brand = makeBrand({ ownership_chain: [['pe_a', 'pe_b'], ['hold']], acquired_year: 2020 });
    expect(headline(brand).text).toBe('Owned by Alpha Capital and Beta Partners since 2020');
  });

  it('uses no loaded verbs anywhere', () => {
    const variants = [
      makeBrand(),
      makeBrand({ stake_type: 'minority' }),
      makeBrand({ status: 'exited', exited_year: 2022 }),
    ];
    for (const brand of variants) {
      for (const franchised of [false, true]) {
        expect(headline(brand, franchised).text).not.toMatch(/controlled|bought out|taken over/i);
      }
    }
  });
});

describe('ownership chain', () => {
  it('lists owner first and the brand last, with co-owners on one level', () => {
    const brand = makeBrand({ ownership_chain: [['pe_a', 'pe_b'], ['hold']] });
    expect(ownershipChainSegments('pe_backed', brand, getFirm)).toEqual([
      { ids: ['pe_a', 'pe_b'], names: ['Alpha Capital', 'Beta Partners'] },
      { ids: ['hold'], names: ['Holdco Group'] },
      { ids: [], names: ['Test Brand'] },
    ]);
  });
});

describe('facts and source', () => {
  it('shows status, stake, confidence and year for PE brands', () => {
    expect(ownershipFacts('pe_backed', makeBrand())).toEqual([
      { label: 'Status', value: 'Current' },
      { label: 'Stake', value: 'Majority stake' },
      { label: 'Confidence', value: 'Confirmed' },
      { label: 'Year acquired', value: '2019' },
    ]);
  });

  it('6h flags sources verified more than 24 months ago', () => {
    expect(sourceInfo('pe_backed', makeBrand({ last_verified: '2023-03-15' }), NOW)).toEqual({
      url: 'https://example.com/source',
      lastVerified: 'Mar 15, 2023',
      stale: true,
    });
    expect(sourceInfo('pe_backed', makeBrand(), NOW)?.stale).toBe(false);
  });

  it('counts whole months', () => {
    expect(monthsSince('2024-10-20', NOW)).toBe(24);
    expect(monthsSince('2024-10-21', NOW)).toBe(23);
    expect(isStale('2024-10-20', NOW)).toBe(false);
    expect(isStale('2024-09-19', NOW)).toBe(true);
  });
});

describe('joinNames', () => {
  it('joins one, two and three names', () => {
    expect(joinNames(['A'])).toBe('A');
    expect(joinNames(['A', 'B'])).toBe('A and B');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B, and C');
  });
});

it('fixtures include both firm types', () => {
  expect(new Set(firms.map((f) => f.type))).toEqual(new Set(['pe_firm', 'holding_company']));
});
