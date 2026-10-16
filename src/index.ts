export { default, default as gallery } from './integration.js';
export {
  DEFAULT_CONFIG,
  resolveOptions,
  type GalleryUserOptions,
  type GalleryConfig,
  type MapOptions,
  type ResolvedMapConfig,
  type GeocodeOptions,
  type BasemapId,
  type LocalizedText,
  type MaybeLocalized,
} from './options.js';
export { pickText } from './internal/i18n.js';
export { BASEMAPS, BASEMAP_IDS, type Basemap } from './internal/basemaps.js';
export type {
  TravelImage,
  TravelChapter,
  TravelLayout,
  HeroData,
  InterludeData,
  ClosingData,
  NavLink,
} from './internal/expedition/types.js';
export type { ExpeditionLabelOptions } from './internal/expedition/labels.js';
