import type { LocationView } from './types';

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function haystack(view: LocationView): string {
  return normalize(`${view.location.name} ${view.brand?.name ?? ''}`);
}

/**
 * Matches restaurant or brand name. Every query word must start a word in the
 * name, so "harb bur" finds "Harborline Burger Co." but "urger" does not.
 */
export function matchesQuery(view: LocationView, query: string): boolean {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const words = haystack(view).split(' ');
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

export function search(views: LocationView[], query: string): LocationView[] {
  if (!normalize(query)) return views;
  return views.filter((v) => matchesQuery(v, query));
}
