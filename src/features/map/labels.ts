import { CATEGORY_LABELS } from '@/domain/ownership';
import type { LocationView } from '@/domain/types';

export function pinAccessibilityLabel(view: LocationView): string {
  return `${view.location.name}. ${CATEGORY_LABELS[view.category]}.`;
}

export function clusterAccessibilityLabel(count: number): string {
  return `Group of ${count} restaurants`;
}

export const CLUSTER_HINT = 'Zooms the map in to show them';
export const PIN_HINT = 'Shows ownership details';
