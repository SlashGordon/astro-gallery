/**
 * Tiny locale-dictionary helper. Any user-facing string option may be given as a
 * plain `string` or as a {@link LocalizedText} map keyed by BCP-47 code; the
 * components resolve it against their active `locale` at render time.
 */

/** Text keyed by locale/language code. `default` / `*` act as a catch-all. */
export type LocalizedText = Record<string, string>;

/** A text option: one string, or a per-locale dictionary. */
export type MaybeLocalized = string | LocalizedText;

const langOf = (code: string): string => code.toLowerCase().split(/[-_]/)[0];

/**
 * Resolve `value` for `locale`.
 *
 * - a plain string is returned unchanged
 * - a dictionary is matched exact code → language code → same-language entry →
 *   `default` / `*` → first entry
 * - `undefined` yields `fallback` (or `''`)
 */
export function pickText(value: MaybeLocalized | undefined, locale: string, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;

  const want = locale.toLowerCase();
  const wantLang = langOf(locale);

  const exact = Object.keys(value).find((k) => k.toLowerCase() === want);
  if (exact) return value[exact];

  const byLang = Object.keys(value).find((k) => langOf(k) === wantLang);
  if (byLang) return value[byLang];

  if (typeof value.default === 'string') return value.default;
  if (typeof value['*'] === 'string') return value['*'];

  const first = Object.values(value)[0];
  return typeof first === 'string' ? first : fallback;
}
