import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { radius, space, useTheme } from './theme';
import { useFocusOnChange } from './useFocusOnChange';

interface Props {
  /** Spoken when the sheet opens. */
  title: string;
  /** Changes when the content changes, to move focus to the new content. */
  contentKey: string;
  maxHeight: number;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet for compact layouts. Not modal: the map stays usable above it.
 * Focus moves to the sheet when it opens or its content changes.
 */
export function Sheet({ title, contentKey, maxHeight, onClose, children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focusRef = useFocusOnChange(contentKey);
  return (
    <View
      style={[
        styles.sheet,
        {
          maxHeight,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: '#000',
        },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        <View
          ref={focusRef}
          accessible
          accessibilityLabel={title}
          focusable
          tabIndex={-1}
          style={styles.titleTarget}
        />
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          style={[styles.close, { backgroundColor: colors.surfaceAlt }]}
        >
          <AppText variant="bodyStrong">✕</AppText>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: space.xl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
  },
  top: { height: 40, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 40, height: 5, borderRadius: 3 },
  titleTarget: { position: 'absolute', left: 0, top: 0, width: 1, height: 1 },
  close: {
    position: 'absolute',
    right: space.md,
    top: space.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: space.lg, paddingTop: space.xs },
});
