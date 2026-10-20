import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Platform, type View } from 'react-native';

/** Moves screen-reader (or keyboard, on web) focus to the element when `key` changes. */
export function useFocusOnChange(key: unknown) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || key === null || key === undefined) return;
    const t = setTimeout(() => {
      if (Platform.OS === 'web') (node as unknown as HTMLElement).focus?.();
      else AccessibilityInfo.sendAccessibilityEvent(node, 'focus');
    }, 250);
    return () => clearTimeout(t);
  }, [key]);
  return ref;
}
