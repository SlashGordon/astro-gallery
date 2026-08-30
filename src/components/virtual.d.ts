/**
 * Types for the module the `astro-gallery` integration injects at build time.
 *
 * Consumers only need this when importing the components from `.ts`/`.tsx`:
 *
 * ```ts
 * /// <reference types="astro-gallery/components/virtual.d.ts" />
 * ```
 */
declare module 'virtual:astro-gallery/config' {
  const config: import('../options.js').GalleryConfig;
  export default config;
}
