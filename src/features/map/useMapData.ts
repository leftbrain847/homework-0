import { useMemo, useState } from 'react';

import type { Directory } from '@/domain/directory';
import { applyFilter, countByFilter } from '@/domain/filter';
import { search } from '@/domain/search';
import type { FilterKey, LocationView } from '@/domain/types';

import { createClusterIndex, type MapItem } from './clustering';
import type { Viewport } from './viewport';

export const MAX_SEARCH_RESULTS = 50;

/** All map-screen derivations in one place; components only render the results. */
export function useMapData(
  directory: Directory,
  viewport: Viewport | null,
  selectedId: string | null,
) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  const searched = useMemo(() => search(directory.views, query), [directory, query]);
  const counts = useMemo(() => countByFilter(searched), [searched]);
  const visible = useMemo(() => applyFilter(searched, filter), [searched, filter]);
  const index = useMemo(() => createClusterIndex(visible), [visible]);

  const items = useMemo<MapItem[]>(() => {
    if (!viewport) return [];
    const result = index.query(viewport);
    // Keep the selected restaurant visible even when it would sit inside a cluster.
    const selected = selectedId ? directory.getView(selectedId) : undefined;
    if (selected && !result.some((i) => i.kind === 'point' && i.id === selectedId)) {
      const { lat, lng, id } = selected.location;
      result.push({ kind: 'point', id, lat, lng, view: selected });
    }
    return result;
  }, [index, viewport, selectedId, directory]);

  const results: LocationView[] = useMemo(
    () => (query.trim() ? visible.slice(0, MAX_SEARCH_RESULTS) : []),
    [visible, query],
  );

  return {
    filter,
    setFilter,
    query,
    setQuery,
    counts,
    visible,
    items,
    results,
    totalResults: query.trim() ? visible.length : 0,
    expansionZoom: index.expansionZoom,
  };
}
