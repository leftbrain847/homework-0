import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from './AppText';
import { radius, space, useTheme } from './theme';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  /** Visible text when it differs from the spoken label. */
  text?: string;
  variant?: 'primary' | 'secondary' | 'chip';
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, text, variant = 'secondary', selected, style, ...rest }: Props) {
  const { colors } = useTheme();
  const filled = variant === 'primary' || (variant === 'chip' && selected);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        variant === 'chip' && styles.chip,
        {
          backgroundColor: filled ? colors.accent : colors.surface,
          borderColor: filled ? colors.accent : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <AppText
        variant="bodyStrong"
        numberOfLines={1}
        style={{
          color: filled ? colors.onAccent : colors.text,
          fontSize: variant === 'chip' ? 14 : 15,
        }}
      >
        {text ?? label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: { minHeight: 36, paddingHorizontal: space.md, borderRadius: radius.pill },
});
