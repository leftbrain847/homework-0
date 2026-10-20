import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FILTERS } from '@/domain/filter';
import type { FilterKey } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { radius, space, useTheme } from '@/ui/theme';

interface Props {
  value: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (key: FilterKey) => void;
  wrap?: boolean;
}

export function FilterBar({ value, counts, onChange, wrap = false }: Props) {
  const { colors } = useTheme();
  const chips = FILTERS.map(({ key, label }) => {
    const checked = key === value;
    return (
      <Pressable
        key={key}
        onPress={() => onChange(key)}
        accessibilityRole="radio"
        accessibilityState={{ checked }}
        accessibilityLabel={`${label}, ${counts[key]} restaurants`}
        hitSlop={4}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: checked ? colors.accent : colors.surface,
            borderColor: checked ? colors.accent : colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <AppText
          variant="bodyStrong"
          style={{ color: checked ? colors.onAccent : colors.text, fontSize: 14 }}
        >
          {label}
          <AppText style={{ color: checked ? colors.onAccent : colors.textMuted, fontSize: 14 }}>
            {`  ${counts[key]}`}
          </AppText>
        </AppText>
      </Pressable>
    );
  });

  return wrap ? (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Filter by ownership"
      style={styles.wrapRow}
    >
      {chips}
    </View>
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel="Filter by ownership"
      contentContainerStyle={styles.row}
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingVertical: 2 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 38,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
});
