import { describe, expect, it } from 'vitest';
import { cleanDescription, humanizeFilename, resolveAlt } from '../src/internal/alt.js';

describe('humanizeFilename', () => {
  it('turns a descriptive file name into a phrase', () => {
    expect(humanizeFilename('rome-colosseum_at-sunset.jpg')).toBe('Rome colosseum at sunset');
    expect(humanizeFilename('/src/assets/images/trips/Old Town Square.png')).toBe(
      'Old Town Square',
    );
    expect(humanizeFilename('lakeDistrict.webp')).toBe('Lake District');
    expect(humanizeFilename('01-colosseum.jpg')).toBe('Colosseum');
    expect(humanizeFilename('09-gianicolo-sunset.jpg')).toBe('Gianicolo sunset');
    expect(humanizeFilename('beach-2.jpg')).toBe('Beach');
  });

  it('returns "" for camera-generated names', () => {
    expect(humanizeFilename('IMG_4821.JPG')).toBe('');
    expect(humanizeFilename('DSC01234.jpg')).toBe('');
    expect(humanizeFilename('PXL_20240612_180000.jpg')).toBe('');
    expect(humanizeFilename('20240612.jpg')).toBe('');
  });
});

describe('cleanDescription', () => {
  it('keeps a real caption, drops junk', () => {
    expect(cleanDescription('  Sunset over the forum  ')).toBe('Sunset over the forum');
    expect(cleanDescription('OLYMPUS DIGITAL CAMERA')).toBe('');
    expect(cleanDescription('')).toBe('');
    expect(cleanDescription(null)).toBe('');
  });
});

describe('resolveAlt', () => {
  it('prefers explicit > description > filename > fallback', () => {
    expect(
      resolveAlt({ file: 'IMG_1.jpg', explicit: 'A red door', description: 'x', index: 1 }),
    ).toBe('A red door');

    expect(resolveAlt({ file: 'IMG_1.jpg', description: 'Harbour at dawn', index: 1 })).toBe(
      'Harbour at dawn',
    );

    expect(resolveAlt({ file: 'venice-canal.jpg', index: 2 })).toBe('Venice canal');

    expect(resolveAlt({ file: 'IMG_1.jpg', album: 'Italy 2024', index: 3 })).toBe(
      'Italy 2024 — photo 3',
    );

    expect(resolveAlt({ file: 'IMG_1.jpg', index: 4 })).toBe('Photo 4');
  });

  it('never returns an empty string', () => {
    expect(resolveAlt({ file: '' }).length).toBeGreaterThan(0);
  });
});
