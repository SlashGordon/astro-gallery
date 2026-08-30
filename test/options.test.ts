import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, resolveOptions } from '../src/options.js';

describe('resolveOptions', () => {
  it('returns the defaults when called with nothing', () => {
    expect(resolveOptions()).toEqual(DEFAULT_CONFIG);
  });

  it('normalises imagesDir', () => {
    expect(resolveOptions({ imagesDir: '/media/photos/' }).imagesDir).toBe('media/photos');
  });

  it('deep-merges map and geocode without dropping defaults', () => {
    const cfg = resolveOptions({
      locale: 'de-DE',
      map: { consent: false },
      geocode: { language: 'de' },
    });

    expect(cfg.locale).toBe('de-DE');
    expect(cfg.map.consent).toBe(false);
    expect(cfg.map.tileUrl).toBe(DEFAULT_CONFIG.map.tileUrl);
    expect(cfg.geocode.language).toBe('de');
    expect(cfg.geocode.endpoint).toBe(DEFAULT_CONFIG.geocode.endpoint);
  });
});
