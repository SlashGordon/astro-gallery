/**
 * Responsive-image helpers built on `astro:assets`. Produce a `srcset` across a
 * set of candidate widths (never upscaling past the source) plus a sensible
 * fallback `src` and the intrinsic dimensions needed to avoid layout shift.
 *
 * All `getImage` traffic goes through here so the one place that touches the
 * `astro:assets` transform type is centralised (see `optimize` below).
 */

import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

/**
 * `getImage` wrapper.
 *
 * The `src` is cast to the first parameter type of the resolved `getImage`. This
 * is a no-op at runtime; it only absorbs a phantom type mismatch that appears
 * when a project has two copies of `astro` on disk (e.g. a nested `node_modules`
 * during local development) whose `ImageMetadata.format` unions differ.
 */
function optimize(meta: ImageMetadata, width: number, format: ImageFormat) {
  return getImage({
    src: meta as Parameters<typeof getImage>[0]['src'],
    width,
    format,
  });
}

export interface ResponsiveImage {
  /** Fallback `src` (the largest generated width). */
  src: string;
  /** `srcset` string: `"url 400w, url 640w, …"`. */
  srcset: string;
  /** Largest generated width. */
  width: number;
  /** Height matching `width` at the source aspect ratio. */
  height: number;
  /** Source aspect ratio (`width / height`). */
  aspectRatio: number;
}

/** Build a responsive image from imported metadata. */
export async function responsiveImage(
  meta: ImageMetadata,
  opts: { widths: number[]; format: ImageFormat },
): Promise<ResponsiveImage> {
  const aspectRatio = meta.width / meta.height;

  const widths = Array.from(new Set(opts.widths))
    .filter((w) => w > 0 && w <= meta.width)
    .sort((a, b) => a - b);
  if (widths.length === 0) widths.push(meta.width);

  const generated = await Promise.all(widths.map((w) => optimize(meta, w, opts.format)));

  const srcset = generated.map((g, i) => `${g.src} ${widths[i]}w`).join(', ');
  const largestWidth = widths[widths.length - 1]!;

  return {
    src: generated[generated.length - 1]!.src,
    srcset,
    width: largestWidth,
    height: Math.round(largestWidth / aspectRatio),
    aspectRatio,
  };
}

/** A single optimised image at a fixed width (never upscaled past the source). */
export async function fixedImage(
  meta: ImageMetadata,
  opts: { width: number; format: ImageFormat },
): Promise<{ src: string; width: number; height: number }> {
  const width = Math.min(opts.width, meta.width);
  const img = await optimize(meta, width, opts.format);
  return {
    src: img.src,
    width,
    height: Math.round(width / (meta.width / meta.height)),
  };
}
