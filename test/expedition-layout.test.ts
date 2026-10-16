import { describe, expect, it } from 'vitest';
import {
  assignLayouts,
  composeSpreads,
  formatCoordinates,
  frameLabel,
  sizesFor,
  toLines,
} from '../src/internal/expedition/layout.js';

describe('composeSpreads', () => {
  it('drops a portrait over the far corner of a feature', () => {
    const [feature, portrait] = composeSpreads(['feature', 'portrait']);
    expect(feature).toMatchObject({ col: [1, 9], row: 1, drop: 0, captionAlign: 'start' });
    expect(portrait).toMatchObject({ col: [8, 12], row: 1, drop: 2, lift: true });
    // One shared column: an overlap, not a gap.
    expect(portrait!.col[0]).toBeLessThan(feature!.col[1]);
  });

  it('mirrors a spread and moves the overlapped caption out of the way', () => {
    const [feature, portrait] = composeSpreads(['feature', 'portrait'], true);
    expect(feature).toMatchObject({ col: [5, 13], captionAlign: 'end', side: 'end' });
    expect(portrait).toMatchObject({ col: [2, 6], side: 'start' });
  });

  it('alternates sides row by row, but full-width rows do not swing', () => {
    const p = composeSpreads(['landscape', 'panorama', 'landscape', 'landscape']);
    expect(p.map((x) => x.row)).toEqual([1, 2, 3, 3]);
    expect(p[0]!.col).toEqual([3, 11]);
    expect(p[1]!.col).toEqual([1, 13]);
    // Row 3 is mirrored because row 1 was not; the panorama in between doesn't count.
    expect(p[2]!.col).toEqual([6, 13]);
    expect(p[3]!.col).toEqual([1, 7]);
  });

  it('staggers a cluster of up to four compacts in one row', () => {
    const p = composeSpreads(['compact', 'compact', 'compact', 'compact', 'compact']);
    expect(p.slice(0, 4).every((x) => x.row === 1)).toBe(true);
    expect(p.slice(0, 4).map((x) => x.drop)).toEqual([0, 1, 0, 2]);
    expect(p[4]!.row).toBe(2);
  });

  it('keeps every frame inside the 12-column grid', () => {
    const all = ['feature', 'compact', 'landscape', 'portrait', 'panorama', 'compact'] as const;
    for (const mirror of [false, true]) {
      for (const pl of composeSpreads([...all, ...all], mirror)) {
        expect(pl.col[0]).toBeGreaterThanOrEqual(1);
        expect(pl.col[1]).toBeLessThanOrEqual(13);
        expect(pl.col[1]).toBeGreaterThan(pl.col[0]);
      }
    }
  });
});

describe('assignLayouts', () => {
  it('keeps explicit layouts and reads very wide or tall photos', () => {
    expect(
      assignLayouts([
        { layout: 'compact', aspectRatio: 1.5 },
        { aspectRatio: 2.4 },
        { aspectRatio: 0.66 },
        { aspectRatio: 1.33 },
        { aspectRatio: 1.33 },
      ]),
    ).toEqual(['compact', 'panorama', 'portrait', 'feature', 'compact']);
  });
});

describe('helpers', () => {
  it('pads frame labels to the total', () => {
    expect(frameLabel(14, 86)).toBe('014 / 086');
    expect(frameLabel(7, 1200)).toBe('0007 / 1200');
  });

  it('formats coordinates with hemispheres', () => {
    expect(formatCoordinates(50.1981, -5.4853)).toBe('50.198° N 5.485° W');
    expect(formatCoordinates(-33.86, 151.21)).toBe('33.860° S 151.210° E');
  });

  it('derives sizes from the desktop span', () => {
    const [feature] = composeSpreads(['feature']);
    expect(sizesFor('feature', feature!)).toBe(
      '(min-width: 1024px) 83vw, (min-width: 640px) 100vw, 100vw',
    );
  });

  it('splits display lines', () => {
    expect(toLines('The world\n doesn’t \n\nfit in a grid.')).toEqual([
      'The world',
      'doesn’t',
      'fit in a grid.',
    ]);
    expect(toLines(['A', ' B '])).toEqual(['A', 'B']);
  });
});
