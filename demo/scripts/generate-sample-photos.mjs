/**
 * Generates a handful of synthetic JPEGs (gradient fills) with real EXIF —
 * capture date + GPS — so the demo has something for `<ImageTimeline />` and
 * `<MapGallery />` to work with.
 *
 * - Skips generation if the folder already contains images, so you can drop your
 *   own photos into `demo/src/assets/images/demo/` instead.
 * - Runs automatically before `npm run dev` / `npm run build` in the demo.
 *
 * EXIF is written by sharp's native `withExif()`, so the output is always a valid
 * JPEG (no third-party byte surgery).
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'src', 'assets', 'images', 'demo');

mkdirSync(OUT_DIR, { recursive: true });

const existing = existsSync(OUT_DIR)
  ? readdirSync(OUT_DIR).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
  : [];
if (existing.length > 0) {
  console.log(`[samples] ${existing.length} image(s) already in ${OUT_DIR} — skipping.`);
  process.exit(0);
}

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.warn(
    '[samples] `sharp` is not installed — skipping sample generation.\n' +
      `          Run \`npm install\` in demo/, or add your own photos to ${OUT_DIR}`,
  );
  process.exit(0);
}

// A short walking tour of Rome — day is the capture day in June 2024.
// `w`/`h` deliberately vary (landscape, portrait, square, panorama) so the
// difference between <ImageGallery /> (uniform grid, cropped) and
// <JustifiedGallery /> (rows justified by aspect ratio) is visible.
const STOPS = [
  { name: 'colosseum', lat: 41.8902, lng: 12.4922, day: 1, hue: 20, w: 1600, h: 900 },
  { name: 'roman-forum', lat: 41.8925, lng: 12.4853, day: 1, hue: 45, w: 1200, h: 800 },
  { name: 'pantheon', lat: 41.8986, lng: 12.4769, day: 2, hue: 190, w: 900, h: 1200 },
  { name: 'trevi-fountain', lat: 41.9009, lng: 12.4833, day: 2, hue: 210, w: 1080, h: 1080 },
  { name: 'piazza-navona', lat: 41.8992, lng: 12.4731, day: 3, hue: 280, w: 1800, h: 600 },
  { name: 'st-peters', lat: 41.9022, lng: 12.4539, day: 3, hue: 320, w: 800, h: 1200 },
  { name: 'castel-santangelo', lat: 41.903, lng: 12.4663, day: 4, hue: 110, w: 1500, h: 1000 },
  { name: 'trastevere', lat: 41.8896, lng: 12.4695, day: 4, hue: 140, w: 1200, h: 900 },
  { name: 'gianicolo-sunset', lat: 41.8917, lng: 12.4618, day: 5, hue: 15, w: 2000, h: 800 },
];

const pad = (n) => String(n).padStart(2, '0');

/** Decimal degrees -> `"d/1 m/1 s*1000/1000"` rational string for sharp/EXIF. */
function toRational(dec) {
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = Math.round(((abs - deg) * 60 - min) * 60 * 1000);
  return `${deg}/1 ${min}/1 ${sec}/1000`;
}

let n = 0;
for (const stop of STOPS) {
  const hour = 8 + (n % 9);
  const minute = (n * 7) % 60;
  const date = `2024:06:${pad(stop.day)} ${pad(hour)}:${pad(minute)}:00`;

  const { w, h } = stop;
  const fs = Math.round(Math.min(w, h) / 11);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${stop.hue} 70% 55%)"/>
      <stop offset="1" stop-color="hsl(${(stop.hue + 40) % 360} 65% 30%)"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="48%" font-family="sans-serif" font-size="${fs}" font-weight="700"
      fill="rgba(255,255,255,0.9)" text-anchor="middle">${stop.name.replace(/-/g, ' ')}</text>
    <text x="50%" y="48%" dy="${fs}" font-family="sans-serif" font-size="${Math.round(fs * 0.6)}"
      fill="rgba(255,255,255,0.65)" text-anchor="middle">${w} × ${h}</text>
  </svg>`;

  const bytes = await sharp(Buffer.from(svg))
    .jpeg({ quality: 82 })
    .withExif({
      IFD0: { Make: 'astro-gallery', Model: 'SampleCam One' },
      IFD2: { DateTimeOriginal: date, LensModel: '24mm f/1.8' },
      IFD3: {
        GPSLatitudeRef: stop.lat >= 0 ? 'N' : 'S',
        GPSLatitude: toRational(stop.lat),
        GPSLongitudeRef: stop.lng >= 0 ? 'E' : 'W',
        GPSLongitude: toRational(stop.lng),
      },
    })
    .toBuffer();

  writeFileSync(join(OUT_DIR, `${pad(n + 1)}-${stop.name}.jpg`), bytes);
  n++;
}

console.log(`[samples] wrote ${n} sample photo(s) to ${OUT_DIR}`);
