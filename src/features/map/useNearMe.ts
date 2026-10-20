import * as Location from 'expo-location';
import { useState } from 'react';

import type { LatLng } from '@/domain/types';

export type NearMeStatus = 'idle' | 'locating' | 'denied' | 'unavailable';

export const NEAR_ME_MESSAGES: Record<Exclude<NearMeStatus, 'idle' | 'locating'>, string> = {
  denied: 'Location permission is off. You can turn it on in Settings, or search instead.',
  unavailable: "Your location isn't available right now. Try again, or search instead.",
};

/**
 * Asks for location permission only when the user taps "Near me".
 * The position stays in memory on the device; it is never stored or sent.
 */
export function useNearMe(onLocated: (position: LatLng) => void) {
  const [status, setStatus] = useState<NearMeStatus>('idle');
  const [position, setPosition] = useState<LatLng | null>(null);

  async function locate() {
    setStatus('locating');
    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }
      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const here = { lat: fix.coords.latitude, lng: fix.coords.longitude };
      setPosition(here);
      setStatus('idle');
      onLocated(here);
    } catch {
      setStatus('unavailable');
    }
  }

  return { status, position, locate, dismiss: () => setStatus('idle') };
}
