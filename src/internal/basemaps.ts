/**
 * Named basemap presets for `<MapGallery />`. Selecting one fills in the tile
 * URL, attribution, subdomains and max zoom so callers don't have to. An
 * explicit `tileUrl` always overrides a preset.
 */

export type BasemapId =
  'osm' | 'carto-dark' | 'carto-light' | 'carto-voyager' | 'stadia-dark' | 'esri-satellite';

export interface Basemap {
  tileUrl: string;
  tileAttribution: string;
  subdomains: string;
  maxZoom: number;
  /** Whether the tiles read light or dark — drives the map's control chrome. */
  scheme: 'light' | 'dark';
  /** The provider requires an API key (pass `tileApiKey`). */
  needsKey: boolean;
  /** Query-parameter name the provider expects for the key. */
  apiKeyParam: string;
}

const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTO_ATTR = `${OSM_ATTR} &copy; <a href="https://carto.com/">CARTO</a>`;

export const BASEMAPS: Record<BasemapId, Basemap> = {
  osm: {
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileAttribution: OSM_ATTR,
    subdomains: 'abc',
    maxZoom: 19,
    scheme: 'light',
    needsKey: false,
    apiKeyParam: 'api_key',
  },
  'carto-dark': {
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    tileAttribution: CARTO_ATTR,
    subdomains: 'abcd',
    maxZoom: 20,
    scheme: 'dark',
    needsKey: true,
    apiKeyParam: 'api_key',
  },
  'carto-light': {
    tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    tileAttribution: CARTO_ATTR,
    subdomains: 'abcd',
    maxZoom: 20,
    scheme: 'light',
    needsKey: true,
    apiKeyParam: 'api_key',
  },
  'carto-voyager': {
    tileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    tileAttribution: CARTO_ATTR,
    subdomains: 'abcd',
    maxZoom: 20,
    scheme: 'light',
    needsKey: true,
    apiKeyParam: 'api_key',
  },
  'stadia-dark': {
    tileUrl: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    tileAttribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> ' +
      OSM_ATTR,
    subdomains: '',
    maxZoom: 20,
    scheme: 'dark',
    needsKey: true,
    apiKeyParam: 'api_key',
  },
  'esri-satellite': {
    tileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    tileAttribution:
      'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    subdomains: '',
    maxZoom: 19,
    scheme: 'dark',
    needsKey: false,
    apiKeyParam: 'token',
  },
};

export const BASEMAP_IDS = Object.keys(BASEMAPS) as BasemapId[];

/** Look up a preset. Unknown ids fall back to `osm`. */
export function getBasemap(id: BasemapId | undefined): Basemap | null {
  if (!id) return null;
  return BASEMAPS[id] ?? BASEMAPS.osm;
}
