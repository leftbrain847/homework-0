import { Linking } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from './theme';

interface Props {
  href: string;
  children: string;
  accessibilityHint?: string;
}

export function ExternalLink({ href, children, accessibilityHint }: Props) {
  const { colors } = useTheme();
  return (
    <AppText
      accessibilityRole="link"
      accessibilityHint={accessibilityHint ?? 'Opens in your browser'}
      onPress={() => void Linking.openURL(href)}
      style={{ color: colors.accent, textDecorationLine: 'underline' }}
    >
      {children}
    </AppText>
  );
}
