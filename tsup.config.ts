import { defineConfig } from 'tsup';

// Only the integration entry point is bundled to `dist/`.
// The Astro components ship as raw source (see `exports` in package.json) so the
// consumer's Astro/Vite pipeline compiles them with full access to
// `astro:assets`, `import.meta.glob` and the `virtual:astro-gallery/config` module.
//
// Declarations are emitted separately by `tsc -p tsconfig.build.json` (see the
// `build` script) — tsup's `dts` bundler cannot run under TypeScript 7.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  dts: false,
  clean: true,
  sourcemap: true,
  external: ['astro', /^astro:/, /^virtual:/],
});
