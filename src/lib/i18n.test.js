import { describe, it, expect } from 'vitest';
import { t } from './i18n.js';

describe('t(val, lang) — i18n resolver', () => {
  it('returns empty string for null', () => {
    expect(t(null, 'en')).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(t(undefined, 'fr')).toBe('');
  });

  it('passes through a plain string regardless of lang', () => {
    expect(t('hello', 'en')).toBe('hello');
    expect(t('hello', 'fr')).toBe('hello');
  });

  it('resolves a {en, fr} object by lang', () => {
    expect(t({ en: 'cat', fr: 'chat' }, 'en')).toBe('cat');
    expect(t({ en: 'cat', fr: 'chat' }, 'fr')).toBe('chat');
  });

  it('falls back to en when the requested lang key is missing', () => {
    expect(t({ en: 'only-en' }, 'fr')).toBe('only-en');
  });

  it('falls back to fr when neither requested nor en is present', () => {
    expect(t({ fr: 'only-fr' }, 'en')).toBe('only-fr');
  });

  it('returns empty string when the object has no usable key', () => {
    expect(t({ de: 'nope' }, 'en')).toBe('');
  });
});
