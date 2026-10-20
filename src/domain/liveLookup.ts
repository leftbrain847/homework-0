import { classifyBrand, type FirmLookup } from './ownership';
import type { Brand, Firm, FirmType, OwnershipCategory } from './types';

/**
 * Live ownership lookups: a researched answer for one searched name.
 * Results arrive as untrusted JSON (written to the preview's shared store),
 * so everything is validated here and the sourcing rules are re-applied
 * before anything is shown.
 */

export type LookupStatus = 'queued' | 'researching' | 'done' | 'failed';

export interface LookupSource {
  url: string;
  title: string;
  publisher: string;
  /** ISO date the source was published, when known. */
  published: string | null;
  /** The sentence in the source that supports the claim. */
  quote: string;
}

export type FranchiseModel = 'mostly_franchised' | 'mostly_company_operated' | 'mixed' | 'unknown';

export interface LookupResult {
  /** What the query was resolved to, e.g. "Subway (sandwich chain)". */
  resolvedName: string;
  /** brand = multi-location brand or group; single = one restaurant. */
  kind: 'brand' | 'single';
  ownershipChain: { name: string; type: FirmType }[][];
  status: Brand['status'];
  stakeType: Brand['stake_type'];
  confidence: Brand['confidence'];
  acquiredYear: number | null;
  exitedYear: number | null;
  independent: boolean;
  franchiseModel: FranchiseModel;
  sources: LookupSource[];
  lastVerified: string | null;
  notes: string | null;
}

export interface Lookup {
  id: string;
  query: string;
  status: LookupStatus;
  createdAt: number;
  /** False when the request could not be sent to Claude automatically. */
  notified: boolean | null;
  result: LookupResult | null;
  error: string | null;
}

const MAX_QUERY_LENGTH = 100;

