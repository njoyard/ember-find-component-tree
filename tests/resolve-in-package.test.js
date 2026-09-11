import { describe, it, expect } from 'vitest';
import { resolveInPackage } from '../src/index.js';
import { PKG, setupTmpDir } from './test-helpers.js';

describe('resolveInPackage', () => {
  const fixture = setupTmpDir();

  it('returns null when addonPath is null', () => {
    expect(resolveInPackage('Icon', PKG, null)).toBeNull();
  });

  it('returns the full package path when the file exists', () => {
    fixture.writeAddon('components/icon.gjs');
    expect(resolveInPackage('Icon', PKG, fixture.addonPath())).toBe(
      'my-components/components/icon',
    );
  });

  it('returns null when no matching file exists', () => {
    expect(resolveInPackage('Nope', PKG, fixture.addonPath())).toBeNull();
  });
});
