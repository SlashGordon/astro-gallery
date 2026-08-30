# Playground — see the gallery in your browser

A minimal Astro site that uses the package from the repo root
(`"astro-gallery": "file:.."`). This is the place to poke at the components.

## Run it

```bash
cd demo
npm install      # first time only
npm run dev
```

Then open **http://localhost:4321**.

You can also start it from the repo root without `cd`:

```bash
npm run demo         # dev server
npm run demo:build   # production build (good end-to-end check)
```

## What `npm run dev` does

1. `build:lib` — rebuilds the integration (`../dist`) so your latest source is used.
2. `generate-samples` — writes nine gradient JPEGs with synthetic EXIF
   (capture date + GPS around Rome) into `src/assets/images/demo/`, so
   `<ImageTimeline />` and `<MapGallery />` have data. Their shapes vary on
   purpose (landscape / portrait / square / panorama) so the difference between
   `<JustifiedGallery />` and `<ImageGallery />` is visible. Skipped if images
   are already there.
3. `astro dev`.

## Use your own photos

Drop `.jpg` files into [`src/assets/images/demo/`](./src/assets/images/demo/) —
sample generation then skips. They need EXIF `DateTimeOriginal` for the timeline
and GPS tags for the map (most photos straight from a phone have both).

## Notes

- Reverse-geocoded place names are cached in
  [`.cache/astro-gallery/geocode.json`](./.cache/astro-gallery/) (committed), so
  the build works offline.
- After changing library source, just re-run `npm run dev` — `build:lib` picks
  it up. Vite won't hot-reload `.astro` files inside a `file:` dependency.
- The dev server runs backgrounded (Astro 7). Stop it with `npx astro dev stop`.
