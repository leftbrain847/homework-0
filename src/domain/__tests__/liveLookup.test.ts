import {
  cleanQuery,
  effectiveConfidence,
  franchiseNote,
  parseLookup,
  parseLookupResult,
  toLiveOwnership,
} from '../liveLookup';
import { ownershipChainSegments, ownershipHeadline } from '../ownership';

const source = (publisher: string, url = `https://${publisher}.example/a`) => ({
  url,
  title: 'Deal announced',
  publisher,
  published: '2024-04-05',
  quote: 'Example Capital agreed to acquire the chain.',
});

const raw = (overrides: Record<string, unknown> = {}) => ({
  resolved_name: 'Example Subs',
  kind: 'brand',
  ownership_chain: [[{ name: 'Example Capital', type: 'pe_firm' }]],
  status: 'current',
  stake_type: 'majority',
  confidence: 'confirmed',
  acquired_year: 2024,
  exited_year: null,
  independent: false,
  franchise_model: 'mostly_franchised',
  sources: [source('pressroom'), source('newswire')],
  last_verified: '2026-10-20',
  notes: null,
  ...overrides,
});

function view(overrides: Record<string, unknown> = {}) {
  const result = parseLookupResult(raw(overrides))!;
  const live = toLiveOwnership(result);
  return {
    result,
    live,
    headline: ownershipHeadline(live.category, live.brand, live.getFirm),
  };
}

describe('cleanQuery', () => {
  it('trims, collapses whitespace, strips control chars, caps length', () => {
    expect(cleanQuery('  Sub\u0000way \n  ')).toBe('Sub way');
    expect(cleanQuery('x'.repeat(300))).toHaveLength(100);
  });
});

describe('parsing untrusted results', () => {
  it('rejects non-objects and results without a name', () => {
    expect(parseLookupResult('nope')).toBeNull();
    expect(parseLookupResult({ ...raw(), resolved_name: '' })).toBeNull();
  });

  it('drops sources without an http(s) url or a supporting quote', () => {
    const r = parseLookupResult(
      raw({
        sources: [
          source('ok'),
          { ...source('noquote'), quote: '' },
          { ...source('js'), url: 'javascript:alert(1)' },
          'junk',
        ],
      }),
    )!;
    expect(r.sources.map((s) => s.publisher)).toEqual(['ok']);
  });

  it('coerces unknown enum values to null / defaults', () => {
    const r = parseLookupResult(
      raw({ status: 'sold', stake_type: 7, franchise_model: 'x', acquired_year: '2024' }),
    )!;
    expect([r.status, r.stakeType, r.franchiseModel, r.acquiredYear]).toEqual([
      null,
      null,
      'unknown',
      null,
    ]);
  });

  it('parses a lookup document', () => {
    expect(
      parseLookup('abc', { query: 'Subway', status: 'done', createdAt: 5, result: raw() }),
    ).toMatchObject({ id: 'abc', query: 'Subway', status: 'done', createdAt: 5 });
    expect(parseLookup('x', { status: 'done' })).toBeNull();
  });
});

describe('rules applied to live answers', () => {
  it('sourced PE answer uses the standard neutral headline', () => {
    const { live, headline } = view();
    expect(live.category).toBe('pe_backed');
    expect(headline).toBe('Owned by Example Capital since 2024');
  });

  it('no supporting source means unverified, with no firm names or chain', () => {
    const { live, headline } = view({ sources: [{ ...source('a'), quote: '' }] });
    expect(live.category).toBe('unverified');
    expect(headline).toBe('Ownership unverified');
    expect(ownershipChainSegments(live.category, live.brand, live.getFirm)).toEqual([]);
  });

  it('missing last_verified also means unverified', () => {
    expect(view({ last_verified: 'yesterday' }).live.category).toBe('unverified');
  });

  it('"confirmed" needs two different publishers, else it shows as reported', () => {
    const one = parseLookupResult(
      raw({ sources: [source('a'), source('a', 'https://a.example/b')] }),
    )!;
    expect(effectiveConfidence(one)).toBe('reported');
    expect(effectiveConfidence(parseLookupResult(raw())!)).toBe('confirmed');
  });

  it('a sourced single independent restaurant reads as independent', () => {
    const { live, headline } = view({
      kind: 'single',
      ownership_chain: [],
      independent: true,
      status: null,
      stake_type: null,
      confidence: null,
      acquired_year: null,
    });
    expect(live.category).toBe('independent');
    expect(headline).toBe('Independent restaurant');
  });

  it('an unsourced "independent" claim is unverified too', () => {
    expect(
      view({ kind: 'single', ownership_chain: [], independent: true, sources: [] }).live.category,
    ).toBe('unverified');
  });

  it('exited and minority answers keep their wording', () => {
    expect(view({ status: 'exited', acquired_year: 2015, exited_year: 2022 }).headline).toBe(
      'Previously owned by Example Capital, 2015–2022',
    );
    expect(view({ stake_type: 'minority' }).headline).toBe(
      'Minority stake held by Example Capital since 2024',
    );
  });

  it('franchise-heavy PE brands get the franchisor note', () => {
    const { result, live } = view();
    expect(franchiseNote(result, live.category)).toMatch(
      /franchisor is PE-owned, not the restaurant/,
    );
    const company = view({ franchise_model: 'mostly_company_operated' });
    expect(franchiseNote(company.result, company.live.category)).toBeNull();
  });
});
