import { createContext, use, useState, type ReactNode } from 'react';
import { Dimensions, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

/** Width at which the map screen switches from bottom sheet to side panel. */
export const WIDE_BREAKPOINT = 768;

export interface LayoutInfo {
  width: number;
  height: number;
  wide: boolean;
}

const initial = Dimensions.get('window');
const LayoutContext = createContext<LayoutInfo>({
  width: initial.width,
  height: initial.height,
  wide: initial.width >= WIDE_BREAKPOINT,
});

/**
 * Measures the app's own container rather than the window, so the layout
 * responds correctly inside the web preview's phone/desktop frames.
 */
export function LayoutProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<LayoutInfo>(() => ({
    width: initial.width,
    height: initial.height,
    wide: initial.width >= WIDE_BREAKPOINT,
  }));
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== info.width || height !== info.height)
      setInfo({ width, height, wide: width >= WIDE_BREAKPOINT });
  };
  return (
    <View style={styles.fill} onLayout={onLayout}>
      <LayoutContext value={info}>{children}</LayoutContext>
    </View>
  );
}

export function useLayout(): LayoutInfo {
  return use(LayoutContext);
}

const styles = StyleSheet.create({ fill: { flex: 1, overflow: 'hidden' } });
