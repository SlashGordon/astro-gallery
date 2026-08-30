import exifr from 'exifr';
import { cleanDescription } from './alt.js';

export interface PhotoMeta {
  /** Capture date from `DateTimeOriginal` (falls back to `CreateDate`). */
  date: Date | null;
  latitude: number | null;
  longitude: number | null;
  /** Human-readable camera name, e.g. `"Apple iPhone 14 Pro"`. */
  camera: string | null;
  /** Embedded caption/description (IPTC `Caption`, XMP `dc:description`, EXIF `ImageDescription`). */
  description: string | null;
  /** Embedded title (IPTC `ObjectName`, XMP `dc:title`, `headline`). */
  title: string | null;
}

const EMPTY: PhotoMeta = {
  date: null,
  latitude: null,
  longitude: null,
  camera: null,
  description: null,
  title: null,
};

function combineCamera(make: string, model: string): string | null {
  if (!model) return null;
  return model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`.trim();
}

function firstString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string') {
      const cleaned = cleanDescription(v);
      if (cleaned) return cleaned;
    }
  }
  return null;
}

/**
 * Extract the subset of EXIF / IPTC / XMP the components care about. Never
 * throws — images without metadata (or unreadable bytes) resolve to {@link EMPTY}.
 */
export async function readPhotoMeta(bytes: Uint8Array): Promise<PhotoMeta> {
  let tags: Record<string, unknown> | undefined;
  try {
    tags = await exifr.parse(bytes, {
      tiff: true,
      gps: true,
      iptc: true,
      xmp: true,
      mergeOutput: true,
      reviveValues: true,
    });
  } catch {
    return EMPTY;
  }
  if (!tags) return EMPTY;

  const date =
    tags.DateTimeOriginal instanceof Date
      ? tags.DateTimeOriginal
      : tags.CreateDate instanceof Date
        ? tags.CreateDate
        : null;

  const camera = combineCamera(String(tags.Make ?? '').trim(), String(tags.Model ?? '').trim());

  let latitude = typeof tags.latitude === 'number' ? tags.latitude : null;
  let longitude = typeof tags.longitude === 'number' ? tags.longitude : null;
  if (latitude == null || longitude == null) {
    try {
      const gps = await exifr.gps(bytes);
      if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
        latitude = gps.latitude;
        longitude = gps.longitude;
      }
    } catch {
      /* no GPS block */
    }
  }

  const description = firstString(
    tags.ImageDescription,
    tags.description,
    tags.Caption,
    tags.CaptionAbstract,
    tags['Caption-Abstract'],
    tags.caption,
    tags.UserComment,
  );

  const title = firstString(
    tags.title,
    tags.ObjectName,
    tags.headline,
    tags.Headline,
    tags.XPTitle,
  );

  return { date, latitude, longitude, camera, description, title };
}
