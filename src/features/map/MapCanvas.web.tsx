import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import type { LocationView } from '@/domain/types';
import { useTheme } from '@/ui/theme';

import { offlineBasemap } from './basemap.web';
import type { MapItem } from './clustering';
import { CLUSTER_HINT, PIN_HINT, clusterAccessibilityLabel, pinAccessibilityLabel } from './labels';
import type { MapCanvasProps } from './MapCanvas.types';
import { clusterHtml, pinHtml } from './pinHtml';
import type { Bounds } from './viewport';

const toLatLngBounds = (b: Bounds) => L.latLngBounds([b.south, b.west], [b.north, b.east]);

/**
 * Web map (preview and future web build). Leaflet with OpenStreetMap tiles,
 * drawn over an offline country/state outline so the map still reads when
 * tiles cannot load (sandboxed previews, offline).
 */
export function MapCanvas(props: MapCanvasProps) {
  const { initialBounds } = props;
  const { scheme } = useTheme();
  const [tilesFailed, setTilesFailed] = useState(false);
  const tileErrors = useRef(0);
  return (
    <View style={StyleSheet.absoluteFill}>
      <MapContainer
        bounds={toLatLngBounds(initialBounds)}
        style={{
          width: '100%',
          height: '100%',
          background: scheme === 'dark' ? '#1B232D' : '#DCE6EE',
        }}
        zoomControl={false}
        attributionControl
        worldCopyJump
        minZoom={2}
      >
        <OfflineBasemap dark={scheme === 'dark'} />
        {!tilesFailed && (
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
            eventHandlers={{
              // Tiles blocked (sandbox, offline): stop retrying and keep the outline map.
              tileerror: () => {
                tileErrors.current += 1;
                if (tileErrors.current >= 8) setTilesFailed(true);
              },
              tileload: () => {
                tileErrors.current = 0;
              },
            }}
          />
        )}
        <Controller {...props} />
      </MapContainer>
    </View>
  );
}

function OfflineBasemap({ dark }: { dark: boolean }) {
  const data = useMemo(() => offlineBasemap(), []);
  const land = dark
    ? { fillColor: '#2A3440', color: '#3F4C5B' }
    : { fillColor: '#F2F0EA', color: '#B9C2CC' };
  return (
    <>
      <GeoJSON
        key={`land-${dark}`}
        data={data.countries}
        style={{ ...land, weight: 1, fillOpacity: 1 }}
        attribution="Outlines: Natural Earth, US Census"
        interactive={false}
      />
      <GeoJSON
        key={`states-${dark}`}
        data={data.states}
        style={{ color: land.color, weight: 0.8, fill: false }}
        interactive={false}
      />
    </>
  );
}

function Controller({
  ref,
  items,
  selectedId,
  userLocation,
  insets,
  onViewportChange,
  onSelect,
  onClusterPress,
  onMapPress,
}: MapCanvasProps) {
  const map = useMap();
  const container = map.getContainer();

  const padding = useMemo(
    () => ({
      paddingTopLeft: L.point(insets.left + 24, insets.top + 24),
      paddingBottomRight: L.point(insets.right + 24, insets.bottom + 24),
    }),
    [insets.left, insets.top, insets.right, insets.bottom],
  );

  useImperativeHandle(ref, () => ({
    flyTo: (center, zoom) => map.flyTo([center.lat, center.lng], zoom, { duration: 0.6 }),
    fitBounds: (b) =>
      map.flyToBounds(toLatLngBounds(b), { ...padding, duration: 0.6, maxZoom: 15 }),
  }));

  const report = () => {
    const b = map.getBounds();
    onViewportChange({
      west: b.getWest(),
      east: b.getEast(),
      south: b.getSouth(),
      north: b.getNorth(),
      zoom: map.getZoom(),
    });
  };
  useMapEvents({ moveend: report, zoomend: report, click: () => onMapPress() });

  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  });
  useEffect(() => {
    // Container size changes when the preview frame or side panel changes.
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      reportRef.current();
    });
    observer.observe(container);
    reportRef.current();
    return () => observer.disconnect();
  }, [map, container]);

  return (
    <>
      {items.map((item) =>
        item.kind === 'cluster' ? (
          <ClusterMarker key={item.id} item={item} onPress={onClusterPress} />
        ) : (
          <PointMarker
            key={item.id}
            view={item.view}
            selected={item.id === selectedId}
            onPress={onSelect}
          />
        ),
      )}
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: '#2F6FDB', fillOpacity: 1 }}
          interactive={false}
        />
      )}
    </>
  );
}

function labelElement(e: L.LeafletEvent, label: string, hint: string, selected?: boolean) {
  const el = (e.target as L.Marker).getElement();
  if (!el) return;
  el.setAttribute('aria-label', `${label} ${hint}.`);
  if (selected !== undefined) el.setAttribute('aria-pressed', String(selected));
}

const PointMarker = memo(function PointMarker({
  view,
  selected,
  onPress,
}: {
  view: LocationView;
  selected: boolean;
  onPress: (view: LocationView) => void;
}) {
  const icon = useMemo(() => {
    const { html, size } = pinHtml(view.category, selected);
    return L.divIcon({
      html,
      className: 'om-pin',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [view.category, selected]);
  const label = pinAccessibilityLabel(view);
  return (
    <Marker
      position={[view.location.lat, view.location.lng]}
      icon={icon}
      keyboard
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onPress(view);
        },
        add: (e) => labelElement(e, label, PIN_HINT, selected),
      }}
    />
  );
});

const ClusterMarker = memo(function ClusterMarker({
  item,
  onPress,
}: {
  item: Extract<MapItem, { kind: 'cluster' }>;
  onPress: (item: Extract<MapItem, { kind: 'cluster' }>) => void;
}) {
  const icon = useMemo(() => {
    const { html, size } = clusterHtml(item.count);
    return L.divIcon({
      html,
      className: 'om-pin',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [item.count]);
  return (
    <Marker
      position={[item.lat, item.lng]}
      icon={icon}
      keyboard
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onPress(item);
        },
        add: (e) => labelElement(e, clusterAccessibilityLabel(item.count) + '.', CLUSTER_HINT),
      }}
    />
  );
});
