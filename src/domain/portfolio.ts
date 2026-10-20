import { classifyBrand, type FirmLookup } from './ownership';
import type { Brand, Firm } from './types';

export interface PortfolioEntry {
  brand: Brand;
  /** Names from the firm down to the brand, e.g. ["Quillmere", "Brightplate", "Harborline"]. */
  path: string[];
  locationCount: number;
}

export interface Portfolio {
  firm: Firm;
  current: PortfolioEntry[];
  exited: PortfolioEntry[];
}

/**
 * Every sourced brand the firm appears above, at any level of the chain
 * (so ownership through a holding company is included). Unverified brands
 * are left out: no source, no PE label.
 */
export function buildPortfolio(
  firm: Firm,
  brands: Brand[],
  getFirm: FirmLookup,
  locationCounts: Map<string, number>,
): Portfolio {
  const current: PortfolioEntry[] = [];
  const exited: PortfolioEntry[] = [];

  for (const brand of brands) {
    const levelIndex = brand.ownership_chain.findIndex((level) => level.includes(firm.id));
    if (levelIndex === -1) continue;
    const category = classifyBrand(brand, getFirm);
    if (category !== 'pe_backed' && category !== 'previously_pe') continue;

    const below = brand.ownership_chain
      .slice(levelIndex + 1)
      .map((level) => level.map((id) => getFirm(id)?.name ?? id).join(' + '));
    const entry: PortfolioEntry = {
      brand,
      path: [firm.name, ...below, brand.name],
      locationCount: locationCounts.get(brand.id) ?? 0,
    };
    (category === 'pe_backed' ? current : exited).push(entry);
  }

  const byName = (a: PortfolioEntry, b: PortfolioEntry) => a.brand.name.localeCompare(b.brand.name);
  return { firm, current: current.sort(byName), exited: exited.sort(byName) };
}
