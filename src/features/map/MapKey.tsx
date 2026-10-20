import { StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS } from '@/domain/ownership';
import type { OwnershipCategory } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { PinGlyph } from '@/ui/PinGlyph';
import { LEGEND_ORDER } from '@/ui/pins';
import { space } from '@/ui/theme';

export const CATEGORY_DESCRIPTIONS: Record<OwnershipCategory, string> = {
  pe_backed: 'Brand has a current, sourced private equity stake',
  pe_franchise: 'Franchised location; the franchisor is PE-backed',
  independent: 'No parent brand, or a small local group',
  previously_pe: 'Brand was PE-owned; that ownership has ended',
  chain: 'Chain with no PE owner in our sources',
  unverified: 'No sourced ownership record yet',
};

/** The map key. Shape + letter + colour for each pin type. */
export function MapKey() {
  return (
    <View style={styles.list}>
      {LEGEND_ORDER.map((category) => (
        <View
          key={category}
          style={styles.row}
          accessible
          accessibilityLabel={`${CATEGORY_LABELS[category]}: ${CATEGORY_DESCRIPTIONS[category]}`}
        >
          <PinGlyph category={category} size={24} />
          <View style={styles.text}>
            <AppText variant="bodyStrong">{CATEGORY_LABELS[category]}</AppText>
            <AppText variant="caption" muted>
              {CATEGORY_DESCRIPTIONS[category]}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  text: { flex: 1, minWidth: 0 },
});
