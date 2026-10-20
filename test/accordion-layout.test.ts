import { describe, expect, it } from 'vitest';
import { accordionGrow, clampExpand } from '../src/internal/accordion-layout.js';

describe('clampExpand', () => {
  it('keeps sensible shares and clamps the rest', () => {
    expect(clampExpand(0.5)).toBe(0.5);
    expect(clampExpand(0.05)).toBe(0.2);
    expect(clampExpand(1.4)).toBe(0.9);
    expect(clampExpand(Number.NaN)).toBe(0.5);
  });
});

describe('accordionGrow', () => {
  it('gives the open panel exactly its share of the row', () => {
    for (const [share, count] of [
      [0.5, 13],
      [0.6, 5],
      [0.35, 20],
      [0.9, 2],
    ] as const) {
      const g = accordionGrow(share, count);
      expect(g / (g + count - 1)).toBeCloseTo(share, 2);
    }
  });

  it('is 12 for a half-width open panel among thirteen', () => {
    expect(accordionGrow(0.5, 13)).toBe(12);
  });

  it('is irrelevant for a single photo', () => {
    expect(accordionGrow(0.5, 1)).toBe(1);
    expect(accordionGrow(0.5, 0)).toBe(1);
  });
});
