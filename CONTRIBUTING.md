# Contributing

Thanks for taking the time to help out!

## Getting started

Node 20+ is required for the tooling (Vitest 4). The `demo/` playground uses
Astro 7 and needs Node 22.12+.

```bash
git clone https://github.com/SlashGordon/astro-gallery
cd astro-gallery
pnpm install
pnpm --dir demo install   # once, for the playground
```

`pnpm install` points git at the hooks in `.githooks/`. The pre-commit hook runs
Prettier on the staged files, the pre-push hook runs `pnpm run format:check`.
Skip them once with `--no-verify`.

## Handy scripts

| Command                 | What it does                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run demo`         | Start the playground in `demo/` (Astro dev server).                                                                                         |
| `pnpm run demo:build`   | Production build of the playground — the best end-to-end check.                                                                             |
| `pnpm test`             | Run the unit tests (Vitest).                                                                                                                |
| `pnpm run typecheck`    | `tsc --noEmit` over the package sources.                                                                                                    |
| `pnpm run build`        | Build the integration entry to `dist/` (tsup).                                                                                              |
| `pnpm run format`       | Prettier write. `pnpm run format:check` in CI.                                                                                              |
| `pnpm run check:viewer` | Headless-browser geometry probe for the `EditorialGallery` viewer. Needs the demo running and `pnpm exec playwright install chromium` once. |
| `pnpm run screenshots`  | Rebuild the README screenshots from the demo. Needs `pnpm exec playwright install chromium` and ImageMagick.                                |

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
anything that needs those three inside `.astro` frontmatter and keep pure logic
in `src/internal/` where it can be unit-tested.

## Before opening a PR

1. `pnpm run format:check && pnpm run typecheck && pnpm test`
2. `pnpm run demo:build` — makes sure the components still compile in a real Astro
   build.
3. Add a bullet under `## [Unreleased]` in `CHANGELOG.md`.

## Commit style

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, …) are appreciated but
not enforced.
