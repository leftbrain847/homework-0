import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useDirectoryContext, type DatasetName } from '@/data/DirectoryProvider';
import { SchemeOverrideProvider, type SchemeOverride } from '@/ui/theme';

const ENABLED = process.env.EXPO_PUBLIC_PREVIEW_SHELL === '1';

const DEVICES = {
  phone: { label: 'Phone', width: 390, height: 844 },
  desktop: { label: 'Desktop', width: 1280, height: 800 },
} as const;
type Device = keyof typeof DEVICES;

const TOOLBAR_HEIGHT = 52;
const GUTTER = 16;

/**
 * Development/UAT wrapper for the web build: renders the app inside a phone
 * or desktop frame with toggles for device, dataset and colour scheme.
 * Enabled only when EXPO_PUBLIC_PREVIEW_SHELL=1; a shipped web build omits it.
 */
export function PreviewShell({ children }: { children: ReactNode }) {
  if (!ENABLED) return children;
  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: ReactNode }) {
  const window = useWindowDimensions();
  const { dataset, setDataset } = useDirectoryContext();
  const [device, setDevice] = useState<Device>(window.width < 700 ? 'phone' : 'desktop');
  const [scheme, setScheme] = useState<SchemeOverride>('system');

  const availW = window.width - GUTTER * 2;
  const availH = window.height - TOOLBAR_HEIGHT - GUTTER * 2;
  const size = DEVICES[device];
  // On a real phone, phone mode fills the screen instead of drawing a frame.
  const fill = device === 'phone' && window.width < 600;
  const border = fill ? 0 : device === 'phone' ? 10 : 1;
  const scale = fill
    ? 1
    : Math.min(1, availW / (size.width + border * 2), availH / (size.height + border * 2));
  const frameW = fill ? window.width : size.width;
  const frameH = fill ? window.height - TOOLBAR_HEIGHT : size.height;

  return (
    <View style={styles.page}>
      <View
        style={styles.toolbar}
        accessibilityRole="toolbar"
        accessibilityLabel="Preview controls"
      >
        <Text style={styles.brand} numberOfLines={1}>
          Preview
        </Text>
        <Segmented
          label="Device"
          value={device}
          options={[
            ['phone', 'Phone'],
            ['desktop', 'Desktop'],
          ]}
          onChange={setDevice}
        />
        <Segmented
          label="Data"
          value={dataset}
          options={[
            ['sample', 'Sample'],
            ['stress', '5,000 pins'],
          ]}
          onChange={(d: DatasetName) => setDataset(d)}
        />
        <Segmented
          label="Theme"
          value={scheme}
          options={[
            ['system', 'Auto'],
            ['light', 'Light'],
            ['dark', 'Dark'],
          ]}
          onChange={setScheme}
        />
      </View>
      <View style={[styles.stage, fill && styles.stageFill]}>
        <View
          style={{ width: (frameW + border * 2) * scale, height: (frameH + border * 2) * scale }}
        >
          {/* Remount per device so the app starts fresh, as on a real device. */}
          <View
            key={device}
            style={[
              styles.frame,
              !fill && (device === 'phone' ? styles.phoneFrame : styles.desktopFrame),
              {
                width: frameW,
                height: frameH,
                transform: [{ scale }],
                transformOrigin: 'top left',
              },
            ]}
          >
            <SchemeOverrideProvider value={scheme}>{children}</SchemeOverrideProvider>
          </View>
        </View>
      </View>
    </View>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map(([key, text]) => {
        const checked = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            accessibilityLabel={`${label}: ${text}`}
            style={[styles.option, checked && styles.optionOn]}
          >
            <Text style={[styles.optionText, checked && styles.optionTextOn]}>{text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// The shell is a tool around the app, so it has its own fixed dark chrome.
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#20262E', height: '100%' as unknown as number },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: GUTTER,
    backgroundColor: '#151A20',
    overflow: 'scroll' as unknown as 'hidden',
  },
  brand: {
    color: '#C9D2DC',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  segment: { flexDirection: 'row', backgroundColor: '#2A323C', borderRadius: 8, padding: 2 },
  option: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  optionOn: { backgroundColor: '#E7ECF2' },
  optionText: { color: '#C9D2DC', fontSize: 13, fontWeight: '600', whiteSpace: 'nowrap' } as object,
  optionTextOn: { color: '#151A20' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: GUTTER },
  stageFill: { padding: 0, alignItems: 'stretch', justifyContent: 'flex-start' },
  frame: { overflow: 'hidden', backgroundColor: '#FFFFFF' },
  phoneFrame: {
    borderRadius: 36,
    borderWidth: 10,
    borderColor: '#0B0E12',
    boxSizing: 'content-box',
  } as object,
  desktopFrame: { borderRadius: 10, borderWidth: 1, borderColor: '#0B0E12' },
});
