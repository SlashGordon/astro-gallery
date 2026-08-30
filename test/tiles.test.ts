import { describe, expect, it } from 'vitest';
import { withApiKey } from '../src/internal/tiles.js';

const T = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

describe('withApiKey', () => {
  it('appends the key as ?api_key= by default', () => {
    expect(withApiKey(T, 'abc123')).toBe(T + '?api_key=abc123');
  });

  it('uses & when the URL already has a query string', () => {
    expect(withApiKey(T + '?foo=1', 'abc')).toBe(T + '?foo=1&api_key=abc');
  });

  it('honours a custom parameter name', () => {
    expect(withApiKey('https://tile.example/{z}/{x}/{y}.png', 'k', 'key')).toBe(
      'https://tile.example/{z}/{x}/{y}.png?key=k',
    );
  });

  it('is a no-op for an empty / whitespace key', () => {
    expect(withApiKey(T, '')).toBe(T);
    expect(withApiKey(T, '   ')).toBe(T);
    expect(withApiKey(T, undefined)).toBe(T);
  });

  it('does not double-append when the parameter is already present', () => {
    expect(withApiKey(T + '?api_key=existing', 'new')).toBe(T + '?api_key=existing');
  });

  it('url-encodes the key', () => {
    expect(withApiKey(T, 'a b/c')).toBe(T + '?api_key=a%20b%2Fc');
  });
});
