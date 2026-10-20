import { Pressable, StyleSheet, View } from 'react-native';

import type { AlternativesResult } from '@/domain/alternatives';
import { ALTERNATIVES_RADIUS_KM } from '@/domain/alternatives';
import { cuisineLabel } from '@/domain/cuisine';
import { formatDistance, unitForLocale } from '@/domain/distance';
import type { LocationView } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { PinGlyph } from '@/ui/PinGlyph';
import { radius, space, useTheme } from '@/ui/theme';

const unit = unitForLocale(Intl.DateTimeFormat().resolvedOptions().locale);

interface Props {
  origin: LocationView;
  result: AlternativesResult;
  onSelect: (view: LocationView) => void;
}

export function AlternativesList({ origin, result, onSelect }: Props) {
  const { colors } = useTheme();
  const cuisine = cuisineLabel(origin.cuisine).toLowerCase();
  const radiusText = formatDistance(ALTERNATIVES_RADIUS_KM, unit);
  const subtitle =
    result.match === 'same_cuisine'
      ? `Same cuisine (${cuisine}) within ${radiusText}, nearest first`
      : result.match === 'any_cuisine'
        ? `No independent ${cuisine} places within ${radiusText}. Other independents nearby:`
        : `No independent restaurants within ${radiusText} in this dataset.`;

  return (
    <View style={styles.section}>
      <AppText variant="label" muted accessibilityRole="header">
        Independent alternatives nearby
      </AppText>
      <AppText variant="caption" muted>
        {subtitle}
      </AppText>
      {result.items.map(({ view, distanceKm }) => (
        <Pressable
          key={view.location.id}
          onPress={() => onSelect(view)}
          accessibilityRole="button"
          accessibilityLabel={`${view.location.name}, ${cuisineLabel(view.cuisine)}, ${formatDistance(distanceKm, unit)} away`}
          accessibilityHint="Shows this restaurant on the map"
          style={({ pressed }) => [
            styles.row,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
            },
          ]}
        >
          <PinGlyph category="independent" size={20} />
          <View style={styles.text}>
            <AppText variant="bodyStrong" numberOfLines={2}>
              {view.location.name}
            </AppText>
            <AppText variant="caption" muted>
              {cuisineLabel(view.cuisine)}
            </AppText>
          </View>
          <AppText variant="caption" muted style={styles.distance}>
            {formatDistance(distanceKm, unit)}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 52,
    paddingVertical: space.sm,
  },
  text: { flex: 1, minWidth: 0 },
  distance: { fontVariant: ['tabular-nums'] },
});
