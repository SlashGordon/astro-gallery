import { describe, expect, it } from 'vitest';
import { imageGalleryJsonLd } from '../src/internal/structured-data.js';

describe('imageGalleryJsonLd', () => {
  it('builds an ImageGallery node with ImageObject media', () => {
    const json = imageGalleryJsonLd(
      [
        {
          contentUrl: '/_astro/a.webp',
          thumbnailUrl: '/_astro/a-thumb.webp',
          name: 'A',
          width: 1600,
          height: 1067,
        },
        { contentUrl: '/_astro/b.webp', name: 'B', caption: 'A longer caption for B' },
      ],
      { name: 'Trip', siteUrl: 'https://example.com' },
    );
    const doc = JSON.parse(json);

    expect(doc['@type']).toBe('ImageGallery');
    expect(doc.name).toBe('Trip');
    expect(doc.associatedMedia).toHaveLength(2);
    expect(doc.associatedMedia[0]).toMatchObject({
      '@type': 'ImageObject',
      contentUrl: 'https://example.com/_astro/a.webp',
      thumbnailUrl: 'https://example.com/_astro/a-thumb.webp',
      name: 'A',
      width: 1600,
      height: 1067,
    });
    expect(doc.associatedMedia[1].caption).toBe('A longer caption for B');
  });

  it('omits caption when it equals the name, and drops entries without a contentUrl', () => {
    const doc = JSON.parse(
      imageGalleryJsonLd([
        { contentUrl: '/x.webp', name: 'X', caption: 'X' },
        { contentUrl: '', name: 'ghost' },
      ]),
    );
    expect(doc.associatedMedia).toHaveLength(1);
    expect(doc.associatedMedia[0].caption).toBeUndefined();
  });

  it('leaves URLs relative when no site is given and returns "" for no images', () => {
    const doc = JSON.parse(imageGalleryJsonLd([{ contentUrl: '/rel.webp' }]));
    expect(doc.associatedMedia[0].contentUrl).toBe('/rel.webp');
    expect(imageGalleryJsonLd([])).toBe('');
  });

  it('escapes < to stay safe inside a <script> element', () => {
    const json = imageGalleryJsonLd([{ contentUrl: '/x.webp', name: '<script>' }]);
    expect(json).not.toContain('<script>');
    expect(json).toContain('\\u003cscript>');
  });
});
