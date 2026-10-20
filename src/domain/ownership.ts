import type { Brand, Firm, OwnershipCategory, RestaurantLocation } from './types';

export type FirmLookup = (id: string) => Firm | undefined;

/** Months after which a last-verified date is flagged as possibly out of date. */
export const STALE_AFTER_MONTHS = 24;

export function peFirmIds(brand: Brand, getFirm: FirmLookup): string[] {
  return brand.ownership_chain.flat().filter((id) => getFirm(id)?.type === 'pe_firm');
}

/** A brand makes a PE claim when any level of its chain contains a PE firm. */
export function makesPeClaim(brand: Brand, getFirm: FirmLookup): boolean {
  return peFirmIds(brand, getFirm).length > 0;
}

export function hasSource(brand: Brand): boolean {
  return Boolean(brand.source_url && brand.last_verified);
}

export function classifyBrand(brand: Brand, getFirm: FirmLookup): OwnershipCategory {
  const peClaim = makesPeClaim(brand, getFirm);
  if (!peClaim && brand.independent_group) return 'independent';
  // Rule: no source, no label. Applies to PE and non-PE claims alike.
  if (!hasSource(brand)) return 'unverified';
  if (!peClaim) return 'chain';
  if (brand.status === 'exited') return 'previously_pe';
  if (brand.status === 'current') return 'pe_backed';
  return 'unverified';
}

export function classifyLocation(
  location: RestaurantLocation,
  brand: Brand | null,
  getFirm: FirmLookup,
): OwnershipCategory {
  if (!brand) return 'independent';
  const category = classifyBrand(brand, getFirm);
  if (category === 'pe_backed' && location.is_franchised) return 'pe_franchise';
  return category;
}

export function isPeLinked(category: OwnershipCategory): boolean {
  return category === 'pe_backed' || category === 'pe_franchise';
}

// ---------------------------------------------------------------------------
// Wording. All user-facing ownership text is produced here so the neutral
// wording rules live in one tested place.
// ---------------------------------------------------------------------------

export const CATEGORY_LABELS: Record<OwnershipCategory, string> = {
  pe_backed: 'PE-backed',
  pe_franchise: 'Franchise of a PE-backed brand',
  previously_pe: 'Previously PE-owned',
  independent: 'Independent',
  chain: 'Chain',
  unverified: 'Ownership unverified',
};

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}

function firmNames(ids: string[], getFirm: FirmLookup): string {
  return joinNames(ids.map((id) => getFirm(id)?.name ?? id));
}

function years(brand: Brand): string {
  if (brand.acquired_year && brand.exited_year)
    return `${brand.acquired_year}–${brand.exited_year}`;
  return brand.acquired_year ? `${brand.acquired_year}` : '';
}

/** One-line ownership statement, e.g. "Owned by Quillmere Capital since 2019". */
export function ownershipHeadline(
  category: OwnershipCategory,
  brand: Brand | null,
  getFirm: FirmLookup,
  franchised = false,
): string {
  if (!brand) return 'Independent restaurant';
  const owners = firmNames(peFirmIds(brand, getFirm), getFirm);
  const since = brand.acquired_year ? ` since ${brand.acquired_year}` : '';
  const minority = brand.stake_type === 'minority';

  switch (category) {
    case 'pe_backed':
      return minority ? `Minority stake held by ${owners}${since}` : `Owned by ${owners}${since}`;
    case 'pe_franchise':
      return minority
        ? `Franchised location. Franchisor has a minority PE investor (${owners}${since})`
        : `Franchised location. Franchisor is PE-owned (${owners}${since})`;
    case 'previously_pe':
      return franchised
        ? `Franchised location. Franchisor was previously PE-owned (${owners}, ${years(brand)})`
        : `Previously owned by ${owners}, ${years(brand)}`;
    case 'independent':
      return `Part of ${brand.name}, a local independent group`;
    case 'chain': {
      const parent = brand.parent_company ? getFirm(brand.parent_company) : undefined;
      return parent ? `Part of ${brand.name}, owned by ${parent.name}` : `Part of ${brand.name}`;
    }
    case 'unverified':
      return 'Ownership unverified';
  }
}

/** Ownership chain as display segments, owner first, brand last. Empty when unverified. */
export function ownershipChainSegments(
  category: OwnershipCategory,
  brand: Brand | null,
  getFirm: FirmLookup,
): { ids: string[]; names: string[] }[] {
  if (!brand || category === 'unverified' || brand.ownership_chain.length === 0) return [];
  return [
    ...brand.ownership_chain.map((level) => ({
      ids: level,
      names: level.map((id) => getFirm(id)?.name ?? id),
    })),
    { ids: [], names: [brand.name] },
  ];
}

export interface OwnershipFact {
  label: string;
  value: string;
}

/** Details shown under the headline. Only sourced brands get facts. */
export function ownershipFacts(category: OwnershipCategory, brand: Brand | null): OwnershipFact[] {
  if (!brand || category === 'unverified' || category === 'independent') return [];
  const facts: OwnershipFact[] = [];
  if (category !== 'chain') {
    if (brand.status) facts.push({ label: 'Status', value: STATUS_LABELS[brand.status] });
    if (brand.stake_type) facts.push({ label: 'Stake', value: STAKE_LABELS[brand.stake_type] });
    if (brand.confidence)
      facts.push({ label: 'Confidence', value: CONFIDENCE_LABELS[brand.confidence] });
    if (brand.acquired_year)
      facts.push({ label: 'Year acquired', value: String(brand.acquired_year) });
    if (brand.exited_year) facts.push({ label: 'Year exited', value: String(brand.exited_year) });
  }
  return facts;
}

const STATUS_LABELS = { current: 'Current', exited: 'Exited' } as const;
const STAKE_LABELS = { majority: 'Majority stake', minority: 'Minority stake' } as const;
const CONFIDENCE_LABELS = {
  confirmed: 'Confirmed',
  reported: 'Reported (not independently confirmed)',
} as const;

/** Whole months between an ISO date and now. */
export function monthsSince(isoDate: string, now: Date): number {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (now.getDate() < d) months -= 1;
  return months;
}

export function isStale(lastVerified: string, now: Date): boolean {
  return monthsSince(lastVerified, now) > STALE_AFTER_MONTHS;
}

export function formatVerifiedDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const month = MONTHS[m - 1] ?? '';
  return `${month} ${d}, ${y}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface SourceInfo {
  url: string;
  lastVerified: string;
  stale: boolean;
}

/** Every displayed claim carries its source. Null means nothing to cite. */
export function sourceInfo(
  category: OwnershipCategory,
  brand: Brand | null,
  now: Date,
): SourceInfo | null {
  if (!brand || category === 'unverified' || !brand.source_url || !brand.last_verified) return null;
  return {
    url: brand.source_url,
    lastVerified: formatVerifiedDate(brand.last_verified),
    stale: isStale(brand.last_verified, now),
  };
}
