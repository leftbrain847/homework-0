import type { OwnershipCategory } from '@/domain/types';
import { CLUSTER_COLOR, PIN_SIZE, PIN_SIZE_SELECTED, PIN_STYLES } from '@/ui/pins';

/** HTML for Leaflet divIcons, built from the same tokens as the native PinGlyph. */
export function pinHtml(
  category: OwnershipCategory,
  selected: boolean,
): { html: string; size: number } {
  const s = PIN_STYLES[category];
  const size = selected ? PIN_SIZE_SELECTED : PIN_SIZE;
  const diamond = s.shape === 'diamond';
  const side = diamond ? size * 0.74 : size;
  const width = s.shape === 'rounded' ? side * 1.25 : side;
  const radius =
    s.shape === 'circle' || s.shape === 'dashed-circle'
      ? '50%'
      : s.shape === 'rounded'
        ? `${side * 0.35}px`
        : '4px';
  const shape = [
    `width:${width}px`,
    `height:${side}px`,
    `border-radius:${radius}`,
    `background:${s.outline ? '#FFFFFF' : s.color}`,
    `border:${s.outline ? 2.5 : 2}px ${s.shape === 'dashed-circle' ? 'dashed' : 'solid'} ${s.outline ? s.color : '#FFFFFF'}`,
    `color:${s.outline ? s.color : '#FFFFFF'}`,
    `font:800 ${Math.round(size * 0.46)}px/1 system-ui,sans-serif`,
    'display:flex;align-items:center;justify-content:center;box-sizing:border-box',
    'box-shadow:0 1px 3px rgba(0,0,0,.35)',
    diamond ? 'transform:rotate(45deg)' : '',
  ].join(';');
  const glyph = diamond ? `<span style="transform:rotate(-45deg)">${s.glyph}</span>` : s.glyph;
  const ring = selected
    ? `<span style="position:absolute;left:50%;top:50%;width:${size + 10}px;height:${size + 10}px;margin:-${(size + 10) / 2}px 0 0 -${(size + 10) / 2}px;box-sizing:border-box;border-radius:50%;border:3px solid #18212E;background:rgba(255,255,255,.6)"></span>`
    : '';
  const box = size * 1.3;
  return {
    size: box,
    html: `<span aria-hidden="true" style="position:relative;width:${box}px;height:${size}px;display:flex;align-items:center;justify-content:center">${ring}<span style="position:relative;${shape}">${glyph}</span></span>`,
  };
}

export function clusterHtml(count: number): { html: string; size: number } {
  const size = count >= 100 ? 48 : count >= 10 ? 40 : 34;
  return {
    size,
    html: `<span aria-hidden="true" style="width:${size}px;height:${size}px;border-radius:50%;background:${CLUSTER_COLOR};border:3px solid #fff;color:#fff;font:800 14px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,.35)">${count}</span>`,
  };
}
