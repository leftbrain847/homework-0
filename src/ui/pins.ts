import type { OwnershipCategory } from '@/domain/types';

export type PinShape =
  'square' | 'diamond' | 'circle' | 'rounded' | 'hollow-square' | 'dashed-circle';

export interface PinStyle {
  shape: PinShape;
  /** Fill for solid shapes; border and glyph colour for outline shapes. */
  color: string;
  glyph: string;
  outline: boolean;
}

// Shape + glyph + colour, never colour alone. Neutral hues; no alarm reds.
export const PIN_STYLES: Record<OwnershipCategory, PinStyle> = {
  pe_backed: { shape: 'square', color: '#44568A', glyph: 'P', outline: false },
  pe_franchise: { shape: 'diamond', color: '#6E5A8E', glyph: 'F', outline: false },
  previously_pe: { shape: 'hollow-square', color: '#44568A', glyph: 'E', outline: true },
  independent: { shape: 'circle', color: '#2C6E62', glyph: 'I', outline: false },
  chain: { shape: 'rounded', color: '#75684F', glyph: 'C', outline: false },
  unverified: { shape: 'dashed-circle', color: '#5F6875', glyph: '?', outline: true },
};

export const CLUSTER_COLOR = '#2B3440';
export const PIN_SIZE = 28;
export const PIN_SIZE_SELECTED = 38;

/** Order used in the map key. */
export const LEGEND_ORDER: OwnershipCategory[] = [
  'pe_backed',
  'pe_franchise',
  'independent',
  'previously_pe',
  'chain',
  'unverified',
];
