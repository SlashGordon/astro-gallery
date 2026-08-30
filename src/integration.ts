import type { AstroIntegration } from 'astro';
import { resolveOptions, type GalleryConfig, type GalleryUserOptions } from './options.js';

const VIRTUAL_ID = 'virtual:astro-gallery/config';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

/**
 * Astro integration for `astro-gallery`.
 *
 * It exposes the resolved configuration to the bundled components through the
 * `virtual:astro-gallery/config` module and makes sure the package is processed
 * by Vite (so `import.meta.glob` and `astro:assets` work from inside it).
 *
 * @example
 * ```js
 * import { defineConfig } from 'astro/config';
 * import gallery from 'astro-gallery';
 *
 * export default defineConfig({
 *   integrations: [gallery({ locale: 'de-DE' })],
 * });
 * ```
 */
export default function gallery(userOptions: GalleryUserOptions = {}): AstroIntegration {
  const config: GalleryConfig = resolveOptions(userOptions);

  return {
    name: 'astro-gallery',
    hooks: {
      'astro:config:setup': ({ updateConfig, logger }) => {
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'astro-gallery:virtual-config',
                enforce: 'pre',
                resolveId(id) {
                  if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
                  return null;
                },
                load(id) {
                  if (id === RESOLVED_VIRTUAL_ID) {
                    return `export default ${JSON.stringify(config)};`;
                  }
                  return null;
                },
              },
            ],
            // Keep the package in Vite's transform pipeline instead of treating
            // it as an opaque external dependency.
            ssr: { noExternal: ['astro-gallery'] },
            optimizeDeps: { exclude: ['astro-gallery'] },
          },
        });

        logger.info(
          `ready — locale "${config.locale}", images from "src/${config.imagesDir}/"` +
            (config.geocode.enabled ? '' : ', geocoding disabled'),
        );
      },
    },
  };
}
