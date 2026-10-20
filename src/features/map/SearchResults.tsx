import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS } from '@/domain/ownership';
import type { LocationView } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { PinGlyph } from '@/ui/PinGlyph';
import { space, useTheme } from '@/ui/theme';

interface Props {
  results: LocationView[];
  total: number;
  onSelect: (view: LocationView) => void;
}

export function SearchResults({ results, total, onSelect }: Props) {
  const { colors } = useTheme();
  if (results.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText muted accessibilityLiveRegion="polite">
          No restaurants match. Try another name, or switch the filter to All.
        </AppText>
      </View>
    );
  }
  return (
    <FlatList
      data={results}
      keyExtractor={(v) => v.location.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <AppText variant="caption" muted style={styles.count} accessibilityLiveRegion="polite">
          {total > results.length ? `Showing ${results.length} of ${total}` : `${total} found`}
        </AppText>
      }
      ItemSeparatorComponent={() => (
        <View style={[styles.sep, { backgroundColor: colors.border }]} />
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.location.name}. ${CATEGORY_LABELS[item.category]}. ${item.location.address}`}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}
        >
          <PinGlyph category={item.category} size={22} />
          <View style={styles.text}>
            <AppText variant="bodyStrong" numberOfLines={2}>
              {item.location.name}
            </AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {CATEGORY_LABELS[item.category]} · {item.location.address}
            </AppText>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { padding: space.lg },
  count: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    minHeight: 56,
  },
  text: { flex: 1, minWidth: 0 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
});
