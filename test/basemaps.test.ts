import { describe, expect, it } from 'vitest';
import { BASEMAPS, BASEMAP_IDS, getBasemap } from '../src/internal/basemaps.js';
import { resolveMap, resolveOptions } from '../src/options.js';

describe('BASEMAPS', () => {
  it('every preset has a usable XYZ template and attribution', () => {
    for (const id of BASEMAP_IDS) {
      const b = BASEMAPS[id];
      expect(b.tileUrl).toMatch(/\{z\}.*\{x\}.*\{y\}|\{z\}.*\{y\}.*\{x\}/);
      expect(b.tileAttribution.length).toBeGreaterThan(0);
      expect(['light', 'dark']).toContain(b.scheme);
    }
  });

  it('getBasemap falls back to osm for unknown ids and null for undefined', () => {
    expect(getBasemap(undefined)).toBeNull();
    // @ts-expect-error — exercising the runtime fallback
    expect(getBasemap('nope')).toBe(BASEMAPS.osm);
  });
});

describe('resolveMap', () => {
  it('defaults to the keyless osm preset', () => {
    const m = resolveMap({});
    expect(m.basemap).toBe('osm');
    expect(m.scheme).toBe('auto');
    expect(m.tileUrl).toBe(BASEMAPS.osm.tileUrl);
  });

  it('applies a preset and adopts its scheme + api-key param', () => {
    const m = resolveMap({ basemap: 'carto-dark' });
    expect(m.tileUrl).toBe(BASEMAPS['carto-dark'].tileUrl);
    expect(m.tileAttribution).toBe(BASEMAPS['carto-dark'].tileAttribution);
    expect(m.subdomains).toBe('abcd');
    expect(m.scheme).toBe('dark');
    expect(m.tileApiKeyParam).toBe('api_key');
  });

  it('lets an explicit tileUrl / scheme win over the preset', () => {
    const m = resolveMap({
      basemap: 'carto-dark',
      tileUrl: 'https://x/{z}/{x}/{y}.png',
      scheme: 'light',
    });
    expect(m.tileUrl).toBe('https://x/{z}/{x}/{y}.png');
    expect(m.scheme).toBe('light');
  });

  it('is reachable through resolveOptions', () => {
    expect(resolveOptions({ map: { basemap: 'esri-satellite' } }).map.tileUrl).toBe(
      BASEMAPS['esri-satellite'].tileUrl,
    );
  });
});
