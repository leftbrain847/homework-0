import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DirectoryProvider } from '@/data/DirectoryProvider';
import { PreviewShell } from '@/features/preview/PreviewShell';
import { LayoutProvider } from '@/ui/layout';
import { useTheme } from '@/ui/theme';

export default function RootLayout() {
  return (
    <DirectoryProvider>
      <PreviewShell>
        <SafeAreaProvider>
          <LayoutProvider>
            <AppStack />
          </LayoutProvider>
        </SafeAreaProvider>
      </PreviewShell>
    </DirectoryProvider>
  );
}

function AppStack() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Ownership Map' }} />
        <Stack.Screen name="about" options={{ title: 'About and data' }} />
        <Stack.Screen name="firm/[id]" options={{ title: 'Firm' }} />
        <Stack.Screen name="lookup" options={{ title: 'Live ownership lookup' }} />
      </Stack>
    </>
  );
}
