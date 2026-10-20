import type { Cuisine } from './cuisine';

export type { Cuisine };

export type FirmType = 'pe_firm' | 'holding_company';

export interface Firm {
  id: string;
  name: string;
  type: FirmType;
  website: string | null;
}

export type OwnershipStatus = 'current' | 'exited';
export type StakeType = 'majority' | 'minority';
export type Confidence = 'confirmed' | 'reported';

/** Ownership is a brand-level fact. */
export interface Brand {
  id: string;
  name: string;
  cuisine: Cuisine;
  parent_company: string | null;
  /** Ultimate owner first. Each level holds one or more firm ids (co-owners). */
  ownership_chain: string[][];
  status: OwnershipStatus | null;
  stake_type: StakeType | null;
  confidence: Confidence | null;
  acquired_year: number | null;
  exited_year: number | null;
  source_url: string | null;
  /** ISO date, YYYY-MM-DD. */
  last_verified: string | null;
  independent_group: boolean;
}

/** The map is location-level. Locations carry no ownership facts. */
export interface RestaurantLocation {
  id: string;
  brand_id: string | null;
  name: string;
  address: string;
  lat: number;
  lng: number;
  cuisine: Cuisine | null;
  is_franchised: boolean;
}

export interface Dataset {
  firms: Firm[];
  brands: Brand[];
  locations: RestaurantLocation[];
}

/**
 * What a pin represents. Derived, never stored.
 * - pe_backed: company-run location of a brand with a current, sourced PE stake
 * - pe_franchise: franchised location of such a brand
 * - previously_pe: brand's sourced PE ownership has ended
 * - independent: no brand, or a local independent group
 * - chain: sourced brand with no PE firm in its chain
 * - unverified: no source on record
 */
export type OwnershipCategory =
  'pe_backed' | 'pe_franchise' | 'previously_pe' | 'independent' | 'chain' | 'unverified';

export type FilterKey = 'all' | 'pe_backed' | 'pe_franchise' | 'independent';

export interface LatLng {
  lat: number;
  lng: number;
}

/** A location joined with its brand, ready for display. */
export interface LocationView {
  location: RestaurantLocation;
  brand: Brand | null;
  cuisine: Cuisine;
  category: OwnershipCategory;
}
