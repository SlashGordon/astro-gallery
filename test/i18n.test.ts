import { describe, expect, it } from 'vitest';
import { pickText } from '../src/internal/i18n.js';

describe('pickText', () => {
  it('returns a plain string unchanged', () => {
    expect(pickText('Load map', 'de-DE')).toBe('Load map');
  });

  it('falls back for undefined', () => {
    expect(pickText(undefined, 'en')).toBe('');
    expect(pickText(undefined, 'en', 'x')).toBe('x');
  });

  const dict = { 'en-US': 'Map view', de: 'Kartenansicht', fr: 'Carte' };

  it('matches an exact locale code', () => {
    expect(pickText(dict, 'en-US')).toBe('Map view');
  });

  it('matches on the language when the exact code is absent', () => {
    expect(pickText(dict, 'de-DE')).toBe('Kartenansicht');
    expect(pickText(dict, 'de')).toBe('Kartenansicht');
  });

  it('is case- and separator-insensitive', () => {
    expect(pickText(dict, 'EN_us')).toBe('Map view');
  });

  it('uses a default / * catch-all before the first entry', () => {
    expect(pickText({ de: 'Hallo', default: 'Hi' }, 'es')).toBe('Hi');
    expect(pickText({ de: 'Hallo', '*': 'Hi' }, 'es')).toBe('Hi');
  });

  it('falls back to the first entry when nothing matches', () => {
    expect(pickText(dict, 'es')).toBe('Map view');
  });

  it('keeps an explicit empty string', () => {
    expect(pickText('', 'en')).toBe('');
  });
});
