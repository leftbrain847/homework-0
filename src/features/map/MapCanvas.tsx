import { memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { MapMarker, type MapPressEvent, type Region } from 'react-native-maps';

import type { LocationView } from '@/domain/types';
import { useLayout } from '@/ui/layout';
import { PinGlyph } from '@/ui/PinGlyph';
import { CLUSTER_COLOR, PIN_SIZE, PIN_SIZE_SELECTED } from '@/ui/pins';

import type { MapItem } from './clustering';
import { CLUSTER_HINT, PIN_HINT, clusterAccessibilityLabel, pinAccessibilityLabel } from './labels';
import type { MapCanvasProps } from './MapCanvas.types';
import { longitudeDeltaForZoom, zoomForLongitudeDelta, type Bounds } from './viewport';

/** Native map: Apple Maps on iOS, Google Maps on Android. */
export function MapCanvas({
  ref,
  items,
  selectedId,
  initialBounds,
  userLocation,
  insets,
  onViewportChange,
  onSelect,
  onClusterPress,
  onMapPress,
}: MapCanvasProps) {
  const mapRef = useRef<MapView>(null);
  const { width } = useLayout();

  const fit = (b: Bounds) =>
    mapRef.current?.fitToCoordinates(
      [
        { latitude: b.south, longitude: b.west },
        { latitude: b.north, longitude: b.east },
      ],
      {
        edgePadding: { ...insets, top: insets.top + 24, bottom: insets.bottom + 24 },
        animated: true,
      },
    );

  useImperativeHandle(ref, () => ({
    flyTo(center, zoom) {
      const lngDelta = longitudeDeltaForZoom(zoom, width);
      mapRef.current?.animateToRegion(
        {
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: lngDelta,
          longitudeDelta: lngDelta,
        },
        350,
      );
    },
    fitBounds: fit,
  }));

  const handleRegion = (region: Region) => {
    const halfLng = region.longitudeDelta / 2;
    const halfLat = region.latitudeDelta / 2;
    onViewportChange({
      west: region.longitude - halfLng,
      east: region.longitude + halfLng,
      south: region.latitude - halfLat,
      north: region.latitude + halfLat,
      zoom: zoomForLongitudeDelta(region.longitudeDelta, width),
    });
  };

  const handlePress = (e: MapPressEvent) => {
    if (e.nativeEvent.action === 'marker-press') return;
    onMapPress();
  };

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={regionFor(initialBounds)}
      onMapReady={() => fit(initialBounds)}
      onRegionChangeComplete={handleRegion}
      onPress={handlePress}
      showsUserLocation={userLocation !== null}
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      toolbarEnabled={false}
      moveOnMarkerPress={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
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
    </MapView>
  );
}

function regionFor(b: Bounds): Region {
  return {
    latitude: (b.north + b.south) / 2,
    longitude: (b.east + b.west) / 2,
    latitudeDelta: Math.max(0.02, (b.north - b.south) * 1.3),
    longitudeDelta: Math.max(0.02, (b.east - b.west) * 1.3),
  };
}

/**
 * Custom-view markers re-render as bitmaps while tracksViewChanges is true,
 * which is expensive with many pins. Track briefly after a visual change, then stop.
 */
function useTrackViewChanges(key: string) {
  const [settledKey, setSettledKey] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSettledKey(key), 400);
    return () => clearTimeout(t);
  }, [key]);
  return settledKey !== key;
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
  const tracks = useTrackViewChanges(`${selected}-${view.category}`);
  return (
    <MapMarker
      coordinate={{ latitude: view.location.lat, longitude: view.location.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracks}
      stopPropagation
      zIndex={selected ? 1000 : 1}
      onPress={() => onPress(view)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={pinAccessibilityLabel(view)}
      accessibilityHint={PIN_HINT}
      accessibilityState={{ selected }}
    >
      <PinGlyph
        category={view.category}
        size={selected ? PIN_SIZE_SELECTED : PIN_SIZE}
        selected={selected}
      />
    </MapMarker>
  );
});

const ClusterMarker = memo(function ClusterMarker({
  item,
  onPress,
}: {
  item: Extract<MapItem, { kind: 'cluster' }>;
  onPress: (item: Extract<MapItem, { kind: 'cluster' }>) => void;
}) {
  const tracks = useTrackViewChanges(String(item.count));
  const size = item.count >= 100 ? 48 : item.count >= 10 ? 40 : 34;
  return (
    <MapMarker
      coordinate={{ latitude: item.lat, longitude: item.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracks}
      stopPropagation
      onPress={() => onPress(item)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={clusterAccessibilityLabel(item.count)}
      accessibilityHint={CLUSTER_HINT}
    >
      <View style={[styles.cluster, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text allowFontScaling={false} style={styles.clusterText}>
          {item.count}
        </Text>
      </View>
    </MapMarker>
  );
});

const styles = StyleSheet.create({
  cluster: {
    backgroundColor: CLUSTER_COLOR,
    borderColor: '#FFFFFF',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
