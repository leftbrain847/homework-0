import { createContext, use, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EBEFF4',
  text: '#18212E',
  textMuted: '#4F5A69',
  border: '#D3D9E1',
  accent: '#24466E',
  onAccent: '#FFFFFF',
  notice: '#E8EDF4',
  warning: '#7A5300',
  warningBg: '#FBF1DC',
  scrim: 'rgba(15, 20, 27, 0.08)',
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  bg: '#0F141B',
  surface: '#18202A',
  surfaceAlt: '#232D39',
  text: '#E7ECF2',
  textMuted: '#A6B1C0',
  border: '#33404F',
  accent: '#9DBDE6',
  onAccent: '#0F141B',
  notice: '#1E2834',
  warning: '#F0C46B',
  warningBg: '#3A2E14',
  scrim: 'rgba(0, 0, 0, 0.3)',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;
export const type = {
  caption: 12,
  body: 15,
  bodyLarge: 17,
  title: 20,
  heading: 24,
} as const;

export type SchemeOverride = 'system' | 'light' | 'dark';

const SchemeContext = createContext<SchemeOverride>('system');

/** Lets the web preview shell force light or dark mode. */
export function SchemeOverrideProvider({
  value,
  children,
}: {
  value: SchemeOverride;
  children: ReactNode;
}) {
  return <SchemeContext value={value}>{children}</SchemeContext>;
}

export function useTheme() {
  const system = useColorScheme();
  const override = use(SchemeContext);
  const scheme = override === 'system' ? (system === 'dark' ? 'dark' : 'light') : override;
  return useMemo(() => ({ scheme, colors: scheme === 'dark' ? dark : light }), [scheme]);
}
