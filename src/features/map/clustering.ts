import Supercluster from 'supercluster';

import type { LocationView } from '@/domain/types';

import { MAX_CLUSTER_ZOOM, type Viewport } from './viewport';

export type MapItem =
  | { kind: 'point'; id: string; lat: number; lng: number; view: LocationView }
  | { kind: 'cluster'; id: string; lat: number; lng: number; count: number; clusterId: number };

type PointProps = { id: string };

export interface ClusterIndex {
  query(viewport: Viewport): MapItem[];
  expansionZoom(clusterId: number): number;
}

/**
 * Builds a spatial index once per filtered result set; querying by viewport
 * returns only what is on screen, so thousands of pins stay cheap to render.
 */
export function createClusterIndex(views: LocationView[]): ClusterIndex {
  const byId = new Map(views.map((v) => [v.location.id, v]));
  const index = new Supercluster<PointProps>({
    radius: 56,
    maxZoom: MAX_CLUSTER_ZOOM,
    minPoints: 3,
  });
  index.load(
    views.map((v) => ({
      type: 'Feature' as const,
      properties: { id: v.location.id },
      geometry: { type: 'Point' as const, coordinates: [v.location.lng, v.location.lat] },
    })),
  );

  return {
    query({ west, south, east, north, zoom }) {
      const z = Math.max(0, Math.min(MAX_CLUSTER_ZOOM + 1, Math.round(zoom)));
      const boxes: [number, number, number, number][] =
        west <= east
          ? [[west, south, east, north]]
          : // Viewport crosses the antimeridian.
            [
              [west, south, 180, north],
              [-180, south, east, north],
            ];
      const items: MapItem[] = [];
      for (const box of boxes) {
        for (const f of index.getClusters(box, z)) {
          const [lng, lat] = f.geometry.coordinates as [number, number];
          const props = f.properties as Partial<Supercluster.ClusterProperties> &
            Partial<PointProps>;
          if (props.cluster && props.cluster_id !== undefined) {
            items.push({
              kind: 'cluster',
              id: `c${props.cluster_id}`,
              lat,
              lng,
              count: props.point_count ?? 0,
              clusterId: props.cluster_id,
            });
          } else if (props.id) {
            const view = byId.get(props.id);
            if (view) items.push({ kind: 'point', id: props.id, lat, lng, view });
          }
        }
      }
      return items;
    },
    expansionZoom: (clusterId) => Math.min(index.getClusterExpansionZoom(clusterId), 18),
  };
}
