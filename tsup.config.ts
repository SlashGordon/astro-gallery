import { defineConfig } from 'tsup';

// Only the integration entry point is bundled to `dist/`.
// The Astro components ship as raw source (see `exports` in package.json) so the
// consumer's Astro/Vite pipeline compiles them with full access to
// `astro:assets`, `import.meta.glob` and the `virtual:astro-gallery/config` module.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['astro', /^astro:/, /^virtual:/],
});
