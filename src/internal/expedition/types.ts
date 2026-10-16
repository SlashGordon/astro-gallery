/**
 * Data model for the Expedition components. Pure types: safe to import from
 * page frontmatter, content collections or plain `.ts` data files.
 */
import type { ImageMetadata } from 'astro';

/**
 * How a photograph sits in its chapter. It decides the photo's weight and crop
 * inside the composition, not a card style:
 *
 * - `feature` — the dominant photo of a spread, natural ratio.
 * - `landscape` — a supporting horizontal frame, cropped to 3:2.
 * - `portrait` — a narrow vertical frame, cropped to 4:5.
 * - `panorama` — full width, cropped to 21:9 (or its own ratio if wider).
 * - `compact` — a small documentary frame, natural ratio; runs form clusters.
 */
export type TravelLayout = 'feature' | 'portrait' | 'landscape' | 'panorama' | 'compact';

export interface TravelImage {
  /** Stable id. Defaults to the file name (folder mode) or the position. */
  id?: string;
  /** An `import`ed image (optimised through `astro:assets`), a `/public` path or a URL. */
  src: string | ImageMetadata;
  /** Describes the photo. Pass `""` only for a purely decorative image. */
  alt: string;
  title?: string;
  /** Destination label, e.g. `"Cornwall"`. Falls back to the chapter's `location`. */
  location?: string;
  /** Free-form date label, e.g. `"August 2018"`. Folder mode fills it from EXIF. */
  date?: string;
  /** Coordinates label, e.g. `"50.198° N 5.485° W"`. Folder mode fills it from GPS. */
  coordinates?: string;
  caption?: string;
  /** Composition role. Picked from the aspect ratio and the chapter rhythm when omitted. */
  layout?: TravelLayout;
  /** CSS `object-position` focal point for crops, e.g. `"50% 30%"`. */
  focus?: string;
  /** Focal point used below 640px, when the subject sits elsewhere in a tall crop. */
  focusMobile?: string;
  /** An editorial heading that interrupts a `feature` or `panorama` photo. */
  heading?: string;
  /** Intrinsic size of a string `src`. Imported images carry their own. */
  width?: number;
  height?: number;
}

export interface TravelChapter {
  /** Used as the section anchor (`#<id>`). */
  id: string;
  title: string;
  location: string;
  introduction?: string;
  /** e.g. `"5–7 August 2018"`. */
  dates?: string;
  /** Stops along the way, drawn as a dotted route. */
  route?: string[];
  coordinates?: string;
  /** `"grid"` (default) composes the photos; `"sequence"` scrolls them sideways. */
  composition?: 'grid' | 'sequence';
  /** Explicit photos. Use this or `folderPath`. */
  images?: TravelImage[];
  /** Folder relative to `src/<imagesDir>/`; every image inside, sorted by name. */
  folderPath?: string;
  /** Per-file overrides for folder mode, keyed by file name. */
  overrides?: Record<string, Partial<TravelImage>>;
  /** Start the composition on the right instead of the left. */
  mirror?: boolean;
  /**
   * Chapter number shown in the header. Defaults to the position in the list;
   * set it when a chapter appears on its own page but keeps its place in a series.
   */
  number?: number;
}

export interface HeroData {
  /** Display headline. Each array entry (or `\n`-separated part) is its own line. */
  headline: string | string[];
  introduction?: string;
  image: TravelImage;
  /** Small utility label above the headline, e.g. `"ISSUE 03 — 2018–2024"`. */
  kicker?: string;
}

export interface InterludeData {
  /** Statement lines, as for `HeroData.headline`. */
  statement: string | string[];
  image: TravelImage;
  /** Small destination label. Defaults to the image's location. */
  label?: string;
  /** Render this interlude after the chapter with this id. */
  after?: string;
}

export interface NavLink {
  label: string;
  href: string;
  /** Optional utility label, e.g. a date or a frame count. */
  meta?: string;
}

export interface ClosingData {
  statement: string | string[];
  image?: TravelImage;
  /** Where to go next: related destinations or stories. */
  links?: NavLink[];
  /** A small line at the very end, e.g. a copyright. */
  colophon?: string;
}

/** A `TravelImage` after build-time resolution. */
export interface ResolvedTravelImage {
  id: string;
  alt: string;
  title: string;
  location: string;
  date: string;
  coordinates: string;
  caption: string;
  layout: TravelLayout;
  focus: string;
  focusMobile: string;
  heading: string;
  src: string;
  srcset: string;
  width: number;
  height: number;
  aspectRatio: number;
  /** 1-based frame number across the whole expedition. */
  frame: number;
}

export interface ResolvedChapter extends Omit<
  TravelChapter,
  'images' | 'folderPath' | 'overrides'
> {
  images: ResolvedTravelImage[];
  /** 1-based chapter number. */
  number: number;
}
