/** Helpers for building the Leaflet tile URL. */

/**
 * Append `?<param>=<key>` (or `&…`) to a tile URL template unless the key is
 * empty or that parameter is already present. The `{z}/{x}/{y}` placeholders are
 * left untouched — Leaflet substitutes them before fetching.
 *
 * @example
 * withApiKey('https://a.tiles.example/{z}/{x}/{y}.png', 'abc123')
 * // → 'https://a.tiles.example/{z}/{x}/{y}.png?api_key=abc123'
 */
export function withApiKey(url: string, key: string | undefined, param = 'api_key'): string {
  const trimmed = (key ?? '').trim();
  if (!trimmed) return url;
  if (new RegExp(`[?&]${param}=`).test(url)) return url;
  return url + (url.includes('?') ? '&' : '?') + `${param}=${encodeURIComponent(trimmed)}`;
}
