/**
 * Minimal schema.org JSON-LD for image galleries. Build-time only; the output
 * string is meant to be dropped into `<script type="application/ld+json">`.
 */

export interface LdImage {
  /** URL of the full-size image (required). */
  contentUrl: string;
  /** URL of the thumbnail / preview. */
  thumbnailUrl?: string;
  /** Short name — typically the resolved alt text. */
  name?: string;
  /** Longer caption, if different from `name`. */
  caption?: string;
  width?: number;
  height?: number;
}

export interface GalleryLdOptions {
  /** Gallery name (e.g. the album title or page heading). */
  name?: string;
  /** Absolute site origin (`Astro.site`) used to resolve relative image URLs. */
  siteUrl?: string | URL;
}

function absolutize(url: string, site?: string | URL): string {
  if (!site) return url;
  try {
    return new URL(url, site).href;
  } catch {
    return url;
  }
}

/**
 * Build an `ImageGallery` node whose `associatedMedia` is a list of
 * `ImageObject`s. Returns a compact JSON string, or `""` when there is nothing
 * worth emitting.
 */
export function imageGalleryJsonLd(images: LdImage[], options: GalleryLdOptions = {}): string {
  const media = images
    .filter((img) => img.contentUrl)
    .map((img) => {
      const node: Record<string, unknown> = {
        '@type': 'ImageObject',
        contentUrl: absolutize(img.contentUrl, options.siteUrl),
      };
      if (img.thumbnailUrl) node.thumbnailUrl = absolutize(img.thumbnailUrl, options.siteUrl);
      if (img.name) node.name = img.name;
      if (img.caption && img.caption !== img.name) node.caption = img.caption;
      if (img.width) node.width = img.width;
      if (img.height) node.height = img.height;
      return node;
    });

  if (media.length === 0) return '';

  const doc: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    associatedMedia: media,
  };
  if (options.name) doc.name = options.name;

  // Escape `<` so the string is safe inside a <script> element.
  return JSON.stringify(doc).replace(/</g, '\\u003c');
}
