import type { LatLng } from './types';

const EARTH_RADIUS_KM = 6371;
const KM_PER_MILE = 1.609344;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Bounding box around a point; cheap pre-filter before exact distance. */
export function boundsAround(center: LatLng, radiusKm: number) {
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * Math.max(Math.cos(toRad(center.lat)), 1e-6));
  return {
    minLat: center.lat - dLat,
    maxLat: center.lat + dLat,
    minLng: center.lng - dLng,
    maxLng: center.lng + dLng,
  };
}

export type DistanceUnit = 'km' | 'mi';

/** Regions that use miles for road distance. */
const MILE_REGIONS = new Set(['US', 'GB', 'LR', 'MM']);

export function unitForLocale(locale: string): DistanceUnit {
  const region = locale.split(/[-_]/)[1]?.toUpperCase();
  return region && MILE_REGIONS.has(region) ? 'mi' : 'km';
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  const value = unit === 'mi' ? km / KM_PER_MILE : km;
  if (value < 0.1) return `< 0.1 ${unit}`;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${unit}`;
}
