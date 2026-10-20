import type { LatLng, LocationView } from '@/domain/types';

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface Viewport extends Bounds {
  zoom: number;
}

export const WORLD: Bounds = { west: -180, south: -85, east: 180, north: 85 };
export const MAX_CLUSTER_ZOOM = 16;
export const FOCUS_ZOOM = 15;
export const NEAR_ME_ZOOM = 13;

export function boundsOf(points: LatLng[]): Bounds | null {
  if (points.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const { lat, lng } of points) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return { west, south, east, north };
}

export function viewsBounds(views: LocationView[]): Bounds | null {
  return boundsOf(views.map((v) => v.location));
}

/** Web-Mercator zoom for a longitude span shown across `widthPx`. */
export function zoomForLongitudeDelta(lngDelta: number, widthPx = 360): number {
  const zoom = Math.log2((360 * (widthPx / 256)) / Math.max(lngDelta, 1e-6));
  return Math.max(0, Math.min(20, zoom));
}

export function longitudeDeltaForZoom(zoom: number, widthPx = 360): number {
  return (360 * (widthPx / 256)) / 2 ** zoom;
}
