/**
 * Alt-text resolution for folder-driven galleries. The goal is descriptive,
 * SEO-friendly `alt` values instead of raw file names like `IMG_4821.JPG`.
 *
 * Resolution order (first non-empty wins):
 *   1. an explicit value the author passed for this file
 *   2. an embedded caption/description from the image metadata (IPTC / XMP / EXIF)
 *   3. a humanised version of the file name
 *   4. `"<album> — photo N"` or `"Photo N"` as a last resort
 */

import { filename } from './paths.js';

/** Camera-generated name prefixes that carry no meaning. */
const CAMERA_PREFIX =
  /^(img|dsc|dscn|dscf|scn|pxl|gopro|p|dji|mvimg|photo|image|screenshot|capture)[-_ ]?\d+.*$/i;

/** Junk that some cameras dump into `ImageDescription`. */
const JUNK_DESCRIPTION =
  /^(olympus digital camera|sony dsc|casio|nikon|canon|samsung|default|ricoh|kodak digital camera|<|\s)*$/i;

/**
 * Turn a file name into a readable phrase:
 * `rome-colosseum_at-sunset.jpg` → `"Rome colosseum at sunset"`.
 * Returns `""` when nothing meaningful is left (e.g. `IMG_4821.JPG`).
 */
export function humanizeFilename(nameOrPath: string): string {
  const raw = filename(nameOrPath);
  if (!raw || CAMERA_PREFIX.test(raw)) return '';

  const base = raw
    .replace(/^\d{1,4}[\s._-]+/, '') // leading sequence number: "01-", "003_"
    .replace(/[\s._-]+\(?\d{1,3}\)?$/, ''); // trailing copy marker: " (2)", "-1"

  const words = base
    .replace(/[+]/g, ' ')
    .replace(/[-_.]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → words
    .replace(/\s+/g, ' ')
    .trim();

  if (!words || /^\d+$/.test(words)) return '';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Trim and reject empty / known-junk descriptions. */
export function cleanDescription(value: string | null | undefined): string {
  const v = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!v || JUNK_DESCRIPTION.test(v)) return '';
  return v;
}

export interface AltInput {
  /** File name or glob key of the image. */
  file: string;
  /** Author-provided alt for this file, if any. */
  explicit?: string | null;
  /** Embedded description/caption from metadata, if any. */
  description?: string | null;
  /** Album / gallery name, used only for the last-resort label. */
  album?: string | null;
  /** 1-based position in the gallery, used only for the last-resort label. */
  index?: number;
}

/** Resolve the best available alt text for one image. Never returns `""`. */
export function resolveAlt({ file, explicit, description, album, index }: AltInput): string {
  const fromExplicit = (explicit ?? '').trim();
  if (fromExplicit) return fromExplicit;

  const fromDescription = cleanDescription(description);
  if (fromDescription) return fromDescription;

  const fromName = humanizeFilename(file);
  if (fromName) return fromName;

  const n = index != null ? ` ${index}` : '';
  return album ? `${album} — photo${n}`.trim() : `Photo${n}`.trim();
}