/** Trim, collapse whitespace, drop control characters, cap length. */
export function cleanQuery(raw: string): string {
  return raw
    .replace(/\p{Cc}|\p{Cf}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

// ---------------------------------------------------------------------------
// Parsing untrusted documents
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 2000): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const year = (v: unknown): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1900 && v <= 2100 ? v : null;
const isoDate = (v: unknown): string | null =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
const oneOf = <T extends string>(v: unknown, options: readonly T[]): T | null =>
  options.includes(v as T) ? (v as T) : null;
const httpUrl = (v: unknown): string | null => {
  const s = str(v, 2000);
  if (!s || !/^https?:\/\/[^\s]+$/i.test(s)) return null;
  try {
    return new URL(s).hostname ? s : null;
  } catch {
    return null;
  }
};

function parseSource(v: unknown): LookupSource | null {
  if (!isObj(v)) return null;
  const url = httpUrl(v.url);
  const quote = str(v.quote, 600);
  // A source without a supporting quote does not count.
  if (!url || !quote) return null;
  return {
    url,
    quote,
    title: str(v.title, 300) ?? url,
    publisher: str(v.publisher, 120) ?? new URL(url).hostname,
    published: isoDate(v.published),
  };
}

function parseChain(v: unknown): LookupResult['ownershipChain'] {
  if (!Array.isArray(v)) return [];
  return v
    .map((level) =>
      Array.isArray(level)
        ? level
            .filter(isObj)
            .map((e) => ({
              name: str(e.name, 200) ?? '',
              type: oneOf(e.type, ['pe_firm', 'holding_company'] as const) ?? 'holding_company',
            }))
            .filter((e) => e.name)
        : [],
    )
    .filter((level) => level.length > 0)
    .slice(0, 8);
}

export function parseLookupResult(v: unknown): LookupResult | null {
  if (!isObj(v)) return null;
  const resolvedName = str(v.resolved_name, 200);
  if (!resolvedName) return null;
  return {
    resolvedName,
    kind: v.kind === 'single' ? 'single' : 'brand',
    ownershipChain: parseChain(v.ownership_chain),
    status: oneOf(v.status, ['current', 'exited'] as const),
    stakeType: oneOf(v.stake_type, ['majority', 'minority'] as const),
    confidence: oneOf(v.confidence, ['confirmed', 'reported'] as const),
    acquiredYear: year(v.acquired_year),
    exitedYear: year(v.exited_year),
    independent: v.independent === true,
    franchiseModel:
      oneOf(v.franchise_model, [
        'mostly_franchised',
        'mostly_company_operated',
        'mixed',
        'unknown',
      ] as const) ?? 'unknown',
    sources: (Array.isArray(v.sources) ? v.sources : [])
      .map(parseSource)
      .filter((s): s is LookupSource => s !== null)
      .slice(0, 10),
    lastVerified: isoDate(v.last_verified),
    notes: str(v.notes, 600),
  };
}

export function parseLookup(id: string, v: unknown): Lookup | null {
  if (!isObj(v)) return null;
  const query = str(v.query, MAX_QUERY_LENGTH);
  if (!query) return null;
  return {
    id,
    query,
    status: oneOf(v.status, ['queued', 'researching', 'done', 'failed'] as const) ?? 'queued',
    createdAt: typeof v.createdAt === 'number' ? v.createdAt : 0,
    notified: typeof v.notified === 'boolean' ? v.notified : null,
    result: v.result === undefined || v.result === null ? null : parseLookupResult(v.result),
    error: str(v.error, 300),
  };
}

// ---------------------------------------------------------------------------
// Mapping to the ownership model, so live answers use the same wording rules
// ---------------------------------------------------------------------------

/** Two independent publishers are needed for "confirmed"; otherwise "reported". */
export function effectiveConfidence(result: LookupResult): Brand['confidence'] {
  if (!result.confidence) return null;
  const publishers = new Set(result.sources.map((s) => s.publisher.toLowerCase()));
  return result.confidence === 'confirmed' && publishers.size < 2 ? 'reported' : result.confidence;
}

export interface LiveOwnership {
  /** Null for a single independent restaurant (headline "Independent restaurant"). */
  brand: Brand | null;
  getFirm: FirmLookup;
  category: OwnershipCategory;
}

export function toLiveOwnership(result: LookupResult): LiveOwnership {
  const firms = new Map<string, Firm>();
  const chain = result.ownershipChain.map((level, i) =>
    level.map((entry, j) => {
      const id = `live_${i}_${j}`;
      firms.set(id, { id, name: entry.name, type: entry.type, website: null });
      return id;
    }),
  );
  const getFirm: FirmLookup = (id) => firms.get(id);
  const primary = result.sources[0];
  // No supporting source means no claim of any kind, independence included.
  if (!primary || !result.lastVerified) {
    return { brand: null, getFirm, category: 'unverified' };
  }

  const brand: Brand = {
    id: 'live',
    name: result.resolvedName,
    cuisine: 'american',
    parent_company: chain.at(-1)?.[0] ?? null,
    ownership_chain: chain,
    status: result.status,
    stake_type: result.stakeType,
    confidence: effectiveConfidence(result),
    acquired_year: result.acquiredYear,
    exited_year: result.exitedYear,
    source_url: primary.url,
    last_verified: result.lastVerified,
    independent_group: result.independent && result.kind === 'brand',
  };
  const category = classifyBrand(brand, getFirm);
  if (result.independent && result.kind === 'single' && category === 'chain') {
    return { brand: null, getFirm, category: 'independent' };
  }
  return { brand, getFirm, category };
}

export function franchiseNote(result: LookupResult, category: OwnershipCategory): string | null {
  if (category !== 'pe_backed' && category !== 'previously_pe') return null;
  if (result.franchiseModel === 'mostly_franchised' || result.franchiseModel === 'mixed') {
    return category === 'pe_backed'
      ? 'Many locations are run by franchisees. For those, the franchisor is PE-owned, not the restaurant itself.'
      : 'Many locations are run by franchisees; the ownership above applied to the franchisor.';
  }
  return null;
}
