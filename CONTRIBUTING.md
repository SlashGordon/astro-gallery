# Contributing

Thanks for taking the time to help out!

## Getting started

Node 20+ is required for the tooling (Vitest 4). The `demo/` playground uses
Astro 7 and needs Node 22.12+.

```bash
git clone https://github.com/SlashGordon/astro-gallery
cd astro-gallery
npm install
npm --prefix demo install   # once, for the playground
```

## Handy scripts

| Command              | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| `npm run demo`       | Start the playground in `demo/` (Astro dev server).             |
| `npm run demo:build` | Production build of the playground — the best end-to-end check. |
| `npm test`           | Run the unit tests (Vitest).                                    |
| `npm run typecheck`  | `tsc --noEmit` over the package sources.                        |
| `npm run build`      | Build the integration entry to `dist/` (tsup).                  |
| `npm run format`     | Prettier write. `npm run format:check` in CI.                   |

## Project layout

```
src/
  index.ts             # public entry: the integration + option types
  integration.ts       # the Astro integration (virtual module + Vite wiring)
  options.ts           # option types + resolveOptions()
  components/*.astro    # shipped as raw source, compiled in the consumer
  internal/            # build-time helpers (paths, exif, geocode, timeline)
                       # + the browser-side lightbox
  styles/gallery.css   # all component CSS, namespaced .asg-*
demo/                  # a runnable Astro site using the package via `file:..`
test/                  # Vitest unit tests for the pure helpers
```

The `.astro` components are **not** bundled — they ship as source so the
consumer's Astro/Vite pipeline compiles them with `astro:assets`,
`import.meta.glob` and the `virtual:astro-gallery/config` module available. Keep
anything that needs those three inside `.astro` frontmatter, and keep pure logic
in `src/internal/` where it can be unit-tested.

## Before opening a PR

1. `npm run format:check && npm run typecheck && npm test`
2. `npm run demo:build` — makes sure the components still compile in a real Astro
   build.
3. Add a bullet under `## [Unreleased]` in `CHANGELOG.md`.

## Commit style

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, …) are appreciated but
not enforced.
