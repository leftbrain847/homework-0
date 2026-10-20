import type { Feature, FeatureCollection, MultiLineString, Polygon, Position } from 'geojson';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import states from 'us-atlas/states-10m.json';
import countries from 'world-atlas/countries-50m.json';

// Natural Earth / US Census outlines (public domain, via world-atlas and us-atlas).
let cache: { countries: FeatureCollection; states: MultiLineString } | null = null;

export function offlineBasemap() {
  if (!cache) {
    const c = countries as unknown as Topology<{ countries: GeometryCollection }>;
    const s = states as unknown as Topology<{ states: GeometryCollection }>;
    cache = {
      countries: dropAntimeridianParts(feature(c, c.objects.countries) as FeatureCollection),
      states: mesh(s, s.objects.states, (a, b) => a !== b),
    };
  }
  return cache;
}

const spansAntimeridian = (ring: Position[]) => {
  let min = 180;
  let max = -180;
  for (const [lng] of ring) {
    min = Math.min(min, lng!);
    max = Math.max(max, lng!);
  }
  return max - min > 180;
};

/**
 * Leaflet draws rings that cross ±180° as bands across the whole map.
 * Drop those polygon parts (Antarctica, far-east Russia, Fiji); the rest stays.
 */
function dropAntimeridianParts(fc: FeatureCollection): FeatureCollection {
  const features: Feature[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    const polygons: Position[][][] =
      g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    const kept = polygons.filter((p) => !p.some(spansAntimeridian));
    if (kept.length === 0) continue;
    features.push({
      ...f,
      geometry: { type: 'MultiPolygon', coordinates: kept as Polygon['coordinates'][] },
    });
  }
  return { type: 'FeatureCollection', features };
}
