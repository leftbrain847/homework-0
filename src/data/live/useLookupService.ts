import { useEffect, useState } from 'react';

import { getLookupService } from './lookupService';
import type { LookupService } from './types';

/** The live lookup service, or null where this build or view has none. */
export function useLookupService(): LookupService | null {
  const [service, setService] = useState<LookupService | null>(null);
  useEffect(() => {
    let alive = true;
    getLookupService()
      .then((s) => alive && setService(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return service;
}
