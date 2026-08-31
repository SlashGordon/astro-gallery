# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2026-08-31

### Fixed

- `MapGallery` crashed in `astro dev` with `The requested module '.../leaflet-src.js'
  does not provide an export named 'default'`. The consent button did nothing
  because the whole client script failed to load. The integration now adds
  `leaflet` to `vite.optimizeDeps.include` so it is pre-bundled with proper
  CJS interop.

## [1.0.1] - 2026-08-31

### Added

- **Multi-language text.** Every user-facing string option
  (`undatedLabel`, `map.consentTitle` / `consentText` / `consentButtonLabel`, and
  the `scrollHint` / `undatedLabel` component props) now also accepts a
  `LocalizedText` dictionary keyed by locale/language code, resolved against the
  component's active `locale` (exact code → language → same-language entry →
  `default` / `*` → first entry). New `pickText` helper and `LocalizedText` /
  `MaybeLocalized` types are exported from the package root.
- `<ImageTimeline />` `undatedLabel` prop — per-instance override of the
  integration's dateless-group label.

## [1.0.0] - 2026-08-31

### Added

- **`<JustifiedGallery />`** — aspect-ratio-aware justified rows that fill the
  container width, with responsive `srcset`/`sizes`, `content-visibility`,
  blur-up skeletons, `fetchpriority` on the first images and `ImageGallery`
  JSON-LD.
- Integration options `responsiveWidths` (srcset candidate widths) and
  `structuredData` (emit JSON-LD, default `true`).
- `alt`, `captions` and `album` props on the folder-driven components for
  per-file alt/caption overrides and a gallery name.
- EXIF/IPTC/XMP caption extraction (`ImageDescription`, `Caption`,
  `dc:description`, …) used as `alt` when present.
- Shared responsive-image and JSON-LD helpers (`src/internal/images.ts`,
  `src/internal/structured-data.ts`, `src/internal/alt.ts`).
- `map.tileApiKey` / `map.tileApiKeyParam` options (and matching `MapGallery`
  props) — appended to every tile request as `?<param>=<key>` for providers that
  now require a key (CARTO, Stadia, MapTiler, Thunderforest, …).
- `<ImageTimeline />` `orientation` prop — `"horizontal"` (default, scrolling
  rail) or `"vertical"` (days stacked down a left-hand spine).
- `<MapGallery />` `basemap` presets — `osm` (default, keyless), `carto-dark`,
  `carto-light`, `carto-voyager`, `stadia-dark`, `esri-satellite` — each fills in
  the tile URL / attribution / zoom. New `scheme` option (`auto` / `light` /
  `dark`) forces the control chrome to match the tiles regardless of page theme.

### Changed

- **Default map tiles are now the keyless OpenStreetMap standard style.** CARTO's
  basemaps started requiring an API key, which broke the old zero-config default.
  To keep using CARTO's dark basemap, set `map.tileUrl` back to it and pass
  `map.tileApiKey` (see the README).
- **SEO pass on all components.** `alt` is now resolved (explicit → embedded
  caption → humanised file name → `"<album> — photo N"`) instead of the raw file
  name. Galleries render `<ul role="list">` / `<figure>`; the timeline is a
  `<section>` with an `<ol>` and `<time datetime>` day headings. Every `<img>`
  gets intrinsic `width`/`height`; `ImageGallery` gained `srcset`/`sizes` and an
  eager, high-priority first image.
- `MapGallery` renders an SSR `<ul>` of linked thumbnails (crawlable / no-JS)
  inside the map container, removed by the client script once the map loads;
  marker and popup images now carry real `alt`.

## [0.1.0] - 2026-08-30

### Added

- Initial release.
- `astro-gallery` integration exposing a resolved config to the components via
  `virtual:astro-gallery/config`.
- `<ImageGallery />` — responsive grid + dependency-free lightbox with keyboard
  navigation; folder mode and explicit `images` mode.
- `<ImageTimeline />` — EXIF-capture-date grouping laid out on a horizontal
  timeline, with optional per-day reverse-geocoded location labels.
- `<MapGallery />` — Leaflet photo map built from GPS EXIF, with a consent gate
  that blocks all external tile requests until the visitor opts in.
- Build-time reverse geocoding (Nominatim) with a committable JSON cache.
- CSS-custom-property theming, automatic light/dark support.

[Unreleased]: https://github.com/SlashGordon/astro-gallery/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/SlashGordon/astro-gallery/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/SlashGordon/astro-gallery/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/SlashGordon/astro-gallery/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/SlashGordon/astro-gallery/releases/tag/v0.1.0
