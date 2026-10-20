import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { radius, space, useTheme } from '@/ui/theme';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search restaurants or brands"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Search restaurants or brands"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        maxFontSizeMultiplier={2}
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          style={styles.clear}
        >
          <AppText muted variant="bodyStrong">
            ✕
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 46,
    paddingLeft: space.md,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: space.sm, outlineWidth: 0 } as object,
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
