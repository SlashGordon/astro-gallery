/**
 * Build-time reverse geocoding against a Nominatim-compatible endpoint.
 *
 * Runs only during static generation — nothing here reaches the browser. Every
 * resolved coordinate is written to a JSON cache (default
 * `.cache/astro-gallery/geocode.json`). Commit that file and the network is only
 * touched for genuinely new coordinates, keeping CI builds offline-friendly.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { GeocodeOptions } from '../options.js';

export interface GeoResult {
  city: string | null;
  country: string | null;
  /** Pre-joined label like `"Rome, Italy"` — empty string when unknown. */
  label: string;
}

const EMPTY: GeoResult = { city: null, country: null, label: '' };

export interface Geocoder {
  reverseGeocode(lat: number, lng: number): Promise<GeoResult>;
  flush(): void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Round to a ~11 km grid so nearby photos share one lookup. */
function cacheKey(lat: number, lng: number): string {
  return `${Math.round(lat * 10) / 10},${Math.round(lng * 10) / 10}`;
}

function loadCache(path: string): Record<string, GeoResult> {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, GeoResult>;
  } catch {
    return {};
  }
}

const registeredFlushers = new Set<string>();

/**
 * Create a geocoder bound to one cache file. Requests are serialised and spaced
 * by `minRequestIntervalMs` to respect public rate limits.
 */
export function createGeocoder(options: Required<GeocodeOptions>): Geocoder {
  const cachePath = resolve(options.cachePath);
  const cache = loadCache(cachePath);
  let dirty = false;
  let queue: Promise<unknown> = Promise.resolve();

  function flush(): void {
    if (!dirty) return;
    try {
      mkdirSync(dirname(cachePath), { recursive: true });
      const sorted = Object.fromEntries(
        Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)),
      );
      writeFileSync(cachePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
      dirty = false;
    } catch {
      /* best effort */
    }
  }

  // Persist once per cache file even if the caller forgets to flush.
  if (!registeredFlushers.has(cachePath)) {
    registeredFlushers.add(cachePath);
    process.on('beforeExit', flush);
  }

  async function lookup(lat: number, lng: number): Promise<GeoResult> {
    const key = cacheKey(lat, lng);
    if (key in cache) return cache[key]!;
    if (!options.enabled) return EMPTY;

    const url =
      `${options.endpoint}?lat=${lat}&lon=${lng}` +
      `&format=json&zoom=10&accept-language=${encodeURIComponent(options.language)}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      await sleep(options.minRequestIntervalMs);
      try {
        const res = await fetch(url, { headers: { 'User-Agent': options.userAgent } });
        if (res.status === 429) {
          await sleep(5000);
          continue;
        }
        if (!res.ok) return EMPTY;

        const data = (await res.json()) as { address?: Record<string, string> };
        const a = data.address ?? {};
        const city = a.city || a.town || a.village || a.municipality || a.county || a.state || null;
        const country = a.country || null;
        const label = city && country ? `${city}, ${country}` : city || country || '';

        const result: GeoResult = { city, country, label };
        cache[key] = result;
        dirty = true;
        return result;
      } catch {
        if (attempt < 2) await sleep(3000);
      }
    }
    return EMPTY;
  }

  return {
    reverseGeocode(lat, lng) {
      const run = queue.then(() => lookup(lat, lng));
      // Keep the chain alive even if one lookup rejects (it never should).
      queue = run.catch(() => undefined);
      return run;
    },
    flush,
  };
}
