/**
 * The composition engine behind `BrutalistImageGrid`. Pure and build-time only.
 *
 * Photos are read in order and matched against a small set of spreads (a
 * feature with a frame dropped over its corner, two overlapping landscapes, a
 * portrait beside a landscape, a staggered cluster of compacts, …). Each spread
 * becomes one row of a 12-column desktop grid. Rows alternate sides, so the
 * page swings left and right while the DOM order, and so the reading order,
 * never changes.
 */
import type { TravelLayout } from './types.js';

export const GRID_COLUMNS = 12;

export interface Placement {
  /** Desktop grid lines, `[start, end)` on a 12-column grid. */
  col: [number, number];
  /** Desktop grid row, 1-based. Frames of one spread share a row. */
  row: number;
  /** Vertical offset in steps of `--exp-drop`; staggers the frames of a spread. */
  drop: 0 | 1 | 2;
  /** Sits on top of a neighbour it overlaps. */
  lift: boolean;
  /**
   * Which edge the caption hugs. A frame that is overlapped on its right keeps
   * its caption on the left (and the other way round), so overlaps never cover
   * text.
   */
  captionAlign: 'start' | 'end';
  /** Which half of the narrow layouts the frame leans towards. */
  side: 'start' | 'end';
}

type Slot = Omit<Placement, 'row' | 'side'>;

const slot = (
  start: number,
  end: number,
  drop: Placement['drop'] = 0,
  extra: Partial<Slot> = {},
): Slot => ({ col: [start, end], drop, lift: false, captionAlign: 'start', ...extra });

/** Flip a slot onto the other side of the grid. */
function mirrorSlot(s: Slot): Slot {
  const [start, end] = s.col;
  return {
    ...s,
    col: [GRID_COLUMNS + 2 - end, GRID_COLUMNS + 2 - start],
    captionAlign: s.captionAlign === 'start' ? 'end' : 'start',
  };
}

/** Longest run of `compact` frames starting at `i`, capped at four. */
function compactRun(layouts: TravelLayout[], i: number): number {
  let n = 0;
  while (n < 4 && layouts[i + n] === 'compact') n += 1;
  return n;
}

/** Match the spread that starts at `i`. Returns its slots, one per frame consumed. */
function matchSpread(layouts: TravelLayout[], i: number): Slot[] {
  const a = layouts[i]!;
  const b = layouts[i + 1];

  if (a === 'panorama') return [slot(1, 13)];

  if (a === 'feature') {
    // Feature with a smaller frame dropped over its far corner.
    if (b === 'portrait') return [slot(1, 9), slot(8, 12, 2, { lift: true })];
    if (b === 'compact') return [slot(1, 9), slot(8, 11, 2, { lift: true })];
    return [slot(1, 11)];
  }

  if (a === 'landscape') {
    // Two horizontal frames sharing one column, the second staggered down.
    if (b === 'landscape') return [slot(1, 8), slot(7, 13, 1, { lift: true })];
    if (b === 'portrait') return [slot(1, 9), slot(9, 13, 1)];
    return [slot(3, 11)];
  }

  if (a === 'portrait') {
    if (b === 'landscape') return [slot(2, 6, 1), slot(6, 13)];
    if (b === 'portrait') return [slot(2, 6), slot(8, 12, 2)];
    return [slot(6, 10)];
  }

  // compact
  const run = compactRun(layouts, i);
  if (run === 4) return [slot(1, 4), slot(4, 7, 1), slot(7, 10), slot(10, 13, 2)];
  if (run === 3) return [slot(1, 4, 1), slot(5, 8), slot(10, 13, 2)];
  if (run === 2) return [slot(3, 6), slot(8, 11, 2)];
  return [slot(9, 12)];
}

/**
 * Place every frame of a chapter.
 *
 * @param layouts One entry per photo, in reading order.
 * @param mirror  Start the first spread on the right.
 */
export function composeSpreads(layouts: TravelLayout[], mirror = false): Placement[] {
  const out: Placement[] = [];
  let row = 1;
  let flip = mirror;
  let i = 0;

  while (i < layouts.length) {
    const slots = matchSpread(layouts, i);
    // Full-width rows have no side to swap, so they don't advance the swing.
    const fullWidth = slots.length === 1 && slots[0]!.col[0] === 1 && slots[0]!.col[1] === 13;
    slots.forEach((s, k) => {
      const placed = flip ? mirrorSlot(s) : s;
      const side: Placement['side'] = (k % 2 === 0) !== flip ? 'start' : 'end';
      out.push({ ...placed, row, side });
    });
    i += slots.length;
    row += 1;
    if (!fullWidth) flip = !flip;
  }

  return out;
}

/** Rhythm for photos without an explicit layout that aren't clearly panoramic or tall. */
const RHYTHM: TravelLayout[] = [
  'feature',
  'compact',
  'landscape',
  'landscape',
  'compact',
  'compact',
  'compact',
];

/**
 * Fill in missing layouts. Very wide photos become panoramas, tall ones
 * portraits; everything else follows a fixed rhythm so a chapter swings
 * between dense and spacious spreads.
 */
export function assignLayouts(
  items: Array<{ layout?: TravelLayout; aspectRatio: number }>,
): TravelLayout[] {
  let beat = 0;
  return items.map(({ layout, aspectRatio }) => {
    if (layout) return layout;
    if (aspectRatio >= 2) return 'panorama';
    if (aspectRatio < 0.85) return 'portrait';
    const picked = RHYTHM[beat % RHYTHM.length]!;
    beat += 1;
    return picked;
  });
}

/** Columns a layout spans on the 6-column tablet grid. */
export const TABLET_SPAN: Record<TravelLayout, number> = {
  panorama: 6,
  feature: 6,
  landscape: 4,
  portrait: 3,
  compact: 3,
};

/** Share of the phone width a layout fills. */
const PHONE_WIDTH: Record<TravelLayout, number> = {
  panorama: 100,
  feature: 100,
  landscape: 100,
  portrait: 82,
  compact: 50,
};

/** `<img sizes>` that matches where a frame actually lands at each breakpoint. */
export function sizesFor(layout: TravelLayout, placement: Placement): string {
  const desktop = Math.round(((placement.col[1] - placement.col[0]) / GRID_COLUMNS) * 100);
  const tablet = Math.round((TABLET_SPAN[layout] / 6) * 100);
  return `(min-width: 1024px) ${desktop}vw, (min-width: 640px) ${tablet}vw, ${PHONE_WIDTH[layout]}vw`;
}

/** Zero-padded frame label, e.g. `frameLabel(14, 86)` → `"014 / 086"`. */
export function frameLabel(frame: number, total: number): string {
  const width = Math.max(3, String(total).length);
  return `${String(frame).padStart(width, '0')} / ${String(total).padStart(width, '0')}`;
}

/** Format GPS coordinates as a compact label: `50.198° N 5.485° W`. */
export function formatCoordinates(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(3)}° ${ns} ${Math.abs(lng).toFixed(3)}° ${ew}`;
}

/** Split a display line spec into lines: arrays as given, strings on `\n`. */
export function toLines(text: string | string[]): string[] {
  const lines = Array.isArray(text) ? text : text.split('\n');
  return lines.map((l) => l.trim()).filter(Boolean);
}
