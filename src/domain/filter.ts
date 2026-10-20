import type { FilterKey, LocationView, OwnershipCategory } from './types';

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pe_backed', label: 'PE-backed' },
  { key: 'independent', label: 'Independent' },
  { key: 'pe_franchise', label: 'Franchise of PE-backed brand' },
];

/** Exited, chain and unverified locations appear under "All" only. */
export function matchesFilter(category: OwnershipCategory, filter: FilterKey): boolean {
  return filter === 'all' || category === filter;
}

export function applyFilter(views: LocationView[], filter: FilterKey): LocationView[] {
  return filter === 'all' ? views : views.filter((v) => matchesFilter(v.category, filter));
}

export function countByFilter(views: LocationView[]): Record<FilterKey, number> {
  const counts: Record<FilterKey, number> = {
    all: views.length,
    pe_backed: 0,
    pe_franchise: 0,
    independent: 0,
  };
  for (const v of views) {
    if (v.category === 'pe_backed' || v.category === 'pe_franchise' || v.category === 'independent')
      counts[v.category] += 1;
  }
  return counts;
}
