// Dev-only shim so `tsc --noEmit` can parse `.ts` files that re-export `.astro`
// modules. The Astro language tooling resolves these for real; plain `tsc` does
// not. Not published (lives outside the `files` whitelist in package.json).

declare module '*.astro' {
  const component: (props: Record<string, unknown>) => unknown;
  export default component;
}
