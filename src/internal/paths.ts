/** Path helpers shared by the folder-driven components. Build-time only. */

/** Strip leading/trailing slashes and collapse repeats. */
export function normalizeFolder(folderPath: string): string {
  return folderPath
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/');
}

/** Last path segment, e.g. `a/b/c.jpg` -> `c.jpg`. */
export function basename(p: string): string {
  const segs = normalizeFolder(p).split('/');
  return segs[segs.length - 1] || p;
}

/** Filename without its extension, e.g. `c.jpg` -> `c`. */
export function filename(p: string): string {
  return basename(p).replace(/\.[^.]+$/, '');
}

/**
 * Resolve a user-supplied `folderPath` to a path relative to `src/`.
 *
 * - `baseDir` is the integration's `imagesDir` (default `assets/images`).
 * - An already-qualified path (starts with `baseDir/` or `assets/`) is kept as is.
 * - A leading `images/` segment is tolerated for convenience.
 *
 * @example resolveFolder('assets/images', 'trips/rome') === 'assets/images/trips/rome'
 * @example resolveFolder('assets/images', 'assets/images/trips/rome') === 'assets/images/trips/rome'
 */
export function resolveFolder(baseDir: string, folderPath: string): string {
  const base = normalizeFolder(baseDir);
  let folder = normalizeFolder(folderPath);

  if (base && (folder === base || folder.startsWith(base + '/'))) return folder;
  if (folder === 'assets' || folder.startsWith('assets/')) return folder;

  folder = folder.replace(/^images\//, '');
  return base ? `${base}/${folder}` : folder;
}

/** Convert an `import.meta.glob` key (`/src/...`) to an absolute filesystem path. */
export function toAbsolute(globKey: string, cwd: string): string {
  const rel = globKey.replace(/^\/+/, '');
  return cwd.replace(/\/+$/, '') + '/' + rel;
}

/**
 * Pick and stably sort the `import.meta.glob` entries that live directly under
 * (or below) `src/<folder>/`.
 */
export function selectFolderEntries<T>(
  globbed: Record<string, T>,
  folderRelativeToSrc: string,
): Array<[string, T]> {
  const prefix = `/src/${normalizeFolder(folderRelativeToSrc)}/`;
  return Object.entries(globbed)
    .filter(([key]) => key.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }));
}
