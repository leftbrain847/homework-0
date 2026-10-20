import type { LatLng, LocationView } from '@/domain/types';

import type { MapItem } from './clustering';
import type { Bounds, Viewport } from './viewport';

export interface MapCanvasHandle {
  flyTo(center: LatLng, zoom: number): void;
  fitBounds(bounds: Bounds): void;
}

export interface MapCanvasProps {
  ref?: React.Ref<MapCanvasHandle>;
  items: MapItem[];
  selectedId: string | null;
  initialBounds: Bounds;
  userLocation: LatLng | null;
  /** Space covered by overlays, so fitted content is not hidden under them. */
  insets: { top: number; bottom: number; left: number; right: number };
  onViewportChange(viewport: Viewport): void;
  onSelect(view: LocationView): void;
  onClusterPress(item: Extract<MapItem, { kind: 'cluster' }>): void;
  onMapPress(): void;
}
