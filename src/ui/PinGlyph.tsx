import { StyleSheet, Text, View } from 'react-native';

import type { OwnershipCategory } from '@/domain/types';

import { PIN_SIZE, PIN_STYLES } from './pins';

interface Props {
  category: OwnershipCategory;
  size?: number;
  selected?: boolean;
}

/** Visual pin used on native maps, in the map key and in badges. Decorative: callers label it. */
export function PinGlyph({ category, size = PIN_SIZE, selected = false }: Props) {
  const style = PIN_STYLES[category];
  const diamond = style.shape === 'diamond';
  // A rotated square needs a smaller side to fit the same box.
  const side = diamond ? size * 0.74 : size;
  const shapeStyle = {
    width: style.shape === 'rounded' ? side * 1.25 : side,
    height: side,
    borderRadius:
      style.shape === 'circle' || style.shape === 'dashed-circle'
        ? side / 2
        : style.shape === 'rounded'
          ? side * 0.35
          : 4,
    backgroundColor: style.outline ? '#FFFFFF' : style.color,
    borderColor: style.outline ? style.color : '#FFFFFF',
    borderStyle: style.shape === 'dashed-circle' ? ('dashed' as const) : ('solid' as const),
    borderWidth: style.outline ? 2.5 : 2,
    transform: diamond ? [{ rotate: '45deg' }] : [],
  };

  return (
    <View
      style={[styles.box, { width: size * 1.3, height: size }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {selected && (
        <View
          style={[
            styles.ring,
            { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 },
          ]}
        />
      )}
      <View style={[styles.shape, shapeStyle]}>
        <Text
          allowFontScaling={false}
          style={[
            styles.glyph,
            { fontSize: size * 0.46, color: style.outline ? style.color : '#FFFFFF' },
            diamond && { transform: [{ rotate: '-45deg' }] },
          ]}
        >
          {style.glyph}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  shape: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#18212E',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  glyph: { fontWeight: '800', includeFontPadding: false, textAlign: 'center' },
});
