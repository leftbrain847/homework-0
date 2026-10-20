import type { Lookup } from '@/domain/liveLookup';

export type SubmitOutcome =
  /** Saved and sent to Claude. */
  | { kind: 'sent'; id: string }
  /** Saved, but Claude could not be messaged automatically. */
  | { kind: 'queued'; id: string; reason: string }
  | { kind: 'failed'; reason: string };

/**
 * Live ownership lookups. The UI depends only on this interface; the web
 * preview implements it with the artifact's shared store plus a message to
 * the Claude session that researches each query. A production build would
 * implement it against a backend.
 */
export interface LookupService {
  submit(query: string): Promise<SubmitOutcome>;
  /** Most recent lookups first. Returns an unsubscribe function. */
  watch(onChange: (lookups: Lookup[]) => void, onError: (message: string) => void): () => void;
}
