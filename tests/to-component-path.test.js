import { describe, it, expect } from 'vitest';
import { toComponentPath } from '../src/index.js';

describe('toComponentPath', () => {
  it('lowercases a single PascalCase token', () => {
    expect(toComponentPath('Icon')).toBe('icon');
  });

  it('dashifies a multi-word PascalCase token', () => {
    expect(toComponentPath('FormField')).toBe('form-field');
  });

  it('replaces spaces with dashes', () => {
    expect(toComponentPath('Form Input')).toBe('form-input');
  });

  it('replaces underscores with dashes', () => {
    expect(toComponentPath('form_input')).toBe('form-input');
  });

  it('converts a single lowercase token as-is', () => {
    expect(toComponentPath('icon')).toBe('icon');
  });

  it('splits :: namespaced tags and joins with /', () => {
    expect(toComponentPath('Form::Field')).toBe('form/field');
  });

  it('handles multi-segment namespaces', () => {
    expect(toComponentPath('App::Form::Input')).toBe('app/form/input');
  });

  it('dashifies each namespace segment individually', () => {
    expect(toComponentPath('FormField::InputLabel')).toBe('form-field/input-label');
  });
});
