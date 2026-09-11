import { describe, it, expect } from 'vitest';
import { componentFileExists } from '../src/index.js';
import { setupTmpDir } from './test-helpers.js';

describe('componentFileExists', () => {
  const fixture = setupTmpDir();

  it('returns true for a .gjs file', () => {
    fixture.writeAddon('components/icon.gjs');
    expect(componentFileExists(fixture.addonPath(), 'icon')).toBe(true);
  });

  it('returns true for a .gts file', () => {
    fixture.writeAddon('components/icon.gts');
    expect(componentFileExists(fixture.addonPath(), 'icon')).toBe(true);
  });

  it('returns true for a .js file', () => {
    fixture.writeAddon('components/icon.js');
    expect(componentFileExists(fixture.addonPath(), 'icon')).toBe(true);
  });

  it('returns true for a .ts file', () => {
    fixture.writeAddon('components/icon.ts');
    expect(componentFileExists(fixture.addonPath(), 'icon')).toBe(true);
  });

  it('returns true for a .hbs file', () => {
    fixture.writeAddon('components/icon.hbs');
    expect(componentFileExists(fixture.addonPath(), 'icon')).toBe(true);
  });

  it('returns true for a file in templates/components', () => {
    fixture.writeAddon('templates/components/form/field.hbs');
    expect(componentFileExists(fixture.addonPath(), 'form/field')).toBe(true);
  });

  it('returns false when no file exists', () => {
    expect(componentFileExists(fixture.addonPath(), 'nope')).toBe(false);
  });
});
