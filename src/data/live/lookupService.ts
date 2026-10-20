import type { LookupService } from './types';

/** Native builds have no live lookup yet. See lookupService.web.ts. */
export async function getLookupService(): Promise<LookupService | null> {
  return null;
}
