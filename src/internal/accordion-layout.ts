/**
 * Layout maths for `<AccordionGallery />`, kept free of DOM access so it can
 * run at build time (the component) and under test.
 */

/** The open panel can take between a fifth and nine tenths of the row. */
export const MIN_EXPAND = 0.2;
export const MAX_EXPAND = 0.9;

/** Clamp the user's `expand` share into the range the layout can render. */
export function clampExpand(share: number): number {
  if (!Number.isFinite(share)) return 0.5;
  return Math.min(MAX_EXPAND, Math.max(MIN_EXPAND, share));
}

/**
 * The `flex-grow` the open panel needs so that it takes `share` of the row
 * while every closed panel has `flex-grow: 1`.
 *
 * With `n` panels, one open with grow `g` and `n - 1` closed with grow 1, the
 * open panel's share is `g / (g + n - 1)`. Solving for `g` gives
 * `share * (n - 1) / (1 - share)`. Only one property animates on hover, which
 * keeps the motion smooth, and the share is exact for any photo count.
 */
export function accordionGrow(share: number, count: number): number {
  if (count <= 1) return 1;
  const s = clampExpand(share);
  return Math.round(((s * (count - 1)) / (1 - s)) * 1000) / 1000;
}
