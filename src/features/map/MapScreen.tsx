import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDirectory, useDirectoryContext } from '@/data/DirectoryProvider';
import type { Directory } from '@/domain/directory';
import type { LatLng, LocationView } from '@/domain/types';
import { LocationDetails } from '@/features/details/LocationDetails';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { useLayout } from '@/ui/layout';
import { Sheet } from '@/ui/Sheet';
import { radius, space, useTheme } from '@/ui/theme';

import type { MapItem } from './clustering';
import { FilterBar } from './FilterBar';
import { MapCanvas } from './MapCanvas';
import type { MapCanvasHandle } from './MapCanvas.types';
import { MapKey } from './MapKey';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { useMapData } from './useMapData';
import { NEAR_ME_MESSAGES, useNearMe } from './useNearMe';
import {
  FOCUS_ZOOM,
  NEAR_ME_ZOOM,
  WORLD,
  longitudeDeltaForZoom,
  viewsBounds,
  type Viewport,
} from './viewport';

const SIDE_PANEL_WIDTH = 400;

export function MapScreen() {
  const { state } = useDirectoryContext();
  const directory = useDirectory();
  const { colors } = useTheme();

  if (state.status === 'error') {
    return (
      <Centered>
        <AppText>Could not load restaurant data: {state.message}</AppText>
      </Centered>
    );
  }
  if (!directory) {
    return (
      <Centered>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Loading restaurants" />
      </Centered>
    );
  }
  return <LoadedMapScreen directory={directory} />;
}

function Centered({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.centered, { backgroundColor: colors.bg }]}>{children}</View>;
}

type Panel = 'none' | 'key';

function LoadedMapScreen({ directory }: { directory: Directory }) {
  const { colors } = useTheme();
  const { wide, width, height } = useLayout();
  const safe = useSafeAreaInsets();
  const mapRef = useRef<MapCanvasHandle>(null);

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('none');
  const data = useMapData(directory, viewport, selectedId);
  const selected = selectedId ? (directory.getView(selectedId) ?? null) : null;

  const initialBounds = useMemo(() => viewsBounds(directory.views) ?? WORLD, [directory]);

  const nearMe = useNearMe(
    useCallback((pos: LatLng) => {
      mapRef.current?.flyTo(pos, NEAR_ME_ZOOM);
    }, []),
  );

  const select = useCallback((view: LocationView) => {
    setPanel('none');
    setSelectedId(view.location.id);
  }, []);

  /** Select and bring into view, keeping the pin clear of the bottom sheet. */
  const focus = (view: LocationView) => {
    select(view);
    const { lat, lng } = view.location;
    const shift = wide ? 0 : longitudeDeltaForZoom(FOCUS_ZOOM, width) * (height / width) * 0.2;
    mapRef.current?.flyTo({ lat: lat - shift, lng }, FOCUS_ZOOM);
  };

  const onClusterPress = useCallback(
    (item: Extract<MapItem, { kind: 'cluster' }>) =>
      mapRef.current?.flyTo({ lat: item.lat, lng: item.lng }, data.expansionZoom(item.clusterId)),
    [data],
  );

  const openFirm = (id: string) => router.push({ pathname: '/firm/[id]', params: { id } });
  const openAbout = () => router.push('/about');

  const details = selected && (
    <LocationDetails
      view={selected}
      directory={directory}
      onSelectLocation={focus}
      onOpenFirm={openFirm}
      onOpenAbout={openAbout}
    />
  );

  const insets = wide
    ? { top: 0, bottom: 0, left: SIDE_PANEL_WIDTH, right: 0 }
    : { top: safe.top + 120, bottom: 80, left: 0, right: 0 };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.mapArea, wide && { left: SIDE_PANEL_WIDTH }]}>
        <MapCanvas
          ref={mapRef}
          items={data.items}
          selectedId={selectedId}
          initialBounds={initialBounds}
          userLocation={nearMe.position}
          insets={wide ? { top: 0, bottom: 0, left: 0, right: 0 } : insets}
          onViewportChange={setViewport}
          onSelect={select}
          onClusterPress={onClusterPress}
          onMapPress={() => setSelectedId(null)}
        />
      </View>

      {wide ? (
        <View
          style={[
            styles.side,
            {
              width: SIDE_PANEL_WIDTH,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.sideTop,
              { paddingTop: safe.top + space.lg, borderColor: colors.border },
            ]}
          >
            <View style={styles.titleRow}>
              <AppText variant="heading" accessibilityRole="header">
                Ownership Map
              </AppText>
              <Button label="About and data" text="About" onPress={openAbout} />
            </View>
            <SampleNotice onPress={openAbout} />
            <SearchBar value={data.query} onChange={data.setQuery} />
            <FilterBar value={data.filter} counts={data.counts} onChange={data.setFilter} wrap />
          </View>
          {selected ? (
            <ScrollView contentContainerStyle={styles.sideContent}>
              <Button
                label={data.query ? 'Back to results' : 'Close details'}
                text={data.query ? '‹ Back to results' : 'Close'}
                onPress={() => setSelectedId(null)}
                style={styles.back}
              />
              {details}
            </ScrollView>
          ) : data.query.trim() ? (
            <SearchResults results={data.results} total={data.totalResults} onSelect={focus} />
          ) : (
            <ScrollView contentContainerStyle={styles.sideContent}>
              <AppText muted>
                Select a pin to see who owns it. Shapes and letters show the ownership type:
              </AppText>
              <MapKey />
            </ScrollView>
          )}
          <View style={[styles.sideFooter, { borderColor: colors.border }]}>
            <NearMeButton status={nearMe.status} onPress={nearMe.locate} />
            <NearMeMessage status={nearMe.status} onDismiss={nearMe.dismiss} />
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.top, { paddingTop: safe.top + space.sm }]} pointerEvents="box-none">
            <View style={styles.searchRow}>
              <View style={styles.flex}>
                <SearchBar value={data.query} onChange={data.setQuery} />
              </View>
              <Pressable
                onPress={openAbout}
                accessibilityRole="button"
                accessibilityLabel="About and data"
                style={[
                  styles.roundButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <AppText variant="bodyStrong">i</AppText>
              </Pressable>
            </View>
            <FilterBar value={data.filter} counts={data.counts} onChange={data.setFilter} />
            <SampleNotice onPress={openAbout} compact />
            {data.query.trim() !== '' && !selected && (
              <View
                style={[
                  styles.results,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    maxHeight: height * 0.5,
                  },
                ]}
              >
                <SearchResults results={data.results} total={data.totalResults} onSelect={focus} />
              </View>
            )}
          </View>

          {!selected && panel === 'none' && (
            <View
              style={[styles.fabs, { bottom: safe.bottom + space.lg }]}
              pointerEvents="box-none"
            >
              <NearMeMessage status={nearMe.status} onDismiss={nearMe.dismiss} />
              <View style={styles.fabRow}>
                <Button label="Map key" text="Key" onPress={() => setPanel('key')} />
                <NearMeButton status={nearMe.status} onPress={nearMe.locate} />
              </View>
            </View>
          )}

          {selected && (
            <Sheet
              title={`Details for ${selected.location.name}`}
              contentKey={selected.location.id}
              maxHeight={height * 0.62}
              onClose={() => setSelectedId(null)}
            >
              {details}
            </Sheet>
          )}
          {!selected && panel === 'key' && (
            <Sheet
              title="Map key"
              contentKey="key"
              maxHeight={height * 0.62}
              onClose={() => setPanel('none')}
            >
              <View style={styles.keyContent}>
                <AppText variant="title" accessibilityRole="header">
                  Map key
                </AppText>
                <MapKey />
              </View>
            </Sheet>
          )}
        </>
      )}
    </View>
  );
}

