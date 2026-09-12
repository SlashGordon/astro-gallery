# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/SlashGordon/astro-gallery/compare/v1.0.4...v1.1.0) (2026-09-09)


### Features

* add EditorialGallery and SlideshowGallery components ([c97be4b](https://github.com/SlashGordon/astro-gallery/commit/c97be4ba451ada65530789047be4c965b8e8340b))
* add EditorialGallery and SlideshowGallery components ([6541c51](https://github.com/SlashGordon/astro-gallery/commit/6541c517eddeae3b449599cb1f2aedbe9be91a88))

## [Unreleased]

### Added

- **`<CarouselGallery />`** — a fanned stack of prints: the centre photo full
  size, neighbours peeking at the edges, scaled down, dimmed and tilted in
  perspective by their distance from the centre. Click a peeking print, drag,
  or use the arrows to bring it forward; the caption docks in its own strip
  below the stage and crossfades as the centre print changes, rather than
  riding on the photo the way `SlideshowGallery`'s glass card does. Every card
  is positioned from its *wrapped* distance to the centre rather than DOM
  order, so `loop` fans correctly at both ends. Arrow / `Home` / `End` keys,
  dot indicators, optional autoplay with reduced-motion opt-out, a polite live
  region, and `folderPath` / `images` / `alt` / `captions` / `titles` /
  `labels` following the same conventions as the other galleries.

- **`<ImageGallery />` — `variant="masonry"`** keeps each photo's own aspect
  ratio instead of cropping every cell to a uniform rectangle, packing the
  columns tight with CSS Grid row-spans (`grid-auto-flow: dense` to backfill
  gaps, no JS layout pass). The caption moves to a hover scrim riding on the
  image in this variant, since there's no uniform cell for a `<figcaption>`.
  The default grid also gained a one-pass scroll-triggered entrance (skipped
  under `prefers-reduced-motion`), a stronger hover/focus lift, and a zoom-in
  affordance icon — a clearer cue than `cursor: zoom-in` alone, and one that
  shows up on keyboard focus too.

- **`<SlideshowGallery />`** — one photo at a time on a track driven by a single
  `translate3d()` (never widths or margins), eased on a `cubic-bezier(0.16, 1, 0.3, 1)`
  expo-out curve. The caption is a glassmorphism card inset from the 24px stage
  that rises and fades in on hover or focus of the current slide, and stays open
  on touch. Pointer drag tracks 1:1 and settles on the same curve; arrow /
  `Home` / `End` keys, dot indicators, and optional autoplay with a pause
  control. Off-screen slides are `inert`, slide changes are announced through a
  polite live region, and everything is dropped under `prefers-reduced-motion`.
  Props include `aspectRatio`, `radius`, `fit` (`cover` / `contain`, the latter
  filling the letterbox with a blurred copy of the frame), `captionMode`,
  `autoplay` / `interval`, `loop`, `dots` and a locale-aware `labels`.

- **`<EditorialGallery />`** — the `JustifiedGallery` layout with a two-pane
  fullscreen reader: the photo on the left, a caption panel on the right holding
  the title, the caption and the EXIF facts (capture date, camera,
  reverse-geocoded place, source pixel size), over a blurred wash of the current
  photo. Filmstrip navigation, a collapsible panel, arrow/`Home`/`End` keys,
  touch swipe, a focus trap and focus restore, and a bottom-sheet layout below
  900px. New `titles` prop for per-file panel titles and a `labels` prop
  (locale-dictionary aware) for the viewer's own copy; retheme through the
  `--eglb-*` custom properties.

## [1.0.4] - 2026-08-31

### Fixed

- `MapGallery` markers rendered at full thumbnail size — covering the map and
  overlapping each other — whenever the host page styles bare `<img>` (Tailwind
  Typography's `.prose img`, resets with `width: auto` / `max-width: 100%`). The
  marker size came only from the `<img>` width/height attributes, which any such
  rule overrides. `.asg-map__marker` now pins its 44px box (plus `max-width`,
  `margin` and `border-radius`) with `!important`.

### Added

- `MapGallery` now clusters markers by proximity: photos closer than ~52px at the
  current zoom merge into a single pin with a count badge. Clicking a cluster
  zooms to its bounds, or — at max zoom / when the photos share a spot — opens
  the stack in the lightbox. Re-clustering runs on every zoom.

## [1.0.3] - 2026-08-31

### Fixed

- Gallery thumbnails showed a strip of the figure border / skeleton background
  with a rounded corner along the top (and sometimes the bottom) when the
  component was used inside a content wrapper that styles bare `<img>` — most
  commonly Tailwind Typography's `.prose`, which adds `margin: 2em 0`. The image
  CSS now forces `margin: 0`, `max-width: none` and `border-radius: 0` on gallery
  images so host styles can no longer push the image off its wrapper.

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

[Unreleased]: https://github.com/SlashGordon/astro-gallery/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/SlashGordon/astro-gallery/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/SlashGordon/astro-gallery/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/SlashGordon/astro-gallery/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/SlashGordon/astro-gallery/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/SlashGordon/astro-gallery/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/SlashGordon/astro-gallery/releases/tag/v0.1.0
