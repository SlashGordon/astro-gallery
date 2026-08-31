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
2. `generate-samples` — a fallback that writes gradient JPEGs with synthetic EXIF
   into `src/assets/images/holidays/` only when that folder is empty. The demo
   ships with real holiday photos there, so this is normally a no-op.
3. `astro dev`.

## Use your own photos

Replace the `.jpg` files in
[`src/assets/images/holidays/`](./src/assets/images/holidays/). They need EXIF
`DateTimeOriginal` for the timeline and GPS tags for the map (most photos
straight from a phone have both); files without EXIF still show in the two grid
layouts.

## Notes

- Reverse-geocoded place names are cached in
  [`.cache/astro-gallery/geocode.json`](./.cache/astro-gallery/) (committed), so
  the build works offline.
- After changing library source, just re-run `npm run dev` — `build:lib` picks
  it up. Vite won't hot-reload `.astro` files inside a `file:` dependency.
- The dev server runs backgrounded (Astro 7). Stop it with `npx astro dev stop`.
