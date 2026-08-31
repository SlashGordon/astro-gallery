/**
 * Public option types for the `astro-gallery` integration plus the internal
 * resolver that fills in defaults. The resolved {@link GalleryConfig} is what the
 * components read at build time through `virtual:astro-gallery/config`.
 */

import { BASEMAPS, type BasemapId } from './internal/basemaps.js';
import type { MaybeLocalized } from './internal/i18n.js';

export type { BasemapId } from './internal/basemaps.js';
export type { LocalizedText, MaybeLocalized } from './internal/i18n.js';

export interface MapOptions {
  /**
   * Named basemap preset — fills in `tileUrl`, `tileAttribution`, `subdomains`,
   * `maxZoom` and `scheme`. One of: `"osm"` (default, keyless), `"carto-dark"`,
   * `"carto-light"`, `"carto-voyager"`, `"stadia-dark"` (all need `tileApiKey`),
   * `"esri-satellite"` (keyless). An explicit `tileUrl` overrides the preset.
   */
  basemap?: BasemapId;
  /**
   * Control-chrome colour scheme: `"auto"` (default — follows the page theme),
   * or force `"light"` / `"dark"` (a preset sets this to match its tiles).
   */
  scheme?: 'auto' | 'light' | 'dark';
  /**
   * Leaflet XYZ tile template. Overrides `basemap`. Defaults to the keyless
   * OpenStreetMap standard style.
   */
  tileUrl?: string;
  /** Attribution HTML shown in the map corner. */
  tileAttribution?: string;
  /** Subdomain letters for the `{s}` tile placeholder. */
  subdomains?: string;
  /** Highest zoom level the tile source supports. */
  maxZoom?: number;
  /**
   * API key appended to every tile request as a query parameter. Required by
   * CARTO, Stadia, Thunderforest, MapTiler, … Tile keys are sent from the
   * browser, so use a domain-restricted key.
   */
  tileApiKey?: string;
  /** Query-parameter name for `tileApiKey`. Default `"api_key"` (CARTO/Stadia). */
  tileApiKeyParam?: string;
  /** Show a consent gate before any external tile request is made. Default `true`. */
  consent?: boolean;
  /** `localStorage` key used to remember the visitor's consent choice. */
  consentKey?: string;
  /** Heading rendered on the consent gate. String, or a per-locale dictionary. */
  consentTitle?: MaybeLocalized;
  /** Body copy for the consent gate. HTML is allowed. String, or a per-locale dictionary. */
  consentText?: MaybeLocalized;
  /** Label of the "load the map" button. String, or a per-locale dictionary. */
  consentButtonLabel?: MaybeLocalized;
}

export interface GeocodeOptions {
  /** Turn build-time reverse geocoding on/off. Default `true`. */
  enabled?: boolean;
  /** Nominatim-compatible reverse endpoint. */
  endpoint?: string;
  /** `User-Agent` sent with each request (Nominatim requires a real one). */
  userAgent?: string;
  /** `accept-language` for the returned place names. */
  language?: string;
  /** JSON cache file, resolved from the project root. Commit it to skip lookups on CI. */
  cachePath?: string;
  /** Minimum spacing between requests in ms (Nominatim asks for >= 1000). */
  minRequestIntervalMs?: number;
}

export interface GalleryUserOptions {
  /**
   * Folder that folder-driven components resolve `folderPath` against, relative
   * to `src/`. With the default, `folderPath="trips/rome"` reads from
   * `src/assets/images/trips/rome/`.
   */
  imagesDir?: string;
  /** Locale used for every date label. Default `"en-US"`. */
  locale?: string;
  /** Thumbnail width in px handed to `astro:assets`. Default `800`. */
  thumbWidth?: number;
  /** Full-size width in px handed to `astro:assets`. Default `1600`. */
  fullWidth?: number;
  /** Output format for generated images. Default `"webp"`. */
  imageFormat?: 'webp' | 'avif' | 'jpeg' | 'png';
  /**
   * Label used for photos that carry no EXIF date. Default `"Undated"`.
   * String, or a per-locale dictionary resolved against the component's `locale`.
   */
  undatedLabel?: MaybeLocalized;
  /**
   * Candidate widths (px) used to build `srcset`. Widths larger than a given
   * source image are dropped. Default `[400, 640, 960, 1280, 1920]`.
   */
  responsiveWidths?: number[];
  /**
   * Emit `ImageGallery` / `ImageObject` JSON-LD structured data. Default `true`.
   */
  structuredData?: boolean;
  map?: MapOptions;
  geocode?: GeocodeOptions;
}

