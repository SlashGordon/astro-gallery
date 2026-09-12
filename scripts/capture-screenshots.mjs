/**
 * Captures the README screenshots from the built demo site.
 *
 * Runs against `astro preview` rather than the dev server, so the Astro dev
 * toolbar never lands in a shot. Everything is grabbed at 2x for sharp text and
 * then downscaled and encoded as progressive JPEG — the raw 2x PNGs run to
 * several megabytes each, which has no business in a git repo.
 *
 * Starts `astro preview` itself if nothing is already serving, so the usual
 * invocation is just:
 *
 *   npm run screenshots
 *
 * Pass a URL to shoot an already-running server instead.
 */
import { chromium } from 'playwright';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:4331/';
const OUT = 'docs/screenshots';
const RAW = '/tmp/asg-shots-raw';
/** Logical width the published images are downscaled to. */
const WIDTH = 1400;

rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });
mkdirSync(OUT, { recursive: true });

/** Spawn `astro preview` unless something already answers on the target URL. */
async function ensureServer() {
  const reachable = await fetch(URL)
    .then((r) => r.ok)
    .catch(() => false);
  if (reachable) return null;

  console.log('starting astro preview…');
  const child = spawn('npx', ['astro', 'preview', '--port', new URL(URL).port || '4331'], {
    cwd: 'demo',
    stdio: 'ignore',
    detached: false,
  });
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (
      await fetch(URL)
        .then((r) => r.ok)
        .catch(() => false)
    )
      return child;
  }
  child.kill();
  throw new Error(`preview server never came up at ${URL}`);
}

const server = await ensureServer();
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1400, height: 950 },
  deviceScaleFactor: 2,
});

await page.goto(URL, { waitUntil: 'networkidle' });

/*
 * Gallery images are lazy and start at `opacity: 0` until the component's script
 * adds `.is-loaded`. Anything still below the fold would otherwise photograph as
 * an empty skeleton box, so walk the whole page first and wait for every image
 * to actually decode.
 */
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 220));
  }
  window.scrollTo(0, 0);
});
// Every skeleton must have resolved. Off-screen carousel slides are excluded on
// purpose — they stay lazy until you navigate to them, which is the point.
await page.waitForFunction(
  () => {
    const figs = [...document.querySelectorAll('.asg-jgallery__figure')];
    return figs.length > 0 && figs.every((f) => f.classList.contains('is-loaded'));
  },
  null,
  { timeout: 30000 },
);
await page.waitForTimeout(1200);

const named = [];
async function shot(
  name,
  target,
  { settle = 600, full = false, trim = false, maxHeight = 0 } = {},
) {
  const el = typeof target === 'string' ? page.locator(target).first() : target;
  if (!full) {
    await el.scrollIntoViewIfNeeded();
    // Only the visible images inside this element — an unpainted <img> would
    // photograph as an empty skeleton.
    await el
      .evaluate((node) =>
        Promise.all(
          [...node.querySelectorAll('img')]
            .filter((i) => i.getBoundingClientRect().width > 0 && i.loading !== 'lazy')
            .map((i) => (i.complete ? null : i.decode().catch(() => null))),
        ),
      )
      .catch(() => {});
  }
  await page.waitForTimeout(settle);
  const path = join(RAW, `${name}.png`);
  if (full) await page.screenshot({ path });
  else await el.screenshot({ path });
  named.push({ name, trim, maxHeight });
  console.log(`  captured ${name}`);
}

console.log('capturing:');

await shot('justified-gallery', '.asg-jgallery:not(.asg-egallery)');
await shot('image-gallery', '.asg-gallery--grid');
// The masonry columns run on for all thirteen photos — a README image only
// needs enough of it to show the packing, not the full scroll.
await shot('image-gallery-masonry', '.asg-gallery--masonry', { maxHeight: 1700 });

// Editorial: the grid is the justified layout, so only the reader is worth a shot.
await page.locator('.asg-egallery .asg-eg-item').first().click();
await page.waitForSelector('.asg-eglb', { state: 'visible' });
await shot('editorial-viewer', null, { settle: 1600, full: true });
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// Slideshow with the glass caption raised.
const slides = page.locator('.asg-slides').first();
await slides.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await slides.locator('.asg-slides__slide.is-current').hover();
await shot('slideshow-gallery', slides, { settle: 900 });

// Carousel: the fanned stack with a neighbour peeking on each side.
const carousel = page.locator('.asg-carousel').first();
await carousel.scrollIntoViewIfNeeded();
await shot('carousel-gallery', carousel, { settle: 900 });

// The timeline reserves rail height for its tallest day, so trim the slack.
await shot('image-timeline', page.locator('.asg-timeline--horizontal').first(), { trim: true });
await shot('image-timeline-vertical', page.locator('.asg-timeline--vertical').first(), {
  trim: true,
});

// The shared lightbox, opened from the grid gallery.
await page.locator('.asg-gallery .asg-lb-item').first().click();
await page.waitForSelector('.asg-lb', { state: 'visible' });
await shot('lightbox', null, { settle: 1000, full: true });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// Map: the consent gate, then the map itself once tiles have loaded.
const map = page.locator('.asg-map').first();
await map.scrollIntoViewIfNeeded();
await shot('map-consent', map, { settle: 500 });
await map.locator('.asg-map__consent-btn').click();
await shot('map-gallery', map, { settle: 5000 });

await browser.close();
server?.kill();

// --- downscale + encode ----------------------------------------------------
console.log('\nencoding:');
for (const { name, trim, maxHeight } of named) {
  execFileSync('magick', [
    join(RAW, `${name}.png`),
    // The timeline reserves rail height for its tallest day; drop the slack.
    ...(trim ? ['-fuzz', '1%', '-trim', '+repage'] : []),
    '-resize',
    `${WIDTH}x>`,
    // Applied post-resize, so `maxHeight` is a final pixel height, not a
    // pre-downscale one — crop from the top, not a fit-to-box resize.
    ...(maxHeight ? ['-gravity', 'North', '-crop', `${WIDTH}x${maxHeight}+0+0`, '+repage'] : []),
    '-strip',
    '-interlace',
    'Plane',
    '-quality',
    '86',
    join(OUT, `${name}.jpg`),
  ]);
}

let total = 0;
for (const f of readdirSync(OUT).sort()) {
  const kb = statSync(join(OUT, f)).size / 1024;
  total += kb;
  console.log(`  ${f.padEnd(30)} ${kb.toFixed(0).padStart(5)} kB`);
}
console.log(`  ${'TOTAL'.padEnd(30)} ${total.toFixed(0).padStart(5)} kB`);
