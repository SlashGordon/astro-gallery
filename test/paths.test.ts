import { describe, expect, it } from 'vitest';
import {
  basename,
  filename,
  normalizeFolder,
  resolveFolder,
  selectFolderEntries,
  toAbsolute,
} from '../src/internal/paths.js';

describe('normalizeFolder', () => {
  it('strips surrounding slashes and collapses repeats', () => {
    expect(normalizeFolder('/foo//bar/')).toBe('foo/bar');
    expect(normalizeFolder('  trips/rome  ')).toBe('trips/rome');
  });
});

describe('basename / filename', () => {
  it('returns the last segment', () => {
    expect(basename('a/b/c.jpg')).toBe('c.jpg');
    expect(filename('a/b/c.jpg')).toBe('c');
  });
});

describe('resolveFolder', () => {
  const base = 'assets/images';

  it('prefixes a bare folder with the base dir', () => {
    expect(resolveFolder(base, 'trips/rome')).toBe('assets/images/trips/rome');
  });

  it('keeps an already-qualified path unchanged', () => {
    expect(resolveFolder(base, 'assets/images/trips/rome')).toBe('assets/images/trips/rome');
    expect(resolveFolder(base, '/assets/images/trips/rome/')).toBe('assets/images/trips/rome');
  });

  it('tolerates a legacy leading images/ segment', () => {
    expect(resolveFolder(base, 'images/trips/rome')).toBe('assets/images/trips/rome');
  });

  it('supports a custom base dir', () => {
    expect(resolveFolder('media', 'gallery')).toBe('media/gallery');
  });
});

describe('selectFolderEntries', () => {
  const glob = {
    '/src/assets/images/rome/2.jpg': 2,
    '/src/assets/images/rome/10.jpg': 10,
    '/src/assets/images/rome/1.jpg': 1,
    '/src/assets/images/rome/sub/a.jpg': 99,
    '/src/assets/images/paris/x.jpg': 0,
  };

  it('returns only the folder subtree, naturally sorted', () => {
    const picked = selectFolderEntries(glob, 'assets/images/rome');
    expect(picked.map(([k]) => k)).toEqual([
      '/src/assets/images/rome/1.jpg',
      '/src/assets/images/rome/2.jpg',
      '/src/assets/images/rome/10.jpg',
      '/src/assets/images/rome/sub/a.jpg',
    ]);
  });
});

describe('toAbsolute', () => {
  it('joins a glob key onto the project root', () => {
    expect(toAbsolute('/src/assets/images/x.jpg', '/proj')).toBe('/proj/src/assets/images/x.jpg');
    expect(toAbsolute('/src/x.jpg', '/proj/')).toBe('/proj/src/x.jpg');
  });
});
