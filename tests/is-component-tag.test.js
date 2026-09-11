import { describe, it, expect } from 'vitest';
import { isComponentTag } from '../src/index.js';

describe('isComponentTag', () => {
  it('accepts PascalCase tags', () => {
    expect(isComponentTag('Icon')).toBe(true);
  });

  it('accepts hyphenated tags', () => {
    expect(isComponentTag('my-element')).toBe(true);
  });

  it('rejects plain lowercase tags', () => {
    expect(isComponentTag('div')).toBe(false);
    expect(isComponentTag('span')).toBe(false);
  });
});