export interface ResolvedMapConfig {
  basemap: BasemapId;
  scheme: 'auto' | 'light' | 'dark';
  tileUrl: string;
  tileAttribution: string;
  subdomains: string;
  maxZoom: number;
  tileApiKey: string;
  tileApiKeyParam: string;
  consent: boolean;
  consentKey: string;
  consentTitle: MaybeLocalized;
  consentText: MaybeLocalized;
  consentButtonLabel: MaybeLocalized;
}

export interface GalleryConfig {
  imagesDir: string;
  locale: string;
  thumbWidth: number;
  fullWidth: number;
  imageFormat: 'webp' | 'avif' | 'jpeg' | 'png';
  undatedLabel: MaybeLocalized;
  responsiveWidths: number[];
  structuredData: boolean;
  map: ResolvedMapConfig;
  geocode: Required<GeocodeOptions>;
}

const DEFAULT_CONSENT_TEXT =
  'Loading the map requests map tiles from an external provider. Your IP address ' +
  'is transmitted to that provider in the process.';

export const DEFAULT_CONFIG: GalleryConfig = {
  imagesDir: 'assets/images',
  locale: 'en-US',
  thumbWidth: 800,
  fullWidth: 1600,
  imageFormat: 'webp',
  undatedLabel: 'Undated',
  responsiveWidths: [400, 640, 960, 1280, 1920],
  structuredData: true,
  map: {
    // Keyless out of the box (OSM standard). Pick another with `map.basemap`;
    // the CARTO / Stadia presets also need `map.tileApiKey`.
    basemap: 'osm',
    scheme: 'auto',
    tileUrl: BASEMAPS.osm.tileUrl,
    tileAttribution: BASEMAPS.osm.tileAttribution,
    subdomains: BASEMAPS.osm.subdomains,
    maxZoom: BASEMAPS.osm.maxZoom,
    tileApiKey: '',
    tileApiKeyParam: 'api_key',
    consent: true,
    consentKey: 'astro-gallery:map-consent',
    consentTitle: 'Map view',
    consentText: DEFAULT_CONSENT_TEXT,
    consentButtonLabel: 'Load map',
  },
  geocode: {
    enabled: true,
    endpoint: 'https://nominatim.openstreetmap.org/reverse',
    userAgent: 'astro-gallery (https://github.com/SlashGordon/astro-gallery)',
    language: 'en',
    cachePath: '.cache/astro-gallery/geocode.json',
    minRequestIntervalMs: 1200,
  },
};

/** Merge user options over {@link DEFAULT_CONFIG} into a fully-resolved config. */
export function resolveOptions(user: GalleryUserOptions = {}): GalleryConfig {
  return {
    imagesDir: (user.imagesDir ?? DEFAULT_CONFIG.imagesDir).replace(/^\/+|\/+$/g, ''),
    locale: user.locale ?? DEFAULT_CONFIG.locale,
    thumbWidth: user.thumbWidth ?? DEFAULT_CONFIG.thumbWidth,
    fullWidth: user.fullWidth ?? DEFAULT_CONFIG.fullWidth,
    imageFormat: user.imageFormat ?? DEFAULT_CONFIG.imageFormat,
    undatedLabel: user.undatedLabel ?? DEFAULT_CONFIG.undatedLabel,
    responsiveWidths:
      user.responsiveWidths && user.responsiveWidths.length > 0
        ? [...user.responsiveWidths].sort((a, b) => a - b)
        : DEFAULT_CONFIG.responsiveWidths,
    structuredData: user.structuredData ?? DEFAULT_CONFIG.structuredData,
    map: resolveMap(user.map ?? {}),
    geocode: { ...DEFAULT_CONFIG.geocode, ...user.geocode },
  };
}

/** Resolve `map` options, applying the chosen `basemap` preset under any explicit fields. */
export function resolveMap(m: MapOptions): ResolvedMapConfig {
  const preset = BASEMAPS[m.basemap ?? 'osm'] ?? BASEMAPS.osm;
  const d = DEFAULT_CONFIG.map;
  return {
    basemap: m.basemap ?? 'osm',
    scheme: m.scheme ?? (m.basemap ? preset.scheme : 'auto'),
    tileUrl: m.tileUrl ?? preset.tileUrl,
    tileAttribution: m.tileAttribution ?? preset.tileAttribution,
    subdomains: m.subdomains ?? preset.subdomains,
    maxZoom: m.maxZoom ?? preset.maxZoom,
    tileApiKey: m.tileApiKey ?? '',
    tileApiKeyParam: m.tileApiKeyParam ?? preset.apiKeyParam,
    consent: m.consent ?? d.consent,
    consentKey: m.consentKey ?? d.consentKey,
    consentTitle: m.consentTitle ?? d.consentTitle,
    consentText: m.consentText ?? d.consentText,
    consentButtonLabel: m.consentButtonLabel ?? d.consentButtonLabel,
  };
}