function SampleNotice({ onPress, compact = false }: { onPress: () => void; compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Sample data. All businesses shown are fictional. Opens About."
      style={[
        styles.notice,
        compact && styles.noticeCompact,
        { backgroundColor: colors.notice, borderColor: colors.border },
      ]}
    >
      <AppText variant="caption" style={{ color: colors.text }}>
        <AppText variant="caption" style={{ fontWeight: '700', color: colors.text }}>
          Sample data
        </AppText>
        {' · All businesses shown are fictional'}
      </AppText>
    </Pressable>
  );
}

function NearMeButton({ status, onPress }: { status: string; onPress: () => void }) {
  const locating = status === 'locating';
  return (
    <Button
      variant="primary"
      label={locating ? 'Finding your location' : 'Near me'}
      text={locating ? 'Locating…' : 'Near me'}
      onPress={onPress}
      disabled={locating}
      accessibilityHint="Centers the map on your location. Your location stays on this device."
    />
  );
}

function NearMeMessage({ status, onDismiss }: { status: string; onDismiss: () => void }) {
  const { colors } = useTheme();
  if (status !== 'denied' && status !== 'unavailable') return null;
  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityHint="Dismisses this message"
      accessibilityLiveRegion="polite"
      style={[styles.message, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <AppText variant="caption">{NEAR_ME_MESSAGES[status]}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  mapArea: StyleSheet.absoluteFill,
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  searchRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  results: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  notice: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
  },
  noticeCompact: { alignSelf: 'flex-start' },
  fabs: {
    position: 'absolute',
    right: space.md,
    left: space.md,
    alignItems: 'flex-end',
    gap: space.sm,
  },
  fabRow: { flexDirection: 'row', gap: space.sm },
  message: { borderWidth: 1, borderRadius: radius.md, padding: space.md, maxWidth: 360 },
  side: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRightWidth: 1 },
  sideTop: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideContent: { padding: space.lg, gap: space.lg },
  sideFooter: { padding: space.md, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  back: { alignSelf: 'flex-start' },
  keyContent: { gap: space.lg },
});
