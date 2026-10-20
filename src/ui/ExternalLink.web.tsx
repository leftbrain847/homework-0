import { AppText } from './AppText';
import { useTheme } from './theme';

interface Props {
  href: string;
  children: string;
  accessibilityHint?: string;
}

// react-native-web renders Text with href as a real <a>, which keeps
// middle-click, copy-link and new-tab behaviour.
const webLinkProps = (href: string) =>
  ({ href, hrefAttrs: { target: '_blank', rel: 'noopener noreferrer' } }) as object;

export function ExternalLink({ href, children }: Props) {
  const { colors } = useTheme();
  return (
    <AppText
      accessibilityRole="link"
      {...webLinkProps(href)}
      style={{ color: colors.accent, textDecorationLine: 'underline' }}
    >
      {children}
    </AppText>
  );
}
