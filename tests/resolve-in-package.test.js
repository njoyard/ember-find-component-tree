import { describe, it, expect } from 'vitest';
import { resolveInPackage } from '../src/index.js';
import { setupTmpDir } from './test-helpers.js';

describe('resolveInPackage', () => {
  const fixture = setupTmpDir();

  it('returns null when addonPath is null', () => {
    expect(resolveInPackage('Icon', 'my-components', null)).toBeNull();
  });

  it('returns the full package path when the file exists', () => {
    fixture.writeAddon('components/icon.gjs');
    expect(resolveInPackage('Icon', 'my-components', fixture.addonPath())).toBe(
      'my-components/components/icon',
    );
  });

  it('returns null when no matching file exists', () => {
    expect(resolveInPackage('Nope', 'my-components', fixture.addonPath())).toBeNull();
  });
});
