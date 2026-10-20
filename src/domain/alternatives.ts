import { boundsAround, distanceKm } from './distance';
import { isPeLinked } from './ownership';
import type { LocationView } from './types';

export interface Alternative {
  view: LocationView;
  distanceKm: number;
}

export interface AlternativesResult {
  /** same_cuisine: matches found. any_cuisine: fallback, no same-cuisine match nearby. */
  match: 'same_cuisine' | 'any_cuisine' | 'none';
  items: Alternative[];
}

export const ALTERNATIVES_RADIUS_KM = 5;
export const ALTERNATIVES_LIMIT = 5;

export function canShowAlternatives(view: LocationView): boolean {
  return isPeLinked(view.category);
}

/**
 * Nearby independents, measured from the selected restaurant (not the user),
 * so no device location is needed. Same cuisine first; falls back to any cuisine.
 */
export function findAlternatives(
  origin: LocationView,
  all: LocationView[],
  radiusKm = ALTERNATIVES_RADIUS_KM,
  limit = ALTERNATIVES_LIMIT,
): AlternativesResult {
  const center = origin.location;
  const box = boundsAround(center, radiusKm);
  const nearby: Alternative[] = [];

  for (const view of all) {
    const { lat, lng, id } = view.location;
    if (view.category !== 'independent' || id === center.id) continue;
    if (lat < box.minLat || lat > box.maxLat || lng < box.minLng || lng > box.maxLng) continue;
    const d = distanceKm(center, view.location);
    if (d <= radiusKm) nearby.push({ view, distanceKm: d });
  }
  nearby.sort((a, b) => a.distanceKm - b.distanceKm);

  const sameCuisine = nearby.filter((a) => a.view.cuisine === origin.cuisine);
  if (sameCuisine.length > 0) return { match: 'same_cuisine', items: sameCuisine.slice(0, limit) };
  if (nearby.length > 0) return { match: 'any_cuisine', items: nearby.slice(0, limit) };
  return { match: 'none', items: [] };
}
