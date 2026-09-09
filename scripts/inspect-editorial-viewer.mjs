/**
 * Geometry probe for the <EditorialGallery /> fullscreen viewer.
 *
 * Opens the demo, steps through every photo and records the box of each moving
 * part. Anything that should be nailed down (the arrows, the panel, the left
 * edge of the copy) must not vary by even a pixel between photos.
 *
 * Usage: node scripts/inspect-editorial-viewer.mjs [url] [--shots]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:4321/';
const SHOTS = process.argv.includes('--shots');
const OUT = '/tmp/eglb-shots';
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1180, height: 760 },
  { name: 'mobile', width: 420, height: 860 },
];

const box = async (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.hidden) return null;
    const r = el.getBoundingClientRect();
    return {
      x: +r.x.toFixed(1),
      y: +r.y.toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
    };
  }, sel);

const PARTS = {
  prev: '.asg-eglb__nav--prev',
  next: '.asg-eglb__nav--next',
  panel: '.asg-eglb__panel',
  title: '.asg-eglb__title',
  caption: '.asg-eglb__caption',
  meta: '.asg-eglb__meta',
  image: '.asg-eglb__img',
  strip: '.asg-eglb__strip',
  close: '.asg-eglb__close',
};

const browser = await chromium.launch();
let failures = 0;

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(URL, { waitUntil: 'networkidle' });

  const count = await page.locator('.asg-egallery .asg-eg-item').count();
  await page.locator('.asg-egallery .asg-eg-item').first().click();
  await page.waitForSelector('.asg-eglb', { state: 'visible' });
  await page.waitForTimeout(700);

  console.log(
    `\n${'='.repeat(78)}\n${vp.name}  ${vp.width}x${vp.height}  —  ${count} photos\n${'='.repeat(78)}`,
  );

  const rows = [];
  for (let i = 0; i < count; i++) {
    const shot = {};
    for (const [k, sel] of Object.entries(PARTS)) shot[k] = await box(page, sel);
    shot.overflow = await page.evaluate(() => ({
      docScrollW: document.documentElement.scrollWidth,
      docClientW: document.documentElement.clientWidth,
      panelScrollH: document.querySelector('.asg-eglb__panel-body')?.scrollHeight ?? 0,
      panelClientH: document.querySelector('.asg-eglb__panel-body')?.clientHeight ?? 0,
    }));
    rows.push(shot);
    if (SHOTS && [0, 1, 6, 7].includes(i)) {
      mkdirSync(OUT, { recursive: true });
      await page.screenshot({ path: `${OUT}/${vp.name}-${String(i + 1).padStart(2, '0')}.png` });
    }
    if (i < count - 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(650);
    }
  }

  const img = rows.map((r) => (r.image ? `${r.image.w}x${r.image.h}` : '—'));
  console.log('image sizes :', img.join('  '));

  // Anything in this list must be pixel-identical for every photo.
  for (const [part, axes] of Object.entries({
    prev: ['x', 'y', 'w', 'h'],
    next: ['x', 'y', 'w', 'h'],
    close: ['x', 'y'],
    panel: ['x', 'y', 'w', 'h'],
    strip: ['x', 'y', 'h'],
    title: ['x', 'w'],
    caption: ['x', 'w'],
    meta: ['x', 'w'],
  })) {
    for (const axis of axes) {
      const vals = rows.map((r) => r[part]?.[axis]).filter((v) => v != null);
      if (!vals.length) continue;
      const min = Math.min(...vals),
        max = Math.max(...vals);
      const drift = +(max - min).toFixed(1);
      const bad = drift > 0.5;
      if (bad) failures++;
      console.log(
        `${bad ? 'DRIFT ' : '  ok  '} ${part}.${axis.padEnd(2)} range ${String(min).padStart(7)} … ${String(max).padEnd(7)} drift ${drift}`,
      );
    }
  }

  // Vertical position of the copy: allowed to move only if the title wraps.
  for (const part of ['title', 'caption', 'meta']) {
    const vals = rows.map((r) => r[part]?.y).filter((v) => v != null);
    if (!vals.length) continue;
    const drift = +(Math.max(...vals) - Math.min(...vals)).toFixed(1);
    console.log(`  ~   ${part}.y  drift ${drift}${drift > 0.5 ? '  <-- moves vertically' : ''}`);
  }

  const hOverflow = rows.filter((r) => r.overflow.docScrollW > r.overflow.docClientW).length;
  if (hOverflow) {
    failures++;
    console.log(`DRIFT  horizontal page overflow on ${hOverflow} photo(s)`);
  }

  await page.close();
}

await browser.close();
console.log(
  `\n${failures === 0 ? 'PASS — nothing drifts.' : `FAIL — ${failures} unstable measurement(s).`}`,
);
process.exit(failures === 0 ? 0 : 1);
