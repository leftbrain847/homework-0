import { Text, type TextProps } from 'react-native';

import { type, useTheme } from './theme';

type Variant = 'caption' | 'body' | 'bodyStrong' | 'title' | 'heading' | 'label';

interface Props extends TextProps {
  variant?: Variant;
  muted?: boolean;
}

/** Text with theme colour and the app type scale. Scales with the system text size. */
export function AppText({ variant = 'body', muted = false, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={2}
      style={[{ color: muted ? colors.textMuted : colors.text }, VARIANTS[variant], style]}
      {...rest}
    />
  );
}

const VARIANTS = {
  caption: { fontSize: type.caption, lineHeight: 16 },
  body: { fontSize: type.body, lineHeight: 21 },
  bodyStrong: { fontSize: type.body, lineHeight: 21, fontWeight: '600' as const },
  title: { fontSize: type.title, lineHeight: 26, fontWeight: '700' as const },
  heading: { fontSize: type.heading, lineHeight: 30, fontWeight: '700' as const },
  label: {
    fontSize: type.caption,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
};
