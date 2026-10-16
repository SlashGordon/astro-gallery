/**
 * Build-time resolution for the Expedition components: folder entries and
 * explicit image lists become responsive `astro:assets` images with EXIF facts,
 * layouts and frame numbers. Runs in component frontmatter only.
 *
 * The `import.meta.glob` itself stays in the `.astro` components (Vite must
 * see it as a literal in a module it transforms); it is passed in here as data.
 */
import { readFile } from 'node:fs/promises';
import type { ImageMetadata } from 'astro';
import { resolveAlt } from '../alt.js';
import { readPhotoMeta } from '../exif.js';
import { responsiveImage, type ImageFormat } from '../images.js';
import { basename, filename, resolveFolder, selectFolderEntries, toAbsolute } from '../paths.js';
import { assignLayouts, formatCoordinates } from './layout.js';
import type { ResolvedChapter, ResolvedTravelImage, TravelChapter, TravelImage } from './types.js';

export type ImageGlob = Record<string, { default: ImageMetadata }>;

export interface ResolveContext {
  glob: ImageGlob;
  baseDir: string;
  widths: number[];
  format: ImageFormat;
  locale: string;
}

/**
 * Candidate widths for expedition photos. Features and panoramas fill most of
 * a large screen, so the set reaches further than the integration default;
 * `responsiveImage` never upscales past the source.
 */
export function expeditionWidths(configured: number[]): number[] {
  return Array.from(new Set([...configured, 2400])).sort((a, b) => a - b);
}

type Pending = Omit<ResolvedTravelImage, 'layout' | 'frame'> & {
  layout?: ResolvedTravelImage['layout'];
};

async function toResolved(
  input: TravelImage,
  fallback: { id: string; location: string },
  ctx: ResolveContext,
): Promise<Pending> {
  const base = {
    id: input.id ?? fallback.id,
    alt: input.alt,
    title: input.title ?? '',
    location: input.location ?? fallback.location,
    date: input.date ?? '',
    coordinates: input.coordinates ?? '',
    caption: input.caption ?? '',
    layout: input.layout,
    focus: input.focus ?? '50% 50%',
    focusMobile: input.focusMobile ?? input.focus ?? '50% 50%',
    heading: input.heading ?? '',
  };

  if (typeof input.src === 'string') {
    const width = input.width ?? 0;
    const height = input.height ?? 0;
    return {
      ...base,
      src: input.src,
      srcset: '',
      width,
      height,
      aspectRatio: width && height ? width / height : 1.5,
    };
  }

  const r = await responsiveImage(input.src, { widths: ctx.widths, format: ctx.format });
  return {
    ...base,
    src: r.src,
    srcset: r.srcset,
    width: r.width,
    height: r.height,
    aspectRatio: r.aspectRatio,
  };
}

/** Folder mode: one `TravelImage` per file, with EXIF date, GPS and text. */
async function fromFolder(chapter: TravelChapter, ctx: ResolveContext): Promise<TravelImage[]> {
  const target = resolveFolder(ctx.baseDir, chapter.folderPath!);
  const entries = selectFolderEntries(ctx.glob, target);
  const cwd = process.cwd();
  const out: TravelImage[] = [];

  let i = 0;
  for (const [key, mod] of entries) {
    i += 1;
    const file = basename(key);
    const override = chapter.overrides?.[file] ?? {};

    let exif: Awaited<ReturnType<typeof readPhotoMeta>> | null = null;
    try {
      exif = await readPhotoMeta(await readFile(toAbsolute(key, cwd)));
    } catch {
      /* unreadable metadata: the photo still renders, just without EXIF facts */
    }

    const alt = resolveAlt({
      file,
      explicit: override.alt,
      description: exif?.description ?? null,
      album: chapter.title,
      index: i,
    });

    out.push({
      id: filename(file),
      src: mod.default,
      title: exif?.title ?? '',
      caption: exif?.description && exif.description !== alt ? exif.description : '',
      date: exif?.date
        ? exif.date.toLocaleDateString(ctx.locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '',
      coordinates:
        exif?.latitude != null && exif.longitude != null
          ? formatCoordinates(exif.latitude, exif.longitude)
          : '',
      ...override,
      alt,
    });
  }
  return out;
}

/**
 * Resolve chapters in order. Frame numbers run across all of them, so a photo
 * in chapter three can read `FRAME 009 / 012`.
 */
export async function resolveChapters(
  chapters: TravelChapter[],
  ctx: ResolveContext,
): Promise<{ chapters: ResolvedChapter[]; totalFrames: number }> {
  let frame = 0;
  const resolved: ResolvedChapter[] = [];

  for (const [n, chapter] of chapters.entries()) {
    const inputs = chapter.folderPath ? await fromFolder(chapter, ctx) : (chapter.images ?? []);
    const pending = await Promise.all(
      inputs.map((img, i) =>
        toResolved(img, { id: `${chapter.id}-${i + 1}`, location: chapter.location }, ctx),
      ),
    );
    const layouts = assignLayouts(pending);
    const images: ResolvedTravelImage[] = pending.map((p, i) => {
      frame += 1;
      return { ...p, layout: layouts[i]!, frame };
    });

    const { images: _images, folderPath: _folder, overrides: _overrides, ...rest } = chapter;
    resolved.push({ ...rest, images, number: chapter.number ?? n + 1 });
  }

  return { chapters: resolved, totalFrames: frame };
}

/** Resolve a single standalone photo (hero, interlude, closing). */
export async function resolveSingle(
  image: TravelImage,
  ctx: ResolveContext,
  id = 'single',
): Promise<ResolvedTravelImage> {
  const p = await toResolved(image, { id, location: '' }, ctx);
  return { ...p, layout: p.layout ?? 'panorama', frame: 0 };
}

/** True for an image that already went through `resolveChapters` / `resolveSingle`. */
export function isResolved(image: TravelImage | ResolvedTravelImage): image is ResolvedTravelImage {
  return 'frame' in image && 'srcset' in image && typeof image.src === 'string';
}

/** Resolve a standalone photo unless it already is. Explicit images need no glob. */
export async function ensureResolved(
  image: TravelImage | ResolvedTravelImage,
  opts: Omit<ResolveContext, 'glob' | 'baseDir'>,
  id?: string,
): Promise<ResolvedTravelImage> {
  if (isResolved(image)) return image;
  return resolveSingle(image, { ...opts, glob: {}, baseDir: '' }, id);
}
